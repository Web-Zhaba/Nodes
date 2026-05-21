from rest_framework import serializers
from .models import Recommendation, Connector, Node, RecommendationConnector

class ConnectorSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Connector
        fields = ['id', 'name', 'color']

class NodeSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = ['id', 'name']

class RecommendationSerializer(serializers.ModelSerializer):
    connectors = ConnectorSimpleSerializer(many=True, read_only=True)
    node = NodeSimpleSerializer(read_only=True)
    
    class Meta:
        model = Recommendation
        fields = [
            'id', 'node', 'connectors', 'content_type', 'title', 'description', 
            'url', 'thumbnail_url', 'source', 'score', 'affiliate_url', 
            'is_viewed', 'is_saved', 'is_discarded', 'created_at'
        ]
