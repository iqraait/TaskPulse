from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class Task(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('progress', 'In Progress'),
        ('done', 'Done'),
        ('closed', 'Closed')
    )

    CATEGORY_CHOICES = (
        ('task', 'Task 📝'),
        ('bug', 'Bug / Issue 🐛'),
        ('feature', 'Feature Request ✨'),
        ('maintenance', 'Maintenance 🛠️')
    )

    ticket_code = models.CharField(max_length=20, blank=True, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')

    department = models.CharField(max_length=100)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='task')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    closure_reason = models.TextField(blank=True, default='')

    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )

    # Primary Assignee
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )

    # Secondary Assignee (Option to assign 2 staff members)
    assigned_to_secondary = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='secondary_assigned_tasks'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if not self.ticket_code:
            dept_prefix = self.department[:3].upper() if self.department else "TK"
            self.ticket_code = f"{dept_prefix}-{1000 + self.id}"
            super().save(update_fields=['ticket_code'])

    def __str__(self):
        return f"[{self.ticket_code or 'TK'}] {self.title}"


class TaskFlowLog(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="flow_logs"
    )

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    action_type = models.CharField(max_length=50, default='reassigned')
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.action_type}] {self.description}"


class Comment(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user} on {self.task}"


class PushSubscription(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="push_subscriptions"
    )
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField(blank=True, default="")
    auth = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PushSubscription for {self.user.username}"


class TodoItem(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="todos"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    points_value = models.IntegerField(default=15)

    shared_from = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shared_out_todos"
    )

    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['is_completed', '-created_at']

    def __str__(self):
        return f"Todo: {self.title} ({self.user.username})"


class TodoShareRequest(models.Model):
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_todo_shares"
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_todo_shares"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    points_value = models.IntegerField(default=15)
    status = models.CharField(max_length=20, default="pending")  # pending, accepted, declined
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"TodoShare from {self.sender.username} to {self.recipient.username}: {self.title}"