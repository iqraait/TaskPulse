import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

# Reset Admin
admin_user, _ = User.objects.get_or_create(username='admin')
admin_user.set_password('admin123')
admin_user.role = 'superadmin'
admin_user.is_superuser = True
admin_user.is_staff = True
admin_user.is_active = True
admin_user.save()

# Reset Fareeda
fareeda_user, _ = User.objects.get_or_create(username='Fareeda')
fareeda_user.set_password('fareeda123')
fareeda_user.role = 'superadmin'
fareeda_user.is_superuser = True
fareeda_user.is_staff = True
fareeda_user.is_active = True
fareeda_user.save()

# Reset Superadmin
superadmin_user, _ = User.objects.get_or_create(username='superadmin')
superadmin_user.set_password('superadmin123')
superadmin_user.role = 'superadmin'
superadmin_user.is_superuser = True
superadmin_user.is_staff = True
superadmin_user.is_active = True
superadmin_user.save()

print("USER_ACCOUNTS_RESET_SUCCESSFULLY")
for u in User.objects.all():
    print(f"Username: {u.username} | Role: {u.role} | Superuser: {u.is_superuser} | Active: {u.is_active}")
