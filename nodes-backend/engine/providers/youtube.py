import logging
import requests
import os
import hashlib
from django.core.cache import cache

logger = logging.getLogger(__name__)

class YouTubeProvider:
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.base_url = "https://www.googleapis.com/youtube/v3/search"
        self.cache_timeout = 60 * 60 * 24 # 24 часа
        self.is_rate_limited = True

    def _generate_cache_key(self, query):
        query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        return f"provider_youtube_{query_hash}"

    def fetch(self, query, max_results=15):
        if not self.api_key:
            logger.warning("YouTube API key not found")
            return []

        cache_key = self._generate_cache_key(query)
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            logger.debug(f"[CACHE HIT] YouTube: {query}")
            return cached_result

        params = {
            'part': 'snippet',
            'q': query,
            'maxResults': max_results,
            'type': 'video',
            'relevanceLanguage': 'ru',
            'key': self.api_key
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=3)
            response.raise_for_status()
            data = response.json()
            
            result = [{
                'title': item['snippet']['title'],
                'description': item['snippet']['description'],
                'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                'thumbnail_url': item['snippet']['thumbnails']['high']['url'],
                'source': 'YouTube',
                'content_type': 'video'
            } for item in data.get('items', [])]
            
            # Сохраняем в кэш
            cache.set(cache_key, result, self.cache_timeout)
            logger.info(f"[API CALL] YouTube: {query} -> cached")
            return result
            
        except Exception as e:
            logger.error(f"YouTube provider error: {e}")
            return []
