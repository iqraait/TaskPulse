from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from django.db.models import Q, Count
from django.utils import timezone

from .models import Task, Comment, TaskFlowLog, PushSubscription, TodoItem, TodoShareRequest
from .serializers import TaskSerializer, CommentSerializer, TodoItemSerializer, TodoShareRequestSerializer
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


class TodoItemViewSet(ModelViewSet):
    serializer_class = TodoItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return TodoItem.objects.none()
        # Strictly personal to-do list: staff can only see their own to-do items
        return TodoItem.objects.filter(user=user).order_by("is_completed", "-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_complete(self, request, pk=None):
        todo = self.get_object()
        todo.is_completed = not todo.is_completed
        if todo.is_completed:
            todo.completed_at = timezone.now()
        else:
            todo.completed_at = None
        todo.save()

        # If shared, we can log or notify sender
        if todo.is_completed and todo.shared_from:
            # Shared todo completed notification logic placeholder
            pass

        return Response({
            'status': 'success',
            'is_completed': todo.is_completed,
            'completed_at': todo.completed_at,
            'points_awarded': todo.points_value if todo.is_completed else 0
        })

    @action(detail=False, methods=['post'])
    def share_items(self, request):
        user = request.user
        item_ids = request.data.get('item_ids', [])
        recipient_id = request.data.get('recipient_id')

        if not recipient_id:
            return Response({'error': 'Recipient staff member required'}, status=400)
        if not item_ids:
            return Response({'error': 'No todo items selected for sharing'}, status=400)

        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({'error': 'Recipient not found'}, status=404)

        todos = TodoItem.objects.filter(id__in=item_ids, user=user)
        created_shares = []

        for todo in todos:
            share = TodoShareRequest.objects.create(
                sender=user,
                recipient=recipient,
                title=todo.title,
                description=todo.description,
                points_value=todo.points_value
            )
            created_shares.append(share.id)

        return Response({
            'status': 'success',
            'shared_count': len(created_shares),
            'recipient': recipient.username
        })


class TodoShareRequestViewSet(ModelViewSet):
    serializer_class = TodoShareRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user or user.is_anonymous:
            return TodoShareRequest.objects.none()
        # View incoming share requests sent to this user
        return TodoShareRequest.objects.filter(recipient=user).order_by("-created_at")

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        share = self.get_object()
        if share.status != 'pending':
            return Response({'error': 'Share request already processed'}, status=400)

        share.status = 'accepted'
        share.save()

        # Add shared item to recipient's personal todo list
        new_todo = TodoItem.objects.create(
            user=request.user,
            title=share.title,
            description=share.description,
            points_value=share.points_value,
            shared_from=share.sender
        )

        return Response({
            'status': 'accepted',
            'todo_id': new_todo.id
        })

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        share = self.get_object()
        share.status = 'declined'
        share.save()
        return Response({'status': 'declined'})


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
@permission_classes([AllowAny])
def public_ticket_schedule(request):
    """
    Public Endpoint for Login Page to view ticket creation dates & pending status before login.
    """
    recent_tasks = Task.objects.all().order_by("-created_at")[:20]
    date_map = {}
    for task in recent_tasks:
        date_str = task.created_at.strftime("%Y-%m-%d")
        if date_str not in date_map:
            date_map[date_str] = []
        date_map[date_str].append({
            "id": task.id,
            "ticket_code": task.ticket_code or f"#TK-{task.id}",
            "title": task.title,
            "status": task.status,
            "department": task.department,
            "created_at_time": task.created_at.strftime("%H:%M"),
            "assigned_to": task.assigned_to.username if task.assigned_to else "Unassigned",
        })
    return Response(date_map)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leaderboard_stats(request):
    """
    Common Gamified Performance & Rewards Leaderboard accessible to ALL users without restriction.
    Calculates points, levels, completed tasks, and completed daily todos.
    """
    all_users = User.objects.all().order_by("id")
    leaderboard = []

    for u in all_users:
        # Completed Tasks Points
        tasks_done = Task.objects.filter(
            Q(assigned_to=u) | Q(assigned_to_secondary=u)
        ).filter(status="done")

        high_tasks = tasks_done.filter(priority="high").count()
        med_tasks = tasks_done.filter(priority="medium").count()
        low_tasks = tasks_done.filter(priority="low").count()

        task_points = (high_tasks * 30) + (med_tasks * 20) + (low_tasks * 10)

        # Completed Daily Todos Points
        todos_done = TodoItem.objects.filter(user=u, is_completed=True)
        todo_points = sum([t.points_value for t in todos_done]) or (todos_done.count() * 15)

        total_points = task_points + todo_points
        tasks_completed_count = tasks_done.count()
        todos_completed_count = todos_done.count()

        # Level & Badge Tier Matrix
        if total_points >= 500:
            level_name = "Level 5 - Elite Champion 👑"
            badge = "👑 Elite"
            rank_color = "#eab308"
        elif total_points >= 300:
            level_name = "Level 4 - Master Executor ⚡"
            badge = "💎 Master"
            rank_color = "#3b82f6"
        elif total_points >= 150:
            level_name = "Level 3 - Gold Specialist 🥇"
            badge = "🥇 Specialist"
            rank_color = "#10b981"
        elif total_points >= 50:
            level_name = "Level 2 - Silver Achiever 🥈"
            badge = "🥈 Achiever"
            rank_color = "#8b5cf6"
        else:
            level_name = "Level 1 - Bronze Starter 🥉"
            badge = "🥉 Starter"
            rank_color = "#64748b"

        leaderboard.append({
            "user_id": u.id,
            "username": u.username,
            "role": u.role or ('superadmin' if u.is_superuser else 'staff'),
            "department": u.department or "General",
            "total_points": total_points,
            "task_points": task_points,
            "todo_points": todo_points,
            "tasks_completed": tasks_completed_count,
            "todos_completed": todos_completed_count,
            "level_name": level_name,
            "badge": badge,
            "rank_color": rank_color
        })

    # Sort leaderboard by total_points descending
    leaderboard.sort(key=lambda x: x["total_points"], reverse=True)

    # Add Rank Position (1st, 2nd, 3rd, etc.)
    for idx, entry in enumerate(leaderboard):
        entry["rank"] = idx + 1

    return Response(leaderboard)


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
    closed = tasks.filter(status="closed").count()
    high_priority = tasks.filter(priority="high").count()
    med_priority = tasks.filter(priority="medium").count()
    low_priority = tasks.filter(priority="low").count()

    # SLA breaches (due_date in past & not done/closed)
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