from rest_framework import serializers
from .models import Task, Comment, TaskFlowLog, TodoItem, TodoShareRequest


class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'user', 'username', 'user_role', 'message', 'created_at']
        read_only_fields = ['user', 'created_at']


class TaskFlowLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = TaskFlowLog
        fields = ['id', 'task', 'actor', 'actor_name', 'action_type', 'description', 'created_at']

    def get_actor_name(self, obj):
        return obj.actor.username if obj.actor else "System"


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_username = serializers.SerializerMethodField()
    assigned_to_secondary_username = serializers.SerializerMethodField()
    created_by_username = serializers.SerializerMethodField()
    is_reassigned = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    flow_logs = TaskFlowLogSerializer(many=True, read_only=True)
    attachment = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = [
            'id', 'ticket_code', 'title', 'description', 'department', 'category', 'priority', 'status',
            'closure_reason', 'attachment', 'is_reassigned',
            'created_by', 'created_by_username',
            'assigned_to', 'assigned_to_username',
            'assigned_to_secondary', 'assigned_to_secondary_username',
            'created_at', 'due_date', 'comments', 'flow_logs'
        ]
        read_only_fields = ['ticket_code', 'created_by', 'created_at']

    def get_assigned_to_username(self, obj):
        return obj.assigned_to.username if obj.assigned_to else "Unassigned"

    def get_assigned_to_secondary_username(self, obj):
        return obj.assigned_to_secondary.username if obj.assigned_to_secondary else None

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else "System"

    def get_is_reassigned(self, obj):
        return obj.flow_logs.filter(action_type="reassigned").exists()


class TodoItemSerializer(serializers.ModelSerializer):
    shared_from_username = serializers.SerializerMethodField()

    class Meta:
        model = TodoItem
        fields = [
            'id', 'user', 'title', 'description', 'is_completed',
            'completed_at', 'points_value', 'shared_from', 'shared_from_username',
            'due_date', 'created_at'
        ]
        read_only_fields = ['user', 'completed_at', 'created_at']

    def get_shared_from_username(self, obj):
        return obj.shared_from.username if obj.shared_from else None


class TodoShareRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    recipient_username = serializers.CharField(source='recipient.username', read_only=True)

    class Meta:
        model = TodoShareRequest
        fields = [
            'id', 'sender', 'sender_username', 'recipient', 'recipient_username',
            'title', 'description', 'points_value', 'status', 'created_at'
        ]
        read_only_fields = ['sender', 'created_at']