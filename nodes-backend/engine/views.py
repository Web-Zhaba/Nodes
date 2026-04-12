from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import update_user_network_stability
import logging

logger = logging.getLogger(__name__)

class RecalculateStabilityView(APIView):
    """
    Эндпоинт для пересчета стабильности.
    Обновление узла происходит мгновенно (синхронно), 
    а обновление ядер делегируется в фоновый поток внутри сервиса.
    """
    def post(self, request):
        user_profile = request.user
        node_id = request.data.get('node_id')

        try:
            # Вызов сервиса. Он сам мгновенно обновит узел и отправит ядра в фон.
            update_user_network_stability(user_profile, node_id=node_id)
            
            return Response(
                {"status": "success", "node_id": node_id}, 
                status=200
            )
            
        except Exception as e:
            logger.error(f"Calculation failed: {str(e)}")
            return Response({"status": "error", "message": "Calculation failed"}, status=500)

