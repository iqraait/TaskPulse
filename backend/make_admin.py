import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

u, created = User.objects.get_or_create(username='admin')
u.set_password('AdminPassword123!')
u.role = 'superadmin'
u.is_superuser = True
u.is_staff = True
u.department = 'IT Department'
u.save()

print("✅ SUPERADMIN USER SUCCESSFULLY CREATED/UPDATED!")
print("Username: admin")
print("Password: AdminPassword123!")
