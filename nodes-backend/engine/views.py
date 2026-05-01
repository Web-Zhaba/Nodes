from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from django.db import connection
from .services import update_user_network_stability
import logging
import time
import json

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
