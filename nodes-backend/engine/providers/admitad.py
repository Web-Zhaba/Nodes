import logging
import requests
import os
import hashlib
from django.core.cache import cache

logger = logging.getLogger(__name__)

class AdmitadProvider:
    """
    Провайдер для Admitad. 
    На этапе MVP возвращает пустой список или базовые офферы, 
    так как требует одобрения площадки и конкретных кампаний.
    """
    def __init__(self):
        self.client_id = os.getenv('ADMITAD_CLIENT_ID')
        self.client_secret = os.getenv('ADMITAD_CLIENT_SECRET')
        self.website_id = os.getenv('ADMITAD_WEBSITE_ID')
        self.cache_timeout = 60 * 60 * 24

    def _get_token(self):
        token_key = "admitad_access_token"
        token = cache.get(token_key)
        if token: return token

        if not self.client_id or not self.client_secret:
            return None

        try:
            # Admitad использует OAuth2 client_credentials
            response = requests.post(
                'https://api.admitad.com/token/',
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'scope': 'public_products coupons'
                },
                auth=(self.client_id, self.client_secret),
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            token = data.get('access_token')
            cache.set(token_key, token, data.get('expires_in', 3600) - 60)
            return token
        except Exception as e:
            logger.error(f"Admitad auth error: {e}")
            return None

    def fetch(self, query, max_results=15):

        # Пока возвращаем пустой список, так как поиск товаров требует активных подписок на офферы
        # В будущем здесь будет поиск по Product Feed
        return []
