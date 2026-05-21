import logging
import requests
import os
import hashlib
from django.core.cache import cache

logger = logging.getLogger(__name__)

class GoogleBooksProvider:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_BOOKS_API_KEY')
        self.base_url = "https://www.googleapis.com/books/v1/volumes"
        self.cache_timeout = 60 * 60 * 24 # 24 часа

    def _generate_cache_key(self, query):
        query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        return f"provider_google_books_{query_hash}"

    def fetch(self, query, max_results=15):
        cache_key = self._generate_cache_key(query)
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            logger.debug(f"[CACHE HIT] Google Books: {query}")
            return cached_result

        params = {
            'q': query,
            'maxResults': max_results,
            'langRestrict': 'ru',
            'key': self.api_key
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=3)
            response.raise_for_status()
            data = response.json()
            
            books = []
            for item in data.get('items', []):
                volume_info = item.get('volumeInfo', {})
                books.append({
                    'title': volume_info.get('title'),
                    'description': volume_info.get('description', ''),
                    'url': volume_info.get('infoLink'),
                    'thumbnail_url': volume_info.get('imageLinks', {}).get('thumbnail'),
                    'source': 'Google Books',
                    'content_type': 'book'
                })
            
            # Сохраняем в кэш
            cache.set(cache_key, books, self.cache_timeout)
            logger.info(f"[API CALL] Google Books: {query} -> cached")
            return books
            
        except Exception as e:
            logger.error(f"Google Books provider error: {e}")
            return []
