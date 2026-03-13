from django.contrib import admin
from .models import Shop, User, Customer, Transaction, ActivityLog

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ['id', 'shop_name', 'owner_name', 'phone', 'created_at']

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'first_name', 'role', 'shop', 'phone']

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'phone', 'shop', 'created_at']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'type', 'amount', 'date', 'created_by']

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'action', 'timestamp']
