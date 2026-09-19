from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    help = "Initialize Super Admin and initial demo users"

    def handle(self, *args, **options):
        # 1. Super Admin
        super_admin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@todoteam.com',
                'role': 'superadmin',
                'department': 'Executive Management',
                'is_superuser': True,
                'is_staff': True
            }
        )
        super_admin.role = 'superadmin'
        super_admin.department = 'Executive Management'
        super_admin.is_superuser = True
        super_admin.is_staff = True
        super_admin.set_password('superadmin123')
        super_admin.save()
        self.stdout.write(self.style.SUCCESS(f"Super Admin user '{super_admin.username}' ready (password: superadmin123)"))

        # 2. Standard Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@todoteam.com',
                'role': 'admin',
                'department': 'IT Department',
                'is_superuser': True,
                'is_staff': True
            }
        )
        admin_user.role = 'admin'
        admin_user.department = 'IT Department'
        admin_user.is_superuser = True
        admin_user.is_staff = True
        admin_user.set_password('adminpassword')
        admin_user.save()
        self.stdout.write(self.style.SUCCESS(f"Admin user '{admin_user.username}' ready (password: adminpassword)"))

        # 3. Staff User
        staff_user, created = User.objects.get_or_create(
            username='staff1',
            defaults={
                'email': 'staff1@todoteam.com',
                'role': 'staff',
                'department': 'IT Department',
                'is_superuser': False,
                'is_staff': False
            }
        )
        staff_user.role = 'staff'
        staff_user.department = 'IT Department'
        staff_user.set_password('staffpassword')
        staff_user.save()
        self.stdout.write(self.style.SUCCESS(f"Staff user '{staff_user.username}' ready (password: staffpassword)"))
