from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import TaskViewSet, CommentViewSet, dashboard_stats, subscribe_push, public_ticket_schedule

router = DefaultRouter()

router.register(r'tasks', TaskViewSet, basename="tasks")
router.register(r'comments', CommentViewSet, basename="comments")

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/', dashboard_stats),
    path('dashboard_stats/', dashboard_stats),
    path('push-subscribe/', subscribe_push, name='push-subscribe'),
    path('public-schedule/', public_ticket_schedule, name='public-schedule'),
]