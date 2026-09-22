from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q

from .models import User, Department
from .serializers import UserSerializer, DepartmentSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all().order_by('name')
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        name = serializer.validated_data.get('name', '').strip()
        serializer.save(name=name)


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all().order_by('-id')

        if user and user.is_authenticated:
            # Global Super Admin check (superadmin role and not bound to a specific department head role)
            is_pure_superadmin = (user.role == 'superadmin' or user.is_superuser) and user.role != 'dept_admin'
            if is_pure_superadmin:
                pass # Super Admin sees all users across all departments
            elif user.department:
                # Department head / staff sees staff in their own department, EXCLUDING global superadmins
                queryset = queryset.filter(department__iexact=user.department).exclude(role='superadmin').exclude(is_superuser=True)
            else:
                queryset = queryset.filter(Q(id=user.id) | Q(created_by=user))

        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        role_requested = self.request.data.get('role', 'staff')
        dept_requested = self.request.data.get('department', '').strip()

        is_pure_superadmin = user and user.is_authenticated and (user.role == 'superadmin' or user.is_superuser) and user.role != 'dept_admin'

        # Enforce Role-Based Workflow Rules:
        if user and user.is_authenticated and not is_pure_superadmin:
            # Non-superadmins (Department Heads & Staff) can ONLY create 'staff' in their OWN department
            role_requested = 'staff'
            if user.department:
                dept_requested = user.department

        # Auto-create Department record if it doesn't exist yet
        if dept_requested:
            Department.objects.get_or_create(name=dept_requested)

        serializer.save(
            role=role_requested,
            department=dept_requested,
            is_superuser=(role_requested == 'superadmin'),
            created_by=user
        )

    def update(self, request, *args, **kwargs):
        target_user = self.get_object()
        user = request.user

        # Super Admin Protection Rule
        if (target_user.role == 'superadmin' or target_user.is_superuser):
            if user.is_authenticated and not (user.role == 'superadmin' or user.is_superuser):
                return Response(
                    {'error': 'Permission denied. Super Admin accounts are isolated and can only be modified by a Super Admin.'},
                    status=403
                )

        # Department Head Constraint Rule
        if user.is_authenticated and not (user.role == 'superadmin' or user.is_superuser):
            if user.role in ['dept_admin', 'admin']:
                if target_user.department and target_user.department.lower() != user.department.lower():
                    return Response(
                        {'error': f'Permission denied. You can only manage staff within your department ({user.department}).'},
                        status=403
                    )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user_to_delete = self.get_object()
        user = request.user

        # Super Admin Protection Rule
        if (user_to_delete.role == 'superadmin' or user_to_delete.is_superuser):
            if user.is_authenticated and not (user.role == 'superadmin' or user.is_superuser):
                return Response(
                    {'error': 'Permission denied. Super Admin accounts are protected and cannot be deleted by Department Heads or Staff.'},
                    status=403
                )

        # Department Head Constraint Rule
        if user.is_authenticated and not (user.role == 'superadmin' or user.is_superuser):
            if user.role in ['dept_admin', 'admin']:
                if user_to_delete.department and user_to_delete.department.lower() != user.department.lower():
                    return Response(
                        {'error': f'Permission denied. You can only manage staff within your department ({user.department}).'},
                        status=403
                    )

        # Check active assigned tasks (primary or secondary)
        from tasks.models import Task
        active_tasks = Task.objects.filter(
            Q(assigned_to=user_to_delete) | Q(assigned_to_secondary=user_to_delete)
        ).filter(status__in=['pending', 'progress'])

        if active_tasks.exists():
            task_codes = ", ".join([t.ticket_code or f"#{t.id}" for t in active_tasks[:3]])
            return Response(
                {'error': f"Cannot delete '{user_to_delete.username}'. They have {active_tasks.count()} active task(s) ({task_codes}) that must be completed or closed first."},
                status=400
            )

        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        role = request.user.role or ('superadmin' if request.user.is_superuser else 'staff')
        data = serializer.data
        data['role'] = role
        return Response(data)