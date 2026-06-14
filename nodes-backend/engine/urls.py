from django.urls import path
from . import views

urlpatterns = [
    path('stability/calculate/', views.RecalculateStabilityView.as_view(), name='stability_calculate'),
    path('impulses/action/', views.ImpulseActionView.as_view(), name='impulse_action'),
    path('analytics/history', views.get_analytics_history, name='analytics_history'),
    path('recommendations/', views.RecommendationListView.as_view(), name='recommendation-list'),
    path('recommendations/status/', views.RecommendationStatusView.as_view(), name='recommendation-status'),
    path('recommendations/generate/', views.RecommendationGenerateView.as_view(), name='recommendation-generate'),

    path('recommendations/<uuid:pk>/', views.RecommendationUpdateView.as_view(), name='recommendation_detail'),
    
    # API Management
    path('keys/', views.ApiKeyView.as_view(), name='api-keys'),
    path('keys/<uuid:pk>/', views.ApiKeyDetailView.as_view(), name='api-key-detail'),
    path('nodes/list/', views.NodeListView.as_view(), name='api-nodes-list'),

    # Payments
    path('payments/create/', views.CreatePaymentView.as_view(), name='create_payment'),
    path('payments/webhook/', views.YookassaWebhookView.as_view(), name='yookassa_webhook'),
]
