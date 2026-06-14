# Copyright (c) 2026 Web-Zhaba. All rights reserved.
# This file is part of Nodes and is proprietary software.

import logging
import concurrent.futures
import random
from django.db.models import Sum, F, FloatField, Prefetch, ExpressionWrapper
from django.db import transaction
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
        
        top_nodes_list = list(top_nodes)
        
        # Если нет активных узлов с весом > 0, но узлы вообще есть, берем любые последние
        if not top_nodes_list:
            fallback_nodes = Node.objects.filter(user=self.user) \
                .annotate(
                    total_weight=ExpressionWrapper(
                        F('stability_score') + (F('completion_count') * 0.1) + 1.0,
                        output_field=FloatField()
                    )
                ) \
                .select_related('core') \
                .prefetch_related('node_connectors__connector') \
                .order_by('-created_at')[:limit]
            top_nodes_list = list(fallback_nodes)
            
        return top_nodes_list

    def _get_queries_for_context(self, node_name: str, core_name: str, tag_names: list) -> list:
        queries = []
        node_name = node_name.strip()
        core_name = core_name.strip() if core_name else ""
        tag_names = [t.strip() for t in tag_names if t]
        
        # 1. Специфичное сочетание: имя узла + первый тег (или ядро)
        if tag_names:
            queries.append(f"{node_name} {tag_names[0]}")
        elif core_name:
            queries.append(f"{node_name} {core_name}")
            
        # 2. Имя узла само по себе
        queries.append(node_name)
        
        # 3. Общая сфера (ядро + все теги)
        broad_parts = list(set(filter(None, [core_name] + tag_names)))
        if broad_parts:
            queries.append(" ".join(broad_parts))
            
        # Дедупликация с сохранением порядка
        seen = set()
        unique_queries = []
        for q in queries:
            q_clean = " ".join(q.split())
            if q_clean and q_clean not in seen:
                seen.add(q_clean)
                unique_queries.append(q_clean)
                
        return unique_queries

    def _fetch_from_provider(self, provider, queries):
        for query in queries:
            try:
                res = provider.fetch(query)
                if res:
                    logger.info(f"Provider {provider.__class__.__name__} succeeded with query: '{query}' ({len(res)} items)")
                    return res
            except Exception as e:
                logger.error(f"Provider {provider.__class__.__name__} failed for query '{query}': {e}")
        return []

    def generate_recommendations(self, use_limited_apis=True):
        """
        Основной цикл генерации: Узел -> Ядро + Теги -> Контент.
        """
        active_nodes = self.get_top_interests()
        tasks = []
        
        if active_nodes:
            for node in active_nodes:
                # Собираем контекст: Название + Ядро + Все теги
                connectors = [nc.connector for nc in node.node_connectors.all()]
                tag_names = [c.name for c in connectors]
                core_name = node.core.name if node.core else ""
                
                queries = self._get_queries_for_context(node.name, core_name, tag_names)
                weight = float(node.total_weight or 0)
                
                for provider in self.providers:
                    # Проверка на лимитированные API
                    if not use_limited_apis and getattr(provider, 'is_rate_limited', False):
                        continue

                    tasks.append({
                        'provider': provider,
                        'queries': queries,
                        'node': node,
                        'connectors': connectors,
                        'weight': weight
                    })
        else:
            # Если у пользователя вообще нет узлов (новый пользователь), генерируем общие рекомендации
            logger.info(f"No nodes found for user {self.user.id}. Generating onboarding recommendations.")
            default_topics = [
                {"name": "Саморазвитие", "core_name": "Личность", "tags": ["продуктивность", "привычки"]},
                {"name": "Здоровый образ жизни", "core_name": "Тело", "tags": ["спорт", "медитация"]},
                {"name": "Программирование", "core_name": "Карьера", "tags": ["обучение", "разработка"]}
            ]
            
            for topic in default_topics:
                # Получаем или создаем коннекторы, чтобы теги отображались на фронте
                connectors = []
                for tag in topic["tags"]:
                    conn, _ = Connector.objects.get_or_create(
                        user=self.user,
                        name=tag,
                        defaults={'color': random.choice(['#818CF8', '#34D399', '#F472B6', '#FBBF24', '#38BDF8', '#A78BFA'])}
                    )
                    connectors.append(conn)
                
                queries = self._get_queries_for_context(topic["name"], topic["core_name"], topic["tags"])
                weight = 1.0  # Базовый вес для дефолтных интересов
                
                for provider in self.providers:
                    if not use_limited_apis and getattr(provider, 'is_rate_limited', False):
                        continue
                        
                    tasks.append({
                        'provider': provider,
                        'queries': queries,
                        'node': None,
                        'connectors': connectors,
                        'weight': weight
                    })

        new_items_data = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as executor:
            future_to_task = {
                executor.submit(self._fetch_from_provider, t['provider'], t['queries']): t 
                for t in tasks
            }
            
            for future in concurrent.futures.as_completed(future_to_task):
                task = future_to_task[future]
                items = future.result()
                if not items: continue
                
                # Выбираем случайные 3 элемента из результатов
                sampled_items = random.sample(items, min(len(items), 3))
                
                for i, item in enumerate(sampled_items):
                    quality_factor = max(0.5, 1.0 - (i * 0.05))
                    item['score'] = task['weight'] * quality_factor
                    item['node'] = task['node']
                    item['connectors'] = task['connectors']
                    new_items_data.append(item)

        if not new_items_data:
            return []

        # Группируем по URL для дедупликации, берем максимальный вес и объединяем теги
        url_to_item = {}
        for item in new_items_data:
            url = item['url']
            if url not in url_to_item:
                url_to_item[url] = {
                    'title': item['title'],
                    'description': item['description'],
                    'url': url,
                    'thumbnail_url': item['thumbnail_url'],
                    'source': item['source'],
                    'content_type': item['content_type'],
                    'score': item['score'],
                    'node': item.get('node'),
                    'connectors': list(item.get('connectors') or [])
                }
            else:
                existing = url_to_item[url]
                # Сливаем коннекторы (уникальные по id)
                existing_conn_ids = {c.id for c in existing['connectors']}
                for conn in (item.get('connectors') or []):
                    if conn.id not in existing_conn_ids:
                        existing['connectors'].append(conn)
                        existing_conn_ids.add(conn.id)
                # Берем максимальный скор и соответствующий узел
                if item['score'] > existing['score']:
                    existing['score'] = item['score']
                    existing['node'] = item.get('node')

        urls = list(url_to_item.keys())

        with transaction.atomic():
            # Очищаем старые, не сохраненные и не просмотренные рекомендации
            old_recs_query = Recommendation.objects.filter(user=self.user, is_saved=False, is_viewed=False)
            if not use_limited_apis:
                # Если лимит исчерпан, ОСТАВЛЯЕМ видео и книги из прошлых генераций
                old_recs_query = old_recs_query.exclude(source__in=['YouTube', 'Google Books'])
            old_recs_query.delete()

            # Находим существующие сохраненные/просмотренные рекомендации, которые повторились
            existing_recs = {
                r.url: r for r in Recommendation.objects.filter(user=self.user, url__in=urls)
            }

            to_update = []
            to_create = []
            url_to_connectors = {}

            for url, item in url_to_item.items():
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

            # Обновляем связи для всех сгенерированных рекомендаций
            all_recs = Recommendation.objects.filter(user=self.user, url__in=urls)
            RecommendationConnector.objects.filter(recommendation__in=all_recs).delete()

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

        logger.info(f"Generated/Updated {len(url_to_item)} recommendations for user {self.user.id}")
        return to_create

