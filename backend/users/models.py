from django.contrib.auth.models import AbstractUser
from django.db import models

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class User(AbstractUser):
    ROLE_CHOICES = (
        ('superadmin', 'Super Admin'),
        ('dept_admin', 'Department Head'),
        ('staff', 'Staff'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    department = models.CharField(max_length=100, blank=True, default="")
    privileges = models.JSONField(default=dict, blank=True)

    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        return self.username