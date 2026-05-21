import logging
import requests
import os
import hashlib
from django.core.cache import cache

logger = logging.getLogger(__name__)

class GitHubProvider:
    def __init__(self):
        self.token = os.getenv('GITHUB_TOKEN')
        self.base_url = "https://api.github.com/search/repositories"
        self.cache_timeout = 60 * 60 * 24 # 24 часа

    def _generate_cache_key(self, query):
        query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        return f"provider_github_{query_hash}"

    def fetch(self, query, max_results=15):
        cache_key = self._generate_cache_key(query)
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            return cached_result

        headers = {
            "Accept": "application/vnd.github.v3+json"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"

        params = {
            'q': f"{query.strip()} stars:>10", # Ищем качественные репозитории со звездами
            'sort': 'relevance', # Релевантность важнее звезд при специфичных запросах
            'order': 'desc',
            'per_page': max_results
        }

        try:
            response = requests.get(self.base_url, headers=headers, params=params, timeout=3)
            response.raise_for_status()
            data = response.json()
            
            result = [{
                'title': item['full_name'],
                'description': item['description'] or f"GitHub repository for {query}",
                'url': item['html_url'],
                'thumbnail_url': item['owner']['avatar_url'],
                'source': 'GitHub',
                'content_type': 'github' # Специальный тип для четкой фильтрации
            } for item in data.get('items', [])]
            
            cache.set(cache_key, result, self.cache_timeout)
            return result
            
        except Exception as e:
            logger.error(f"GitHub provider error: {e}")
            return []
