from django.utils import timezone
from django.db.models import Prefetch
from datetime import timedelta
from .models import Node, Impulse, Core, CoreConnector
import logging

logger = logging.getLogger(__name__)

# Базовые константы
BASE_PULSE_BUMP = 20.0  # Базовый приток стабильности за 1 выполнение (%)
MAX_OVERDRIVE_MULTIPLIER = 1.5  # Максимум 150% (50% бонус)
DECAY_RATE_PER_DAY = 0.05  # 5% угасания каждый день бездействия (можно настраивать)
MAX_STABILITY = 100.0


def calculate_pulse_impact(value, target_value):
    """
    Рассчитывает силу импульса с учетом недовыполнения или Overdrive (макс 50% бонус).
    """
    if target_value is None or target_value <= 0:
        return BASE_PULSE_BUMP  # Для типов Binary или без цели — считаем как 100% выполнение

    value = float(value) if value is not None else 0.0
    target_value = float(target_value)
    
    # % выполнения (например, 80 / 100 = 0.8)
    completion_ratio = value / target_value
    
    # бонус максимум 1.5 (150%)
    if completion_ratio > MAX_OVERDRIVE_MULTIPLIER:
        completion_ratio = MAX_OVERDRIVE_MULTIPLIER

    # Возвращаем процент, который прибавится к стабильности узла
    return BASE_PULSE_BUMP * completion_ratio


def recalculate_node_stability(node, prefetched_impulses=None):
    """
    Перессчитывает stability_score узла за последние 30 дней.
    Если prefetched_impulses передан, используем их без доп. SQL-запроса.
    """
    cutoff = timezone.now().date() - timedelta(days=30)

    if prefetched_impulses is not None:
        impulses = sorted(
            [i for i in prefetched_impulses if i.completed_at >= cutoff],
            key=lambda i: i.completed_at
        )
    else:
        impulses = list(
            Impulse.objects.filter(node=node, completed_at__gte=cutoff)
            .order_by('completed_at')
        )

    if not impulses:
        return 0.0

    current_stability = 0.0
    last_date = impulses[0].completed_at

    for pulse in impulses:
        days_passed = (pulse.completed_at - last_date).days
        if days_passed > 0:
            decay_factor = (1 - DECAY_RATE_PER_DAY) ** days_passed
            current_stability *= decay_factor

        impact = calculate_pulse_impact(pulse.value, node.target_value)
        current_stability += impact

        if current_stability > MAX_STABILITY:
            current_stability = MAX_STABILITY

        last_date = pulse.completed_at

    today = timezone.now().date()
    days_since_last_pulse = (today - last_date).days
    if days_since_last_pulse > 0:
        decay_factor = (1 - DECAY_RATE_PER_DAY) ** days_since_last_pulse
        current_stability *= decay_factor

    logger.debug(f"Stability '{node.name}': {round(current_stability, 2)}")
    return round(current_stability, 2)


def update_user_network_stability(user_profile, node_id=None):
    """
    Основная точка входа для обновления стабильности.
    Если передан node_id, обновляем только этот узел и зависимые ядра.
    Иначе — весь граф пользователя.
    """
    if node_id:
        # ПАРЦИАЛЬНОЕ ОБНОВЛЕНИЕ
        try:
            node = Node.objects.get(id=node_id, user=user_profile)
            node.stability_score = recalculate_node_stability(node)
            node.save(update_fields=['stability_score', 'updated_at'])
            print(f"Optimized recalculation for node '{node.name}': {node.stability_score}")
            
            # Пересчитываем только ядра, связанные с этим узлом
            # Узел -> NodeConnector -> Connector -> CoreConnector -> Core
            node_connectors = node.node_connectors.all()
            for nc in node_connectors:
                # Находим все CoreConnector, которые ссылаются на этот же коннектор
                c_conns = CoreConnector.objects.filter(connector=nc.connector)
                for cc in c_conns:
                    recalculate_core_stability(cc.core, user_profile)
        except Node.DoesNotExist:
            logger.warning(f"Node {node_id} not found for user {user_profile.id}")
            return
    else:
        # ПОЛНОЕ ОБНОВЛЕНИЕ: один запрос за все узлы + сразу все импульсы (prefetch)
        cutoff = timezone.now().date() - timedelta(days=30)
        nodes = user_profile.nodes.prefetch_related(
            Prefetch(
                'impulses',
                queryset=Impulse.objects.filter(
                    completed_at__gte=cutoff
                ).order_by('completed_at')
            )
        ).all()
        for node in nodes:
            prefetched = list(node.impulses.all())
            node.stability_score = recalculate_node_stability(node, prefetched_impulses=prefetched)
            node.save(update_fields=['stability_score', 'updated_at'])
            logger.debug(f"Full refresh: '{node.name}' -> {node.stability_score}")

        cores = user_profile.cores.all()
        for core in cores:
            recalculate_core_stability(core, user_profile)

def recalculate_core_stability(core, user_profile):
    """
    Расчет стабильности ядра как среднего арифметического стабильностей связанных узлов.
    Ядро -> CoreConnector -> Connector -> NodeConnector -> Node
    """
    # 1. Получаем все коннекторы этого ядра
    core_conns = core.core_connectors.all()
    connector_ids = core_conns.values_list('connector_id', flat=True)
    
    # 2. Находим все узлы, у которых есть хотя бы один из этих коннекторов
    core_nodes = Node.objects.filter(
        user=user_profile,
        node_connectors__connector_id__in=connector_ids
    ).distinct()
    
    if core_nodes.exists():
        avg_stability = sum(n.stability_score for n in core_nodes) / core_nodes.count()
        core.stability_score = round(avg_stability, 2)
        core.save(update_fields=['stability_score', 'updated_at'])
        print(f"Updated core '{core.name}' stability: {core.stability_score}")
    else:
        core.stability_score = 0.0
        core.save(update_fields=['stability_score', 'updated_at'])
