from django.core.management.base import BaseCommand
from tasks.models import Task, Comment
from users.models import User
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Seeds initial demo tickets and department data'

    def handle(self, *args, **kwargs):
        superadmin = User.objects.filter(role='superadmin').first() or User.objects.filter(is_superuser=True).first()
        if not superadmin:
            self.stdout.write(self.style.ERROR("Please run init_superadmin first."))
            return

        # Ensure Department Admins exist
        it_admin, _ = User.objects.get_or_create(
            username='it_admin',
            defaults={
                'email': 'it_admin@company.com',
                'role': 'admin',
                'department': 'IT Department'
            }
        )
        if _:
            it_admin.set_password('adminpassword')
            it_admin.save()

        hr_admin, _ = User.objects.get_or_create(
            username='hr_admin',
            defaults={
                'email': 'hr_admin@company.com',
                'role': 'admin',
                'department': 'HR & Operations'
            }
        )
        if _:
            hr_admin.set_password('adminpassword')
            hr_admin.save()

        # Ensure Staff Members exist under departments
        staff1, _ = User.objects.get_or_create(
            username='staff1',
            defaults={
                'email': 'staff1@company.com',
                'role': 'staff',
                'department': 'IT Department'
            }
        )
        if _:
            staff1.set_password('staffpassword')
            staff1.save()

        staff2, _ = User.objects.get_or_create(
            username='staff2',
            defaults={
                'email': 'staff2@company.com',
                'role': 'staff',
                'department': 'HR & Operations'
            }
        )
        if _:
            staff2.set_password('staffpassword')
            staff2.save()

        # Clear old tasks and re-seed
        Task.objects.all().delete()

        demo_tasks = [
            {
                'title': 'Critical Database Migration & Index Optimization',
                'description': 'Migrate production database to PostgreSQL 16 cluster and optimize heavy query indexes.',
                'department': 'IT Department',
                'category': 'maintenance',
                'priority': 'high',
                'status': 'progress',
                'created_by': superadmin,
                'assigned_to': staff1,
                'due_date': date.today() + timedelta(days=3)
            },
            {
                'title': 'Fix Authentication Token Expiry Bug',
                'description': 'Resolve issue where JWT tokens expire prematurely during active user sessions.',
                'department': 'IT Department',
                'category': 'bug',
                'priority': 'high',
                'status': 'pending',
                'created_by': it_admin,
                'assigned_to': staff1,
                'due_date': date.today() + timedelta(days=1)
            },
            {
                'title': 'Deploy Automated CI/CD Pipeline for Microservices',
                'description': 'Configure GitHub Actions workflow for automatic container deployment to Kubernetes.',
                'department': 'IT Department',
                'category': 'feature',
                'priority': 'medium',
                'status': 'done',
                'created_by': superadmin,
                'assigned_to': it_admin,
                'due_date': date.today() - timedelta(days=2)
            },
            {
                'title': 'Q4 Staff Recruitment & Onboarding Portal Setup',
                'description': 'Review candidate applications for Senior DevOps Engineers and initiate interview schedules.',
                'department': 'HR & Operations',
                'category': 'task',
                'priority': 'medium',
                'status': 'progress',
                'created_by': hr_admin,
                'assigned_to': staff2,
                'due_date': date.today() + timedelta(days=5)
            },
            {
                'title': 'Update Employee Health Insurance Policy Guidelines',
                'description': 'Draft and distribute updated medical benefits documentation to all department leads.',
                'department': 'HR & Operations',
                'category': 'task',
                'priority': 'low',
                'status': 'done',
                'created_by': hr_admin,
                'assigned_to': staff2,
                'due_date': date.today() - timedelta(days=1)
            },
            {
                'title': 'Quarterly Financial Audit & Expense Reconciliation',
                'description': 'Reconcile Q3 cloud infrastructure expenditure reports with vendor invoices.',
                'department': 'Finance',
                'category': 'task',
                'priority': 'high',
                'status': 'pending',
                'created_by': superadmin,
                'assigned_to': None,
                'due_date': date.today() + timedelta(days=7)
            }
        ]

        for data in demo_tasks:
            t = Task.objects.create(**data)
            Comment.objects.create(
                task=t,
                user=superadmin,
                message=f"Ticket [{t.ticket_code}] initialized. Please check requirement details."
            )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(demo_tasks)} new demo tickets!"))
