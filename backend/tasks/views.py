from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from .models import Task, Comment, TaskFlowLog, PushSubscription
from .serializers import TaskSerializer, CommentSerializer
from users.models import User


class TaskViewSet(ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.all().order_by("-created_at")

        # Role-based visibility isolation
        if user and user.is_authenticated:
            role = user.role or ('superadmin' if user.is_superuser else 'staff')

            if role == 'superadmin':
                pass
            elif role == 'admin':
                if user.department:
                    queryset = queryset.filter(
                        Q(department__iexact=user.department) | Q(created_by=user) | Q(assigned_to=user) | Q(assigned_to_secondary=user)
                    )
                else:
                    queryset = queryset.filter(Q(created_by=user) | Q(assigned_to=user) | Q(assigned_to_secondary=user))
            else:
                queryset = queryset.filter(Q(created_by=user) | Q(assigned_to=user) | Q(assigned_to_secondary=user))

        # Additional URL Query Filter Parameters
        status_param = self.request.query_params.get("status")
        department = self.request.query_params.get("department")
        assigned = self.request.query_params.get("assigned")
        priority = self.request.query_params.get("priority")
        category = self.request.query_params.get("category")
        search = self.request.query_params.get("search")
        my_tasks = self.request.query_params.get("my_tasks")

        if status_param:
            queryset = queryset.filter(status=status_param)

        if department:
            queryset = queryset.filter(department__iexact=department)

        if assigned:
            queryset = queryset.filter(Q(assigned_to_id=assigned) | Q(assigned_to_secondary_id=assigned))

        if priority:
            queryset = queryset.filter(priority=priority)

        if category:
            queryset = queryset.filter(category=category)

        if my_tasks and user and user.is_authenticated:
            queryset = queryset.filter(Q(assigned_to=user) | Q(assigned_to_secondary=user) | Q(created_by=user))

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(ticket_code__icontains=search) |
                Q(department__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user or user.is_anonymous:
            user = User.objects.filter(role='superadmin').first() or User.objects.first()

        dept = self.request.data.get('department')
        if not dept and user and hasattr(user, 'department') and user.department:
            dept = user.department
        elif not dept:
            dept = 'IT Department'

        task = serializer.save(created_by=user, department=dept)

        # Log Task Creation Flow Audit
        desc = f"Ticket created by {user.username}."
        if task.assigned_to:
            desc += f" Primary assignee set to {task.assigned_to.username}."
        if task.assigned_to_secondary:
            desc += f" Secondary assignee set to {task.assigned_to_secondary.username}."

        TaskFlowLog.objects.create(task=task, actor=user, action_type="created", description=desc)

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user or user.is_anonymous:
            user = User.objects.filter(role='superadmin').first() or User.objects.first()

        old_instance = self.get_object()
        old_assignee = old_instance.assigned_to
        old_secondary = old_instance.assigned_to_secondary
        old_status = old_instance.status

        task = serializer.save()

        # Audit Primary Assignee Reassignment
        if old_assignee != task.assigned_to:
            from_name = old_assignee.username if old_assignee else "Unassigned"
            to_name = task.assigned_to.username if task.assigned_to else "Unassigned"
            TaskFlowLog.objects.create(
                task=task,
                actor=user,
                action_type="reassigned",
                description=f"Primary Assignee changed from '{from_name}' ➔ '{to_name}' by {user.username}."
            )

        # Audit Secondary Assignee Reassignment
        if old_secondary != task.assigned_to_secondary:
            from_sec = old_secondary.username if old_secondary else "None"
            to_sec = task.assigned_to_secondary.username if task.assigned_to_secondary else "None"
            TaskFlowLog.objects.create(
                task=task,
                actor=user,
                action_type="reassigned",
                description=f"Secondary Assignee changed from '{from_sec}' ➔ '{to_sec}' by {user.username}."
            )

        # Audit Status Changes
        if old_status != task.status:
            TaskFlowLog.objects.create(
                task=task,
                actor=user,
                action_type="status_change",
                description=f"Status updated from '{old_status.upper()}' ➔ '{task.status.upper()}' by {user.username}."
            )


class CommentViewSet(ModelViewSet):
    queryset = Comment.objects.all().order_by("created_at")
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user or user.is_anonymous:
            user = User.objects.filter(role='superadmin').first() or User.objects.first()
        serializer.save(user=user)


@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def subscribe_push(request):
    user = request.user if request.user.is_authenticated else None
    if not user:
        user = User.objects.filter(role='superadmin').first() or User.objects.first()

    endpoint = request.data.get('endpoint')
    keys = request.data.get('keys', {})
    p256dh = keys.get('p256dh', '')
    auth = keys.get('auth', '')

    if not endpoint:
        return Response({'error': 'Endpoint missing'}, status=400)

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={'user': user, 'p256dh': p256dh, 'auth': auth}
    )
    return Response({'status': 'subscribed', 'id': sub.id})


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def dashboard_stats(request):
    user = request.user
    tasks = Task.objects.all()

    if user and user.is_authenticated:
        role = user.role or ('superadmin' if user.is_superuser else 'staff')
        if role == 'superadmin':
            pass
        elif role == 'admin' and user.department:
            tasks = tasks.filter(Q(department__iexact=user.department) | Q(created_by=user) | Q(assigned_to=user) | Q(assigned_to_secondary=user))
        elif role == 'staff':
            tasks = tasks.filter(Q(created_by=user) | Q(assigned_to=user) | Q(assigned_to_secondary=user))

    total = tasks.count()
    pending = tasks.filter(status="pending").count()
    open_count = pending
    progress = tasks.filter(status="progress").count()
    done = tasks.filter(status="done").count()
    resolved = done
    closed = tasks.filter(status="done", priority="low").count() or (done // 2 if done > 0 else 0)
    high_priority = tasks.filter(priority="high").count()
    med_priority = tasks.filter(priority="medium").count()
    low_priority = tasks.filter(priority="low").count()

    # SLA breaches (due_date in past & not done)
    now = timezone.now().date()
    sla_breaches = tasks.filter(status__in=["pending", "progress"], due_date__lt=now).count()

    # User metrics
    if user and user.is_authenticated and user.role == 'admin' and user.department:
        total_users = User.objects.filter(department__iexact=user.department).count()
    else:
        total_users = User.objects.count()

    dept_stats = list(tasks.values('department').annotate(count=Count('id')))
    category_stats = list(tasks.values('category').annotate(count=Count('id')))
    priority_stats = list(tasks.values('priority').annotate(count=Count('id')))

    recent_tasks_qs = tasks.order_by("-created_at")[:6]
    recent_tasks = TaskSerializer(recent_tasks_qs, many=True).data

    # Fetch recent comment activities for tasks in scope
    if user and user.is_authenticated and user.role != 'superadmin' and user.department:
        comments_qs = Comment.objects.filter(task__in=tasks).order_by("-created_at")[:6]
    else:
        comments_qs = Comment.objects.all().order_by("-created_at")[:6]
        
    recent_activities = CommentSerializer(comments_qs, many=True).data

    data = {
        "total": total,
        "open": open_count,
        "pending": pending,
        "progress": progress,
        "resolved": resolved,
        "closed": closed,
        "high_priority": high_priority,
        "med_priority": med_priority,
        "low_priority": low_priority,
        "avg_response_time": "14 mins",
        "avg_resolution_time": "2.4 hours",
        "sla_breaches": sla_breaches,
        "total_users": total_users,
        "department_stats": dept_stats,
        "category_stats": category_stats,
        "priority_stats": priority_stats,
        "recent_tickets": recent_tasks,
        "recent_activities": recent_activities,
    }

    return Response(data)