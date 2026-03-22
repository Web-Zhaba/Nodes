from django.urls import path
from .views import RecalculateStabilityView

urlpatterns = [
    path('stability/calculate/', RecalculateStabilityView.as_view(), name='stability_calculate'),
]
