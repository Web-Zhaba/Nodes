from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from django.db import connection
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from .services import update_user_network_stability
import logging
import time
import json
from datetime import timedelta
from django.utils import timezone
from rest_framework.decorators import api_view
from .models import Impulse, Node

logger = logging.getLogger(__name__)


class StabilityRequestSerializer(serializers.Serializer):
    """Валидация входных данных для пересчёта стабильности."""
    node_id = serializers.UUIDField(required=False, allow_null=True, default=None)


class RecalculateStabilityView(APIView):
    """
    Эндпоинт для полного пересчета стабильности (при загрузке страницы).
    Синхронно обновляет все узлы и связанные ядра через ORM.
    """
    def post(self, request):
        start_time = time.perf_counter()
        serializer = StabilityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_profile = request.user
        node_id = serializer.validated_data['node_id']

        try:
            update_user_network_stability(user_profile, node_or_id=node_id)

            runtime_ms = (time.perf_counter() - start_time) * 1000
            response = Response(
                {"status": "success", "node_id": str(node_id) if node_id else None},
                status=200
            )
            response['X-Backend-Runtime-MS'] = f"{runtime_ms:.2f}"
            return response

        except Exception as e:
            logger.error(f"Calculation failed: {str(e)}")
            return Response({"status": "error", "message": "Calculation failed"}, status=500)


class ImpulseActionSerializer(serializers.Serializer):
    node_id = serializers.UUIDField()
    value = serializers.FloatField()
    date = serializers.DateField()


class ImpulseActionView(APIView):
    """
    Атомарный эндпоинт "Django Дирижер":
    1 HTTP-запрос от фронтенда → 1 SQL-вызов к Postgres → всё готово.
    
    Вся логика (impulse save + stability calc + core update) выполняется 
    внутри PostgreSQL-функции process_pulse(), что сводит сетевые roundtrips
    к абсолютному минимуму.
    """
    def post(self, request):
        start_time = time.perf_counter()
        serializer = ImpulseActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = str(request.user.id)
        node_id = str(serializer.validated_data['node_id'])
        value = float(serializer.validated_data['value'])
        target_date = serializer.validated_data['date']

        try:
            # === ОДИН SQL-запрос. Вся логика внутри PostgreSQL. ===
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT process_pulse(%s::uuid, %s::uuid, %s::numeric, %s::date)",
                    [user_id, node_id, value, target_date]
                )
                raw_result = cursor.fetchone()[0]

            # raw_result — это JSONB, Django возвращает его как dict или str
            if isinstance(raw_result, str):
                result = json.loads(raw_result)
            else:
                result = raw_result

            runtime_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"[PERF] process_pulse() completed in {runtime_ms:.2f}ms")

            if result.get('error'):
                return Response(
                    {"status": "error", "message": result['error']},
                    status=404
                )

            response = Response({
                "status": "success",
                "node_id": result.get('node_id'),
                "new_stability_score": result.get('new_stability_score')
            }, status=200)

            response['X-Backend-Runtime-MS'] = f"{runtime_ms:.2f}"
            return response

        except Exception as e:
            logger.error(f"Impulse action failed: {str(e)}", exc_info=True)
            return Response({"status": "error", "message": "Action failed"}, status=500)

@api_view(['GET'])
def get_analytics_history(request):
    try:
        start_time = time.perf_counter()
        user = request.user
        days = min(int(request.query_params.get('days', 365)), 730)  # макс 2 года
        limit_date = (timezone.now() - timedelta(days=days)).date()

        user_nodes = Node.objects.filter(user=user).values('id', 'name', 'color', 'target_value')
        nodes_list = [
            {'id': str(n['id']), 'name': n['name'], 'color': n['color']}
            for n in user_nodes
        ]

        from engine.services import DECAY_RATE_PER_DAY, calculate_pulse_impact, MAX_STABILITY
        
        # --- 2. Симуляция исторической стабильности по дням ---
        today = timezone.now().date()
        
        # Вытягиваем сырые словари вместо ORM объектов (ускорение в ~5-10 раз, экономия памяти)
        all_impulses = Impulse.objects.filter(node__user=user).values(
            'node_id', 'completed_at', 'value'
        ).order_by('completed_at')
        
        node_impulses = {}
        for imp in all_impulses:
            node_impulses.setdefault(imp['node_id'], []).append(imp)
            
        stability_series = []
        
        for n in user_nodes:
            n_id = n['id']
            t_val = float(n['target_value'] or 0)
            imps = node_impulses.get(n_id, [])
            
            current_stability = 0.0
            
            # 1. Считаем начальную стабильность до limit_date
            pre_limit = [i for i in imps if i['completed_at'] < limit_date]
            post_limit_dict = {}
            for i in [i for i in imps if i['completed_at'] >= limit_date]:
                post_limit_dict.setdefault(i['completed_at'], []).append(i)
                
            if pre_limit:
                last_date = pre_limit[0]['completed_at']
                for p in pre_limit:
                    days_passed = (p['completed_at'] - last_date).days
                    if days_passed > 0:
                        current_stability *= (1 - DECAY_RATE_PER_DAY) ** days_passed
                    current_stability += calculate_pulse_impact(p['value'], t_val)
                    if current_stability > MAX_STABILITY: current_stability = MAX_STABILITY
                    last_date = p['completed_at']
                    
                # Охлаждение от последнего импульса до limit_date
                days_passed = (limit_date - last_date).days
                if days_passed > 0:
                    current_stability *= (1 - DECAY_RATE_PER_DAY) ** days_passed
            
            # 2. Фиксируем стабильность для каждого дня в периоде графика
            last_date = limit_date
            for day_offset in range((today - limit_date).days + 1):
                current_day = limit_date + timedelta(days=day_offset)
                
                days_passed = (current_day - last_date).days
                if days_passed > 0:
                    current_stability *= (1 - DECAY_RATE_PER_DAY) ** days_passed
                    
                day_imps = post_limit_dict.get(current_day, [])
                for p in day_imps:
                    current_stability += calculate_pulse_impact(p['value'], t_val)
                    if current_stability > MAX_STABILITY: current_stability = MAX_STABILITY
                    
                last_date = current_day
                
                stability_series.append({
                    'date': str(current_day),
                    'node_id': str(n_id),
                    'stability_score': round(current_stability, 2),
                    'pulse_count': len(day_imps),
                })

        # --- 3. Группировка импульсов по дню (суммарно) ---
        daily_totals = (
            Impulse.objects
            .filter(node__user=user, completed_at__gte=limit_date)
            .values('completed_at')
            .annotate(count=Count('id'))
            .order_by('completed_at')
        )

        heatmap = [
            {
                'date': str(row['completed_at']),
                'count': row['count'],
            }
            for row in daily_totals
        ]
        
        runtime_ms = (time.perf_counter() - start_time) * 1000
        logger.info(f"Analytics generated in {runtime_ms:.2f}ms")

        return Response({
            'status': 'ok',
            'nodes': nodes_list,
            'stability_series': stability_series,
            'heatmap': heatmap,
            'debug': {'runtime_ms': round(runtime_ms, 2)}
        })
    except Exception as e:
        import traceback
        return Response({"status": "error", "message": str(e), "traceback": traceback.format_exc()}, status=500)
