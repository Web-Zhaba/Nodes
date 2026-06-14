import jwt
import requests
import logging
import hashlib
from django.conf import settings
from rest_framework import authentication, exceptions
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from django.utils import timezone
from django.core.cache import cache as django_cache
from .models import Profile, ApiKey

logger = logging.getLogger(__name__)

# --- Supabase JWT Authentication ---

def _get_jwks() -> dict:
    """Получает JSON Web Key Set (JWKS) от Supabase."""
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
        django_cache.set(cache_key, data, 3600)
        return data
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Supabase JWKS: {e}")
        return {}

def _get_signing_key(token: str):
    """Находит правильный ключ для проверки подписи JWT."""
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        raise exceptions.AuthenticationFailed('Некорректный формат токена.')

    alg = header.get('alg', 'HS256')

    if alg == 'HS256':
        if not settings.SUPABASE_JWT_SECRET:
            logger.error("SUPABASE_JWT_SECRET is not set!")
            raise exceptions.AuthenticationFailed('Ошибка конфигурации сервера.')
        return settings.SUPABASE_JWT_SECRET, ['HS256']

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

    raise exceptions.AuthenticationFailed(f'Публичный ключ с kid={kid} не найден.')

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """Авторизация через Supabase JWT (Bearer токен)."""
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
            raise exceptions.AuthenticationFailed('Неверный формат заголовка Authorization.')

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

        return (profile, token)

# --- Subscription API Key Authentication ---

def hash_key(key: str) -> str:
    """Хэширует API-ключ для хранения и сравнения."""
    return hashlib.sha256(key.encode()).hexdigest()

class SubscriptionKeyAuthentication(BaseAuthentication):
    """
    Авторизация через заголовок X-API-Key.
    Доступ разрешен только пользователям с активной Pro-подпиской.
    """
    def authenticate(self, request):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return None

        key_hash = hash_key(api_key)
        try:
            key_entry = ApiKey.objects.get(key_hash=key_hash, is_active=True)
        except ApiKey.DoesNotExist:
            raise AuthenticationFailed('Неверный или неактивный API ключ')

        user = key_entry.user
        
        if not user.is_active_pro:
            raise PermissionDenied('Доступ к API требует активной Pro-подписки')

        key_entry.last_used_at = timezone.now()
        key_entry.save(update_fields=['last_used_at'])

        return (user, None)
