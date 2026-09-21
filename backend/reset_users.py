import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

users_data = [
    {'username': 'admin', 'password': 'admin123', 'role': 'superadmin', 'dept': 'IT Department'},
    {'username': 'Fareeda', 'password': 'password123', 'role': 'superadmin', 'dept': 'Executive Management'},
    {'username': 'Midhilage', 'password': 'password123', 'role': 'staff', 'dept': 'IT Department'},
]

for u_info in users_data:
    u, created = User.objects.get_or_create(username=u_info['username'])
    u.set_password(u_info['password'])
    u.role = u_info['role']
    u.department = u_info['dept']
    if u_info['role'] == 'superadmin':
        u.is_superuser = True
        u.is_staff = True
    u.is_active = True
    u.save()
    print(f"Updated user '{u.username}' with password 'password123'")
