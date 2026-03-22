import jwt
import requests
import logging
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import Profile

logger = logging.getLogger(__name__)

# --- Кэш публичных ключей Supabase (загружаются один раз при запуске) ---
_jwks_cache: dict = {}

def _get_jwks() -> dict:
    """
    Получает JSON Web Key Set (JWKS) от Supabase.
    Результат кэшируется в памяти на время жизни процесса.
    """
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    supabase_url = settings.SUPABASE_URL
    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"

    try:
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        _jwks_cache = response.json()
        logger.info("Successfully loaded Supabase JWKS.")
        return _jwks_cache
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Supabase JWKS: {e}")
        return {}


def _get_signing_key(token: str):
    """
    Находит правильный публичный ключ по 'kid' из заголовка токена.
    Поддерживает ES256 (асимметричный) и HS256 (симметричный).
    """
    header = jwt.get_unverified_header(token)
    alg = header.get('alg', 'HS256')

    if alg == 'HS256':
        # Для HS256 используем симметричный секрет из .env
        return settings.SUPABASE_JWT_SECRET, ['HS256']

    # Для ES256/RS256 — ищем публичный ключ в JWKS по kid
    kid = header.get('kid')
    jwks = _get_jwks()

    for key_data in jwks.get('keys', []):
        if key_data.get('kid') == kid:
            public_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
            return public_key, [alg]

    raise exceptions.AuthenticationFailed(
        f'Публичный ключ с kid={kid} не найден в JWKS Supabase.'
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
                options={"verify_aud": False},
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
