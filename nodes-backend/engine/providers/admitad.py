import logging
import requests
import os
import hashlib
from django.core.cache import cache

logger = logging.getLogger(__name__)

class AdmitadProvider:
    """
    Провайдер для Admitad. 
    Использует Admitad Store API для поиска товаров по ключевым словам.
    """
    def __init__(self):
        self.client_id = os.getenv('ADMITAD_CLIENT_ID')
        self.client_secret = os.getenv('ADMITAD_CLIENT_SECRET')
        self.website_id = os.getenv('ADMITAD_WEBSITE_ID')
        self.cache_timeout = 60 * 60 * 24
        self.is_rate_limited = False

    def _get_token(self):
        token_key = "admitad_access_token"
        token = cache.get(token_key)
        if token: return token

        if not self.client_id or not self.client_secret:
            logger.warning("Admitad credentials missing")
            return None

        try:
            # Admitad использует OAuth2 client_credentials
            # Пробуем более стандартный набор scopes
            response = requests.post(
                'https://api.admitad.com/token/',
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'scope': 'public_data websites advcampaigns coupons'
                },
                auth=(self.client_id, self.client_secret),
                timeout=5
            )
            
            if response.status_code != 200:
                logger.error(f"Admitad auth failed ({response.status_code}): {response.text}")
                return None

            data = response.json()
            token = data.get('access_token')
            # Кэшируем на время жизни токена за вычетом минуты
            expires_in = data.get('expires_in', 3600)
            cache.set(token_key, token, expires_in - 60)
            return token
        except Exception as e:
            logger.error(f"Admitad auth exception: {e}")
            return None

    def _get_website_id(self, token):
        """Получает ID площадки (Ad Space), если он не задан в .env"""
        if self.website_id:
            return self.website_id

        cache_key = "admitad_website_id"
        cached_id = cache.get(cache_key)
        if cached_id:
            return cached_id

        try:
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get('https://api.admitad.com/websites/', headers=headers, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Берем первую активную площадку
            results = data.get('results', [])
            for site in results:
                if site.get('status') == 'active':
                    wid = str(site.get('id'))
                    cache.set(cache_key, wid, self.cache_timeout)
                    return wid
            
            return None
        except Exception as e:
            logger.error(f"Error fetching Admitad website ID: {e}")
            return None

    def fetch(self, query, max_results=15):
        if not self.client_id or not self.client_secret:
            return []

        token = self._get_token()
        if not token:
            return []

        wid = self._get_website_id(token)
        query_hash = hashlib.md5(query.encode('utf-8')).hexdigest()
        cache_key = f"provider_admitad_coupons_{query_hash}"
        cached_result = cache.get(cache_key)
        
        if cached_result is not None:
            logger.debug(f"[CACHE HIT] Admitad Coupons: {query}")
            return cached_result

        # Пытаемся найти результаты, постепенно упрощая запрос
        # 1. Сначала весь запрос
        # 2. Если пусто — каждое слово по отдельности (берем самое длинное/значимое)
        search_terms = [query]
        words = [w for w in query.split() if len(w) >= 3] # Уменьшил до 3 для большей гибкости
        if words:
            search_terms.extend(sorted(words, key=len, reverse=True))

        all_offers = []
        seen_offer_ids = set()

        headers = {'Authorization': f'Bearer {token}'}

        # ДИАГНОСТИКА: Проверяем, есть ли вообще хоть какие-то купоны у пользователя
        try:
            diag_res = requests.get('https://api.admitad.com/coupons/', headers=headers, params={'limit': 1, 'status': 'active'}, timeout=5)
            total_coupons = diag_res.json().get('_meta', {}).get('count', 0)
            if total_coupons == 0:
                logger.warning(f"Admitad: User has 0 total active coupons. You need to JOIN some affiliate programs first!")
                return []
            else:
                logger.info(f"Admitad: User has {total_coupons} total active coupons available.")
        except: pass

        for term in search_terms:
            try:
                params = {
                    'keyword': term,
                    'limit': max_results,
                    'status': 'active',
                    'website': wid
                }
                
                response = requests.get('https://api.admitad.com/coupons/', headers=headers, params=params, timeout=5)
                response.raise_for_status()
                data = response.json()
                results = data.get('results', [])

                # Если по конкретной площадке пусто, пробуем без фильтра по площадке (вдруг в этом дело)
                if not results and wid:
                    params.pop('website')
                    response = requests.get('https://api.admitad.com/coupons/', headers=headers, params=params, timeout=5)
                    results = response.json().get('results', [])
                
                for item in results:
                    offer_id = item.get('id')
                    if offer_id in seen_offer_ids: continue
                    
                    url = item.get('goto_link') or item.get('advcampaign_url') or item.get('frameset_link')
                    if not url: continue

                    campaign = item.get('campaign', {})
                    all_offers.append({
                        'title': item.get('name') or campaign.get('name'),
                        'description': item.get('description', '')[:200] + (f" (Промокод: {item.get('code')})" if item.get('code') else ""),
                        'url': url,
                        'thumbnail_url': item.get('image') or campaign.get('image'),
                        'source': 'Admitad',
                        'content_type': 'product'
                    })
                    seen_offer_ids.add(offer_id)

                # Если нашли достаточно результатов по текущему терму, останавливаемся
                if len(all_offers) >= 5:
                    break
                    
            except Exception as e:
                logger.error(f"Admitad fallback search error for '{term}': {e}")

        cache.set(cache_key, all_offers, self.cache_timeout)
        logger.info(f"[API CALL] Admitad Coupons: {query} -> {len(all_offers)} results (fallbacks used)")
        return all_offers
