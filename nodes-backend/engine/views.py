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
from django.core.cache import cache
from .models import Impulse, Node, Recommendation, GenerationLog
from .serializers import RecommendationSerializer
from .recommendations import ContentRecommender
from rest_framework import generics

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

        logger.info(f"Impulse request: user={user_id}, node={node_id}, val={value}, date={target_date}")

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

            # Инвалидируем кэш аналитики пользователя
            cache_key = f"analytics_history_{user_id}_*"
            # В Django нельзя удалять по маске напрямую в дефолтном кэше (LocMem/Redis), 
            # но мы знаем, что обычно запрашивают 365 дней.
            cache.delete(f"analytics_history_{user_id}_365")
            cache.delete(f"analytics_history_{user_id}_30")
            cache.delete(f"analytics_history_{user_id}_90")
            cache.delete(f"analytics_history_{user_id}_7")

            response = Response({
                "status": "success",
                "node_id": result.get('node_id'),
                "new_stability_score": result.get('new_stability_score'),
                "new_completion_count": result.get('new_completion_count')
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
        days = min(int(request.query_params.get('days', 365)), 730)
        
        # --- 0. Проверка лимитов по подписке ---
        # Free-пользователи могут видеть только последние 30 дней
        if not user.is_active_pro:
            days = min(days, 30)
            logger.info(f"[LIMIT] Analytics limited to 30 days for free user {user.id}")

        # --- 1. Проверка кэша ---
        cache_key = f"analytics_history_{user.id}_{days}"
        cached_data = cache.get(cache_key)
        if cached_data:
            runtime_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"[CACHE HIT] Analytics for user {user.id} returned in {runtime_ms:.2f}ms")
            cached_data['debug']['runtime_ms'] = round(runtime_ms, 2)
            cached_data['debug']['cached'] = True
            return Response(cached_data)

        limit_date = (timezone.now() - timedelta(days=days)).date()

        user_nodes = Node.objects.filter(user=user).values('id', 'name', 'color', 'target_value')
        nodes_list = [
            {'id': str(n['id']), 'name': n['name'], 'color': n['color']}
            for n in user_nodes
        ]

        from engine.services import DECAY_RATE_PER_DAY, calculate_pulse_impact, MAX_STABILITY
        
        # Константа затухания для одного дня
        DECAY_FACTOR = (1 - DECAY_RATE_PER_DAY)
        
        # --- 2. Симуляция исторической стабильности по дням ---
        today = timezone.now().date()
        
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
            
            # Предварительная фильтрация импульсов до и после лимита
            pre_limit = [i for i in imps if i['completed_at'] < limit_date]
            post_limit_dict = {}
            for i in imps:
                if i['completed_at'] >= limit_date:
                    post_limit_dict.setdefault(i['completed_at'], []).append(i)
                
            if pre_limit:
                last_date = pre_limit[0]['completed_at']
                for p in pre_limit:
                    days_passed = (p['completed_at'] - last_date).days
                    if days_passed > 0:
                        current_stability *= (DECAY_FACTOR ** days_passed)
                    current_stability += calculate_pulse_impact(p['value'], t_val)
                    if current_stability > MAX_STABILITY: current_stability = MAX_STABILITY
                    last_date = p['completed_at']
                    
                days_passed = (limit_date - last_date).days
                if days_passed > 0:
                    current_stability *= (DECAY_FACTOR ** days_passed)
            
            # Основной цикл по дням (оптимизирован)
            for day_offset in range((today - limit_date).days + 1):
                current_day = limit_date + timedelta(days=day_offset)
                
                # Мы идем по дням шагом в 1 день, поэтому просто умножаем на DECAY_FACTOR
                # Пропускаем умножение только для самого первого дня (limit_date)
                if current_day > limit_date:
                    current_stability *= DECAY_FACTOR
                    
                day_imps = post_limit_dict.get(current_day, [])
                for p in day_imps:
                    current_stability += calculate_pulse_impact(p['value'], t_val)
                    if current_stability > MAX_STABILITY: current_stability = MAX_STABILITY
                    
                stability_series.append({
                    'date': str(current_day),
                    'node_id': str(n_id),
                    'stability_score': round(current_stability, 2),
                    'pulse_count': len(day_imps),
                })

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
        logger.info(f"[PERF] Analytics GENERATED in {runtime_ms:.2f}ms for user {user.id}")
        
        response_data = {
            'status': 'ok',
            'nodes': nodes_list,
            'stability_series': stability_series,
            'heatmap': heatmap,
            'debug': {'runtime_ms': round(runtime_ms, 2), 'cached': False}
        }

        # Сохраняем в кэш на 5 минут
        cache.set(cache_key, response_data, 60 * 5)

        return Response(response_data)
    except Exception as e:
        import traceback
        return Response({"status": "error", "message": str(e), "traceback": traceback.format_exc()}, status=500)

class RecommendationListView(generics.ListAPIView):
    serializer_class = RecommendationSerializer

    def list(self, request, *args, **kwargs):
        user = self.request.user
        cache_key = f"user_recs_list_{user.id}"
        
        # Пытаемся взять готовый отрендеренный результат
        cached_response = cache.get(cache_key)
        if cached_response:
            return Response(cached_response)
            
        response = super().list(request, *args, **kwargs)
        
        # Кэшируем результат на 2 минуты для мгновенных повторных просмотров
        if response.status_code == 200:
            cache.set(cache_key, response.data, 120)
            
        return response

    def get_queryset(self):
        user = self.request.user
        # Триггерим генерацию если рекомендаций нет
        if not Recommendation.objects.filter(user=user, is_discarded=False).exists():
            today = timezone.now().date()
            used_today = GenerationLog.objects.filter(
                user=user, 
                action_type='recommendation_generation',
                created_at__date=today
            ).count()
            
            if used_today < 3:
                try:
                    recommender = ContentRecommender(user)
                    recommender.generate_recommendations()
                    GenerationLog.objects.create(user=user, action_type='recommendation_generation')
                except Exception as e:
                    logger.error(f"Failed to generate recommendations for user {user.id}: {e}")
        
        return Recommendation.objects.filter(
            user=user,
            is_discarded=False
        ).prefetch_related('connectors', 'node').order_by('-score', '-created_at')

class RecommendationUpdateView(generics.UpdateAPIView):
    serializer_class = RecommendationSerializer
    
    def get_queryset(self):
        return Recommendation.objects.filter(user=self.request.user)

class RecommendationStatusView(APIView):
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        used_today = GenerationLog.objects.filter(
            user=user, 
            action_type='recommendation_generation',
            created_at__date=today
        ).count()
        
        limit = 3  # TODO: Fetch from profile/subscription in future
        
        return Response({
            "limit": limit,
            "used": used_today,
            "remaining": max(0, limit - used_today),
            "can_generate": True, # Всегда можно обновить (безлимитные API)
            "limited_available": used_today < limit
        }, status=200)

class RecommendationGenerateView(APIView):
    def post(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Check limits
        used_today = GenerationLog.objects.filter(
            user=user, 
            action_type='recommendation_generation',
            created_at__date=today
        ).count()
        
        limit = 3
        use_limited = used_today < limit

        # Удаляем старые, не сохраненные и не просмотренные рекомендации
        query = Recommendation.objects.filter(user=user, is_saved=False, is_viewed=False)
        
        if not use_limited:
            # Если лимит исчерпан, ОСТАВЛЯЕМ видео и книги из прошлых генераций
            # и удаляем только все остальное (Habr, GitHub, Admitad), чтобы обновить их
            query = query.exclude(source__in=['YouTube', 'Google Books'])
            
        query.delete()
        
        try:
            recommender = ContentRecommender(user)
            recommender.generate_recommendations(use_limited_apis=use_limited)
            
            # Логируем использование лимитированных API только если они реально использовались
            if use_limited:
                GenerationLog.objects.create(user=user, action_type='recommendation_generation')
            
            return Response({
                "status": "success", 
                "message": "Recommendations updated",
                "limited_used": use_limited
            }, status=200)
        except Exception as e:
            logger.error(f"Failed manual generation for user {user.id}: {e}")
            return Response({"status": "error", "message": str(e)}, status=500)

# --- YooKassa Integration ---

from yookassa import Configuration, Payment
from django.conf import settings
import os
import uuid
import ipaddress

# Конфигурация ЮKassa (ShopID и SecretKey должны быть в .env)
Configuration.configure(
    os.getenv('YOOKASSA_SHOP_ID'), 
    os.getenv('YOOKASSA_SECRET_KEY')
)

# Актуальные IP-адреса ЮKassa для проверки вебхуков
# Документация: https://yookassa.ru/developers/payment-acceptance/getting-started/webhooks#ips
YOOKASSA_IPS = [
    '185.71.76.0/27',
    '185.71.77.0/27',
    '77.75.153.0/25',
    '77.75.156.11',
    '77.75.156.35',
]

def is_yookassa_ip(ip):
    """Проверяет, что IP адрес отправителя принадлежит ЮKassa."""
    if not ip:
        return False
    try:
        client_ip = ipaddress.ip_address(ip)
        for network in YOOKASSA_IPS:
            if '/' in network:
                if client_ip in ipaddress.ip_network(network):
                    return True
            else:
                if client_ip == ipaddress.ip_address(network):
                    return True
    except ValueError:
        return False
    return False

# Пакеты подписки (соответствуют фронтенду)
PACKAGES = {
    '1m': {'months': 1,  'price': 199},
    '3m': {'months': 3,  'price': 537},
    '6m': {'months': 6,  'price': 1015},
    '1y': {'months': 12, 'price': 1910},
}

class CreatePaymentView(APIView):
    """Создает платеж в ЮKassa и возвращает ссылку для оплаты."""
    def post(self, request):
        user = request.user
        package_id = request.data.get('package_id')
        
        if package_id not in PACKAGES:
            return Response({"status": "error", "message": "Invalid package"}, status=400)
            
        package = PACKAGES[package_id]
        
        # Генерируем ключ идемпотентности для предотвращения дублей
        # Документация: https://yookassa.ru/developers/payment-acceptance/getting-started/quick-start#step-2
        idempotency_key = str(uuid.uuid4())
        
        try:
            # Создаем платеж в ЮKassa
            payment = Payment.create({
                "amount": {
                    "value": str(package['price']),
                    "currency": "RUB"
                },
                "confirmation": {
                    "type": "redirect",
                    "return_url": os.getenv('SITE_URL', 'https://nodes.app') + "/profile"
                },
                "capture": True,
                "description": f"Nodes Pro - {package_id} (user: {user.email})",
                "metadata": {
                    "user_id": str(user.id),
                    "package_id": package_id,
                    "months": package['months']
                }
            }, idempotency_key)
            
            # Сохраняем ID платежа для трекинга
            user.yookassa_payment_id = payment.id
            user.save()
            
            return Response({
                "status": "success",
                "confirmation_url": payment.confirmation.confirmation_url
            })
            
        except Exception as e:
            logger.error(f"Yookassa payment creation failed: {e}")
            return Response({"status": "error", "message": str(e)}, status=500)

class YookassaWebhookView(APIView):
    """Принимает уведомления от ЮKassa об успешной оплате."""
    permission_classes = [] # Вебхук вызывается без авторизации Bearer
    authentication_classes = []

    def post(self, request):
        # Конфигурируем SDK для проверки статуса через API
        Configuration.configure(
            os.getenv('YOOKASSA_SHOP_ID'), 
            os.getenv('YOOKASSA_SECRET_KEY')
        )
        
        # 1. Проверка IP отправителя (Безопасность)
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')

        if not is_yookassa_ip(ip) and not settings.DEBUG:
            logger.warning(f"[PAYMENT] Unauthorized webhook attempt from IP: {ip}")
            return Response({"status": "error", "message": "Forbidden"}, status=403)

        event_json = request.data
        
        # Мы обрабатываем только успешные платежи
        if event_json.get('event') == 'payment.succeeded':
            payment_obj = event_json.get('object')
            
            # 2. Дополнительная проверка статуса через API ЮKassa (Double-check)
            try:
                payment_info = Payment.find(payment_obj.get('id'))
                if payment_info.status != 'succeeded':
                    logger.warning(f"[PAYMENT] Webhook claimed success but status is {payment_info.status}")
                    return Response({"status": "ignored"})
            except Exception as e:
                logger.error(f"[PAYMENT] Failed to verify payment via API: {e}")
                return Response({"status": "error"}, status=500)

            metadata = payment_obj.get('metadata')
            user_id = metadata.get('user_id')
            months = int(metadata.get('months', 1))
            
            try:
                profile = Profile.objects.get(id=user_id)
                
                # Рассчитываем новую дату истечения
                now = timezone.now()
                # Если Pro уже есть — продлеваем, если нет — считаем от сегодня
                current_expiry = profile.pro_expires_at if profile.is_active_pro else now
                
                # Добавляем месяцы (грубое приближение через 30 дней)
                new_expiry = current_expiry + timedelta(days=30 * months)
                
                profile.is_pro = True
                profile.pro_expires_at = new_expiry
                profile.subscription_plan = 'pro'
                profile.save()
                
                logger.info(f"[PAYMENT] Successfully activated Pro for user {profile.email} until {new_expiry}")
                return Response({"status": "ok"})
                
            except Profile.DoesNotExist:
                logger.error(f"[PAYMENT] User {user_id} not found for payment {payment_obj.get('id')}")
                
        return Response({"status": "ignored"})
