from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = BaseUserAdmin.fieldsets + (
        ('TaskPulse Role & Department', {
            'fields': ('role', 'department', 'privileges', 'created_by')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('TaskPulse Role & Department', {
            'fields': ('role', 'department', 'email')
        }),
    )

    list_display = ('username', 'email', 'role', 'department', 'is_staff', 'is_superuser', 'date_joined')
    list_filter = ('role', 'department', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'department', 'role')
    ordering = ('-date_joined',)