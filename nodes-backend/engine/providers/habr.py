import logging
import requests
import hashlib
import xml.etree.ElementTree as ET
from django.core.cache import cache

logger = logging.getLogger(__name__)

class HabrProvider:
    def __init__(self):
        self.base_url = "https://habr.com/ru/rss/search/"
        self.cache_timeout = 60 * 60 * 24

    def fetch(self, query, max_results=15):
        cache_key = f"provider_habr_{hashlib.md5(query.encode('utf-8')).hexdigest()}"
        cached = cache.get(cache_key)
        if cached: return cached

        params = {'q': query}
        try:
            # Habr RSS требует User-Agent
            headers = {'User-Agent': 'NodesRecommender/1.0'}
            response = requests.get(self.base_url, params=params, headers=headers, timeout=3)
            response.raise_for_status()
            
            root = ET.fromstring(response.content)
            items = root.findall('.//item')
            
            import re

            result = []
            for item in items[:max_results]:
                description_html = item.find('description').text or ""
                
                # Извлекаем первую картинку из HTML описания
                img_match = re.search(r'<img[^>]+src="([^">]+)"', description_html)
                thumbnail_url = img_match.group(1) if img_match else None
                
                # Очищаем описание от HTML тегов
                clean_description = re.sub(r'<[^>]+>', '', description_html)
                clean_description = clean_description.replace('&nbsp;', ' ').strip()
                
                result.append({
                    'title': item.find('title').text,
                    'description': clean_description[:200] + ("..." if len(clean_description) > 200 else ""),
                    'url': item.find('link').text,
                    'thumbnail_url': thumbnail_url,
                    'source': 'Habr',
                    'content_type': 'article'
                })
            
            cache.set(cache_key, result, self.cache_timeout)
            return result
        except Exception as e:
            logger.error(f"Habr fetch error: {e}")
            return []
