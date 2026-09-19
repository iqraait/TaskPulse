from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        role = self.user.role
        if not role:
            role = 'superadmin' if self.user.is_superuser else 'staff'

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': role,
            'department': self.user.department or 'General',
            'is_superuser': self.user.is_superuser,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'privileges': self.user.privileges or {},
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    pending_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'password', 
            'role', 'department', 'privileges', 'created_by', 'is_superuser', 
            'pending_tasks_count'
        ]

    def get_pending_tasks_count(self, obj):
        from tasks.models import Task
        from django.db.models import Q
        return Task.objects.filter(
            Q(assigned_to=obj) | Q(assigned_to_secondary=obj)
        ).filter(status__in=['pending', 'progress']).count()

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_password('password123')
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance