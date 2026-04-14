from django.urls import path
from .views import RecalculateStabilityView, ImpulseActionView

urlpatterns = [
    path('stability/calculate/', RecalculateStabilityView.as_view(), name='stability_calculate'),
    path('impulses/action/', ImpulseActionView.as_view(), name='impulse_action'),
]
