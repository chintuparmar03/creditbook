from django.contrib.auth.models import AbstractUser
from django.db import models


class Shop(models.Model):
    shop_name = models.CharField(max_length=200)
    owner_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.shop_name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('owner', 'Owner'),
        ('cashier', 'Cashier'),
        ('staff', 'Staff'),
    ]
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='owner')

    def __str__(self):
        return f"{self.username} ({self.role})"


class Customer(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='customers')
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def total_credit(self):
        return self.transactions.filter(type='credit').aggregate(
            total=models.Sum('amount'))['total'] or 0

    @property
    def total_payment(self):
        return self.transactions.filter(type='payment').aggregate(
            total=models.Sum('amount'))['total'] or 0

    @property
    def balance(self):
        return self.total_credit - self.total_payment


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('credit', 'Credit'),
        ('payment', 'Payment'),
    ]
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='transactions')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    description = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='transactions/', blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='transactions')
    date = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.type} ₹{self.amount} – {self.customer.name}"


class ActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username}: {self.action}"
