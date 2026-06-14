from django.db import models
import uuid

class Profile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(null=True, blank=True)
    show_recommendations = models.BooleanField(default=True)
    
    # Monetization fields
    is_pro = models.BooleanField(default=False)
    pro_expires_at = models.DateTimeField(null=True, blank=True)
    subscription_plan = models.TextField(default='free')
    yookassa_payment_id = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'profiles'

    @property
    def is_authenticated(self):
        """
        DRF's IsAuthenticated permission checks `request.user.is_authenticated`.
        Since Profile is not a standard Django user, we explicitly return True.
        """
        return True

    @property
    def is_active_pro(self):
        """Проверяет, активна ли Pro-подписка прямо сейчас."""
        from django.utils import timezone
        if not self.is_pro:
            return False
        if self.pro_expires_at and self.pro_expires_at < timezone.now():
            return False
        return True

    def __str__(self):
        return self.email or str(self.id)

class Core(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='cores')
    name = models.TextField()
    description = models.TextField(null=True, blank=True)
    color = models.TextField(null=True, blank=True)
    icon = models.TextField(null=True, blank=True)
    stability_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    position_x = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    position_y = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'cores'

    def __str__(self):
        return self.name

class Connector(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='connectors')
    name = models.TextField()
    description = models.TextField(null=True, blank=True)
    color = models.TextField(null=True, blank=True)
    is_mainline = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'connectors'

    def __str__(self):
        return self.name

class Node(models.Model):
    NODE_TYPE_CHOICES = (
        ('binary', 'Binary'),
        ('quantity', 'Quantity'),
        ('duration', 'Duration'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='nodes')
    core = models.ForeignKey(Core, on_delete=models.SET_NULL, null=True, blank=True, related_name='nodes')
    name = models.TextField()
    description = models.TextField(null=True, blank=True)
    category = models.TextField(default='health')
    frequency = models.TextField(default='daily')
    color = models.TextField(null=True, blank=True)
    icon = models.TextField(null=True, blank=True)
    node_type = models.TextField(choices=NODE_TYPE_CHOICES, default='binary')
    mass = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)
    stability_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    target_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    position_x = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    position_y = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    completion_count = models.IntegerField(default=0)
    is_focus_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'nodes'

    def __str__(self):
        return self.name

class NodeConnector(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='node_connectors')
    connector = models.ForeignKey(Connector, on_delete=models.CASCADE, related_name='node_connectors')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'node_connectors'

class Impulse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='impulses')
    completed_at = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'impulses'

    def __str__(self):
        return f"{self.node.name} - {self.completed_at}"

class DailyFocus(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='daily_focus')
    node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='focused_days')
    focus_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'daily_focus'

class Connection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='outgoing_connections')
    to_node = models.ForeignKey(Node, on_delete=models.CASCADE, related_name='incoming_connections')
    type = models.TextField(default='enhances')
    strength = models.IntegerField(default=1)
    connector = models.ForeignKey(Connector, on_delete=models.SET_NULL, null=True, blank=True, related_name='connections')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'connections'

class CoreConnector(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    core = models.ForeignKey(Core, on_delete=models.CASCADE, related_name='core_connectors')
    connector = models.ForeignKey(Connector, on_delete=models.CASCADE, related_name='connector_cores')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'core_connectors'

class Recommendation(models.Model):
    CONTENT_TYPE_CHOICES = (
        ('video', 'Video'),
        ('book', 'Book'),
        ('course', 'Course'),
        ('article', 'Article'),
        ('product', 'Product'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='recommendations')
    node = models.ForeignKey(Node, on_delete=models.CASCADE, null=True, blank=True, related_name='recommendations')
    connector = models.ForeignKey(Connector, on_delete=models.SET_NULL, null=True, blank=True, related_name='recommendations')
    
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    title = models.TextField()
    description = models.TextField(null=True, blank=True)
    url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500, null=True, blank=True)
    source = models.CharField(max_length=50)
    
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    affiliate_url = models.URLField(max_length=500, null=True, blank=True)
    
    is_viewed = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)
    is_discarded = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    connectors = models.ManyToManyField(
        Connector, 
        through='RecommendationConnector', 
        related_name='recommendations_m2m'
    )

    class Meta:
        managed = False
        db_table = 'recommendations'

    def __str__(self):
        return f"{self.title} ({self.source})"

class RecommendationConnector(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recommendation = models.ForeignKey(Recommendation, on_delete=models.CASCADE, related_name='recommendation_connectors')
    connector = models.ForeignKey(Connector, on_delete=models.CASCADE, related_name='recommendation_connectors')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'recommendation_connectors'

class GenerationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='generation_logs')
    action_type = models.TextField(default='recommendation_generation')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'generation_logs'

class ApiKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='api_keys')
    key_hash = models.TextField(unique=True)
    name = models.TextField(default='Default Key')
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'api_keys'

    def __str__(self):
        return f"{self.name} ({self.user.email})"
