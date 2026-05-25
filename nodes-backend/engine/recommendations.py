# Copyright (c) 2026 Web-Zhaba. All rights reserved.
# This file is part of Nodes and is proprietary software.

import logging
import concurrent.futures
import random
from django.db.models import Sum, F, FloatField, Prefetch, ExpressionWrapper
from .models import Connector, Recommendation, Profile, Node, RecommendationConnector
from .providers.youtube import YouTubeProvider
from .providers.google_books import GoogleBooksProvider
from .providers.github import GitHubProvider
from .providers.stepik import StepikProvider
from .providers.habr import HabrProvider
from .providers.admitad import AdmitadProvider

logger = logging.getLogger(__name__)

class ContentRecommender:
    def __init__(self, user_profile: Profile):
        self.user = user_profile
        self.providers = [
            YouTubeProvider(),
            GoogleBooksProvider(),
            GitHubProvider(),
            StepikProvider(),
            HabrProvider(),
            AdmitadProvider()
        ]

    def get_top_interests(self, limit=3):
        """
        Собирает топ активных узлов.
        """
        top_nodes = Node.objects.filter(user=self.user) \
            .annotate(
                total_weight=ExpressionWrapper(
                    F('stability_score') + (F('completion_count') * 0.1),
                    output_field=FloatField()
                )
            ) \
            .filter(total_weight__gt=0) \
            .select_related('core') \
            .prefetch_related('node_connectors__connector') \
            .order_by('-total_weight')[:limit]
        
        return top_nodes

    def _fetch_from_provider(self, provider, query):
        try:
            return provider.fetch(query)
        except Exception as e:
            logger.error(f"Provider {provider.__class__.__name__} failed: {e}")
            return []

    def generate_recommendations(self, use_limited_apis=True):
        """
        Основной цикл генерации: Узел -> Ядро + Теги -> Контент.
        """
        active_nodes = self.get_top_interests()
        if not active_nodes:
            logger.info(f"No active nodes found for user {self.user.id}")
            return

        tasks = []
        for node in active_nodes:
            # Собираем контекст: Название + Ядро + Все теги
            connectors = [nc.connector for nc in node.node_connectors.all()]
            tag_names = [c.name for c in connectors]
            core_name = node.core.name if node.core else ""
            
            # Формируем уникальный набор ключевых слов
            context_parts = list(set(filter(None, [core_name] + tag_names + [node.name])))
            query = " ".join(context_parts)
            
            weight = float(node.total_weight or 0)
            for provider in self.providers:
                # Проверка на лимитированные API
                if not use_limited_apis and getattr(provider, 'is_rate_limited', False):
                    continue

                tasks.append({
                    'provider': provider,
                    'query': query,
                    'node': node,
                    'connectors': connectors,
                    'weight': weight
                })

        new_items_data = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
            future_to_task = {
                executor.submit(self._fetch_from_provider, t['provider'], t['query']): t 
                for t in tasks
            }
            
            for future in concurrent.futures.as_completed(future_to_task):
                task = future_to_task[future]
                items = future.result()
                if not items: continue
                
                # Выбираем случайные 3 элемента из расширенного пула провайдера (если их > 3)
                sampled_items = random.sample(items, min(len(items), 3))
                
                for i, item in enumerate(sampled_items):
                    quality_factor = max(0.5, 1.0 - (i * 0.05))
                    item['score'] = task['weight'] * quality_factor
                    item['node'] = task['node']
                    item['connectors'] = task['connectors']
                    new_items_data.append(item)

        if not new_items_data:
            return []

        # Массовое обновление и создание
        urls = [item['url'] for item in new_items_data]
        existing_recs = {
            r.url: r for r in Recommendation.objects.filter(user=self.user, url__in=urls)
        }

        to_update = []
        to_create = []
        # Собираем данные для M2M связей: url -> list of connector objects
        url_to_connectors = {}
        seen_urls = set()

        for item in new_items_data:
            url = item['url']
            if url in seen_urls: continue
            seen_urls.add(url)
            
            url_to_connectors[url] = item['connectors']

            if url in existing_recs:
                rec = existing_recs[url]
                rec.node = item['node']
                rec.content_type = item['content_type']
                rec.title = item['title']
                rec.description = item['description']
                rec.thumbnail_url = item['thumbnail_url']
                rec.source = item['source']
                rec.score = item['score']
                to_update.append(rec)
            else:
                to_create.append(Recommendation(
                    user=self.user,
                    url=url,
                    node=item['node'],
                    content_type=item['content_type'],
                    title=item['title'],
                    description=item['description'],
                    thumbnail_url=item['thumbnail_url'],
                    source=item['source'],
                    score=item['score']
                ))

        if to_update:
            Recommendation.objects.bulk_update(to_update, [
                'node', 'content_type', 'title', 'description', 
                'thumbnail_url', 'source', 'score'
            ])
        
        if to_create:
            Recommendation.objects.bulk_create(to_create)

        # Обновляем M2M связи для всех затронутых рекомендаций
        all_affected_urls = list(url_to_connectors.keys())
        all_recs = Recommendation.objects.filter(user=self.user, url__in=all_affected_urls)
        
        # Сначала удаляем старые связи для обновляемых
        RecommendationConnector.objects.filter(recommendation__in=all_recs).delete()
        
        # Теперь массово создаем новые связи
        m2m_to_create = []
        for rec in all_recs:
            connectors = url_to_connectors.get(rec.url, [])
            for conn in connectors:
                m2m_to_create.append(RecommendationConnector(
                    recommendation=rec,
                    connector=conn
                ))
        
        if m2m_to_create:
            RecommendationConnector.objects.bulk_create(m2m_to_create, ignore_conflicts=True)

        logger.info(f"Generated/Updated recommendations for {len(active_nodes)} nodes")
        return to_create

