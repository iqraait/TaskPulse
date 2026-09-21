from django.contrib import admin
from .models import Task, Comment, TodoItem, TodoShareRequest, TaskFlowLog, PushSubscription

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('ticket_code', 'title', 'department', 'category', 'priority', 'status', 'created_by', 'assigned_to', 'assigned_to_secondary', 'created_at', 'due_date')
    list_filter = ('status', 'priority', 'category', 'department', 'created_at')
    search_fields = ('ticket_code', 'title', 'description', 'department', 'assigned_to__username', 'created_by__username')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('task', 'user', 'message', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('message', 'user__username', 'task__title', 'task__ticket_code')
    ordering = ('-created_at',)

@admin.register(TodoItem)
class TodoItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'is_completed', 'points_value', 'shared_from', 'due_date', 'created_at')
    list_filter = ('is_completed', 'created_at', 'due_date')
    search_fields = ('title', 'description', 'user__username', 'shared_from__username')
    ordering = ('is_completed', '-created_at')

@admin.register(TodoShareRequest)
class TodoShareRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'sender', 'recipient', 'points_value', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'description', 'sender__username', 'recipient__username')
    ordering = ('-created_at',)

@admin.register(TaskFlowLog)
class TaskFlowLogAdmin(admin.ModelAdmin):
    list_display = ('task', 'actor', 'action_type', 'description', 'created_at')
    list_filter = ('action_type', 'created_at')
    search_fields = ('description', 'actor__username', 'task__ticket_code')
    ordering = ('-created_at',)

@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'endpoint', 'created_at')
    search_fields = ('user__username', 'endpoint')
    ordering = ('-created_at',)