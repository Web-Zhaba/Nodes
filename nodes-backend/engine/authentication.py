import jwt
import requests
import logging
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import Profile

logger = logging.getLogger(__name__)

# --- Кэш публичных ключей Supabase (с TTL для автоматического обновления) ---
import time as _time

_jwks_cache: dict = {}
_jwks_cache_time: float = 0
_JWKS_CACHE_TTL: int = 3600  # Обновлять ключи раз в час

from django.core.cache import cache as django_cache

def _get_jwks() -> dict:
    """
    Получает JSON Web Key Set (JWKS) от Supabase.
    Использует Django Cache (LocMem) для сохранения между запросами в Vercel.
    """
    cache_key = "supabase_jwks_data"
    cached = django_cache.get(cache_key)
    if cached:
        return cached

    supabase_url = settings.SUPABASE_URL
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"

    try:
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        data = response.json()
        # Кэшируем на 1 час
        django_cache.set(cache_key, data, 3600)
        logger.info("Successfully loaded/refreshed Supabase JWKS (stored in Django cache).")
        return data
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Supabase JWKS: {e}")
        return {}


def _get_signing_key(token: str):
    """
    Находит правильный публичный ключ по 'kid' из заголовка токена.
    Поддерживает ES256 (асимметричный) и HS256 (симметричный).
    """
    try:
        header = jwt.get_unverified_header(token)
        logger.info(f"Incoming JWT Header: {header}")
    except Exception:
        raise exceptions.AuthenticationFailed('Некорректный формат токена.')
        
    alg = header.get('alg', 'HS256')

    # Приоритет HS256: если токен симметричный, используем наш локальный секрет напрямую
    if alg == 'HS256':
        if not settings.SUPABASE_JWT_SECRET:
            logger.error("SUPABASE_JWT_SECRET is not set in Django settings!")
            raise exceptions.AuthenticationFailed('Ошибка конфигурации сервера (JWT Secret).')
        return settings.SUPABASE_JWT_SECRET, ['HS256']

    # Для ES256/RS256 — ищем публичный ключ в JWKS по kid
    kid = header.get('kid')
    jwks = _get_jwks()

    for key_data in jwks.get('keys', []):
        if key_data.get('kid') == kid:
            try:
                public_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
                return public_key, [alg]
            except Exception as e:
                logger.error(f"Failed to parse JWK: {e}")
                continue

    # Если мы дошли сюда и это не HS256, значит ключа нет
    raise exceptions.AuthenticationFailed(
        f'Публичный ключ с kid={kid} не найден в JWKS Supabase. Убедитесь, что вы залогинены на правильном сервере.'
    )


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Кастомная DRF-аутентификация через Supabase JWT.
    Автоматически поддерживает HS256 и ES256.
    """
    def authenticate_header(self, request):
        return 'Bearer'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            prefix, token = auth_header.split(' ', 1)
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            raise exceptions.AuthenticationFailed(
                'Неверный формат заголовка Authorization.'
            )

        try:
            signing_key, algorithms = _get_signing_key(token)
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=algorithms,
                audience="authenticated",
            )
        except exceptions.AuthenticationFailed:
            raise
        except Exception as e:
            logger.warning(f"JWT validation failed: {e}")
            raise exceptions.AuthenticationFailed(f'Недействительный токен: {e}')

        user_id = payload.get('sub')
        if not user_id:
            raise exceptions.AuthenticationFailed('Токен не содержит sub.')

        try:
            profile = Profile.objects.get(id=user_id)
        except Profile.DoesNotExist:
            raise exceptions.AuthenticationFailed('Профиль пользователя не найден.')

        logger.debug(f"Authenticated user: {user_id}")
        return (profile, token)
