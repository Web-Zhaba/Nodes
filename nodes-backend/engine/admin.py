from django.contrib import admin
from django.utils import timezone
from datetime import timedelta
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'is_pro', 'pro_expires_at', 'subscription_plan', 'created_at')
    search_fields = ('email', 'id')
    list_filter = ('is_pro', 'subscription_plan')
    actions = ['grant_30_days_pro']

    @admin.action(description="Grant 30 days of Pro status")
    def grant_30_days_pro(self, request, queryset):
        new_expiry = timezone.now() + timedelta(days=30)
        updated = queryset.update(
            is_pro=True,
            subscription_plan='pro',
            pro_expires_at=new_expiry
        )
        self.message_user(request, f"Granted Pro to {updated} profiles.")
