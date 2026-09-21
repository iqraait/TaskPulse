from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TaskViewSet, 
    CommentViewSet, 
    TodoItemViewSet, 
    TodoShareRequestViewSet,
    NotificationViewSet, 
    dashboard_stats, 
    subscribe_push, 
    public_ticket_schedule,
    leaderboard_stats
)

router = DefaultRouter()

router.register(r'tasks', TaskViewSet, basename="tasks")
router.register(r'comments', CommentViewSet, basename="comments")
router.register(r'todos', TodoItemViewSet, basename="todos")
router.register(r'todo-shares', TodoShareRequestViewSet, basename="todo-shares")
router.register(r'notifications', NotificationViewSet, basename="notifications")

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats),
    path('dashboard_stats/', dashboard_stats),
    path('leaderboard/', leaderboard_stats, name='leaderboard'),
    path('push-subscribe/', subscribe_push, name='push-subscribe'),
    path('public-schedule/', public_ticket_schedule, name='public-schedule'),
]