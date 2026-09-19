from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q

from .models import User
from .serializers import UserSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all().order_by('-id')
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all().order_by('-id')

        if user and user.is_authenticated:
            role = user.role or ('superadmin' if user.is_superuser else 'staff')
            if role == 'superadmin':
                pass # Super Admin sees all users
            elif role == 'admin' and user.department:
                # Department admin sees users in their department
                queryset = queryset.filter(Q(department__iexact=user.department) | Q(id=user.id))
            elif role == 'staff' and user.department:
                queryset = queryset.filter(department__iexact=user.department)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        role_requested = self.request.data.get('role', 'staff')
        dept_requested = self.request.data.get('department', '')

        # Enforce department admin hierarchy rules
        if user and user.is_authenticated and not user.is_superuser and user.role == 'admin':
            role_requested = 'staff' # Admins can only create staff
            if user.department:
                dept_requested = user.department # Lock department to admin's department

        serializer.save(
            role=role_requested,
            department=dept_requested,
            is_superuser=(role_requested == 'superadmin')
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        role = request.user.role or ('superadmin' if request.user.is_superuser else 'staff')
        data = serializer.data
        data['role'] = role
        return Response(data)