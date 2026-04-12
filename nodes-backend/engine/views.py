from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers, status
from .services import update_user_network_stability
import logging

logger = logging.getLogger(__name__)


class StabilityRequestSerializer(serializers.Serializer):
    """Валидация входных данных для пересчёта стабильности."""
    node_id = serializers.UUIDField(required=False, allow_null=True, default=None)


class RecalculateStabilityView(APIView):
    """
    Эндпоинт для пересчета стабильности.
    Синхронно обновляет узел и связанные ядра.
    """
    def post(self, request):
        serializer = StabilityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_profile = request.user
        node_id = serializer.validated_data['node_id']

        try:
            update_user_network_stability(user_profile, node_id=node_id)

            return Response(
                {"status": "success", "node_id": str(node_id) if node_id else None},
                status=200
            )

        except Exception as e:
            logger.error(f"Calculation failed: {str(e)}")
            return Response({"status": "error", "message": "Calculation failed"}, status=500)

