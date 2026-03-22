from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services import update_user_network_stability

class RecalculateStabilityView(APIView):
    """
    Эндпоинт для пересчета стабильности всех узлов и ядер текущего пользователя.
    Фронтенд может вызывать его при загрузке дашборда или графа.
    """
    def post(self, request):
        user_profile = request.user
        node_id = request.data.get('node_id') # Читаем ID узла из тела запроса
        
        try:
            # Вызываем расчет (теперь он умеет быть выборочным)
            update_user_network_stability(user_profile, node_id=node_id)
            return Response({"status": "success", "recalculated_node": node_id}, status=200)
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)
