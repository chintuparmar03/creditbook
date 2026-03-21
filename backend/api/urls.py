from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('me/', views.MeView.as_view(), name='me'),

    # Customers
    path('customers/', views.CustomerListCreateView.as_view(), name='customer-list'),
    path('customers/<int:pk>/', views.CustomerDetailView.as_view(), name='customer-detail'),
    path('customers/<int:customer_id>/ledger/', views.CustomerLedgerView.as_view(), name='customer-ledger'),

    # Transactions
    path('transactions/', views.TransactionCreateView.as_view(), name='transaction-create'),

    # Staff
    path('staff/', views.StaffListCreateView.as_view(), name='staff-list'),
    path('staff/<int:pk>/', views.StaffDeleteView.as_view(), name='staff-delete'),

    # Analytics
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('customer-risk/<int:customer_id>/', views.CustomerRiskView.as_view(), name='customer-risk'),

    # Reminders
    path('reminders/config/', views.ReminderConfigView.as_view(), name='reminder-config'),
    path('reminders/logs/', views.ReminderLogListView.as_view(), name='reminder-logs'),
    path('reminders/trigger/', views.TriggerRemindersView.as_view(), name='reminder-trigger'),
]
