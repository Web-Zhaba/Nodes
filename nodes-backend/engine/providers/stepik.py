import logging
import requests
import os
import hashlib
from django.core.cache import cache

logger = logging.getLogger(__name__)

class StepikProvider:
    def __init__(self):
        self.client_id = os.getenv('STEPIK_CLIENT_ID')
        self.client_secret = os.getenv('STEPIK_CLIENT_SECRET')
        self.base_url = "https://stepik.org/api"
        self.cache_timeout = 60 * 60 * 24

    def _get_token(self):
        token_cache_key = "stepik_access_token"
        token = cache.get(token_cache_key)
        if token:
            return token

        if not self.client_id or not self.client_secret:
            return None

        try:
            auth = requests.auth.HTTPBasicAuth(self.client_id, self.client_secret)
            response = requests.post('https://stepik.org/oauth2/token/', 
                                     data={'grant_type': 'client_credentials'}, 
                                     auth=auth, timeout=3)
            response.raise_for_status()
            token = response.json().get('access_token')
            # Кэшируем токен чуть меньше времени его жизни (обычно 1 час)
            cache.set(token_cache_key, token, 3000)
            return token
        except Exception as e:
            logger.error(f"Stepik auth error: {e}")
            return None

    def fetch(self, query, max_results=15):
        cache_key = f"provider_stepik_{hashlib.md5(query.encode('utf-8')).hexdigest()}"
        cached = cache.get(cache_key)
        if cached: return cached

        token = self._get_token()
        headers = {'Authorization': f'Bearer {token}'} if token else {}

        params = {
            'query': query,
            'is_popular': 'true',
            'page': 1
        }

        try:
            response = requests.get(f"{self.base_url}/courses", params=params, headers=headers, timeout=3)
            response.raise_for_status()
            data = response.json()
            
            result = []
            for course in data.get('courses', [])[:max_results]:
                result.append({
                    'title': course['title'],
                    'description': course['summary'],
                    'url': f"https://stepik.org/course/{course['id']}",
                    'thumbnail_url': course['cover'],
                    'source': 'Stepik',
                    'content_type': 'course'
                })
            
            cache.set(cache_key, result, self.cache_timeout)
            return result
        except Exception as e:
            logger.error(f"Stepik fetch error: {e}")
            return []
