from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Shop, Customer, Transaction, ActivityLog, ReminderConfig, ReminderLog
from .serializers import (
    RegisterSerializer, CustomerSerializer, TransactionSerializer,
    StaffSerializer, UserSerializer, ReminderConfigSerializer, ReminderLogSerializer,
)
from .reminder_service import send_weekly_reminders

User = get_user_model()


# ─── Authentication ──────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Shop registered successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        ActivityLog.objects.create(user=user, action='Logged in')
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# ─── Customers ───────────────────────────────────────────────────

class CustomerListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        return Customer.objects.filter(shop=self.request.user.shop)

    def perform_create(self, serializer):
        customer = serializer.save(shop=self.request.user.shop)
        ActivityLog.objects.create(
            user=self.request.user,
            action=f'Added customer: {customer.name}'
        )


class CustomerDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = CustomerSerializer

    def get_queryset(self):
        return Customer.objects.filter(shop=self.request.user.shop)

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action=f'Deleted customer: {instance.name}'
        )
        instance.delete()


# ─── Transactions ────────────────────────────────────────────────

class TransactionCreateView(generics.CreateAPIView):
    serializer_class = TransactionSerializer
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        txn = serializer.save(
            shop=self.request.user.shop,
            created_by=self.request.user,
        )
        ActivityLog.objects.create(
            user=self.request.user,
            action=f'{txn.type.title()} ₹{txn.amount} for {txn.customer.name}'
        )


class CustomerLedgerView(generics.ListAPIView):
    serializer_class = TransactionSerializer

    def get_queryset(self):
        customer_id = self.kwargs['customer_id']
        return Transaction.objects.filter(
            shop=self.request.user.shop,
            customer_id=customer_id,
        )


# ─── Staff ───────────────────────────────────────────────────────

class StaffListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffSerializer

    def get_queryset(self):
        return User.objects.filter(shop=self.request.user.shop).exclude(id=self.request.user.id)

    def perform_create(self, serializer):
        staff = serializer.save()
        ActivityLog.objects.create(
            user=self.request.user,
            action=f'Added staff: {staff.username}'
        )


class StaffDeleteView(generics.DestroyAPIView):
    serializer_class = StaffSerializer

    def get_queryset(self):
        return User.objects.filter(shop=self.request.user.shop).exclude(role='owner')

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action=f'Removed staff: {instance.username}'
        )
        instance.delete()


# ─── Dashboard / Analytics ───────────────────────────────────────

class DashboardView(APIView):
    def get(self, request):
        shop = request.user.shop
        transactions = Transaction.objects.filter(shop=shop)

        total_credit = transactions.filter(type='credit').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        total_payment = transactions.filter(type='payment').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        outstanding = total_credit - total_payment
        total_customers = Customer.objects.filter(shop=shop).count()
        total_staff = User.objects.filter(shop=shop).count()

        # Monthly trend (last 6 months)
        monthly_trend = []
        today = timezone.now()
        for i in range(5, -1, -1):
            month_start = (today - timedelta(days=30 * i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i > 0:
                month_end = (today - timedelta(days=30 * (i - 1))).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                month_end = today

            credit = transactions.filter(type='credit', date__gte=month_start, date__lt=month_end).aggregate(
                total=Sum('amount'))['total'] or 0
            payment = transactions.filter(type='payment', date__gte=month_start, date__lt=month_end).aggregate(
                total=Sum('amount'))['total'] or 0

            monthly_trend.append({
                'month': month_start.strftime('%b %Y'),
                'credit': float(credit),
                'payment': float(payment),
            })

        # Top debtors
        top_debtors = []
        customers = Customer.objects.filter(shop=shop)
        for c in customers:
            bal = c.balance
            if bal > 0:
                top_debtors.append({'id': c.id, 'name': c.name, 'balance': float(bal)})
        top_debtors.sort(key=lambda x: x['balance'], reverse=True)
        top_debtors = top_debtors[:5]

        # Risk distribution
        risk_counts = {'low': 0, 'medium': 0, 'high': 0}
        for c in customers:
            score = _calculate_risk(c)
            risk_counts[score['level']] += 1

        # Recent activity
        recent_logs = ActivityLog.objects.filter(user__shop=shop)[:10]
        recent = [{'action': l.action, 'timestamp': l.timestamp.isoformat()} for l in recent_logs]

        return Response({
            'total_credit': float(total_credit),
            'total_payment': float(total_payment),
            'outstanding': float(outstanding),
            'total_customers': total_customers,
            'total_staff': total_staff,
            'monthly_trend': monthly_trend,
            'top_debtors': top_debtors,
            'risk_distribution': risk_counts,
            'recent_activity': recent,
        })


# ─── Risk Analysis ───────────────────────────────────────────────

def _calculate_risk(customer):
    """Calculate credit risk score for a customer."""
    balance = float(customer.balance)
    total_credit = float(customer.total_credit)
    total_payment = float(customer.total_payment)

    if total_credit == 0:
        return {'level': 'low', 'score': 0, 'details': 'No credit history'}

    repayment_ratio = total_payment / total_credit if total_credit > 0 else 0

    # Days since last payment
    last_payment = customer.transactions.filter(type='payment').order_by('-date').first()
    if last_payment:
        days_since = (timezone.now() - last_payment.date).days
    else:
        days_since = 999

    # Score calculation (0-100, higher = riskier)
    score = 0
    # Outstanding balance weight
    if balance > 10000:
        score += 30
    elif balance > 5000:
        score += 20
    elif balance > 1000:
        score += 10

    # Repayment ratio weight
    if repayment_ratio < 0.3:
        score += 30
    elif repayment_ratio < 0.6:
        score += 20
    elif repayment_ratio < 0.8:
        score += 10

    # Payment delay weight
    if days_since > 60:
        score += 30
    elif days_since > 30:
        score += 20
    elif days_since > 14:
        score += 10

    # Overdue transactions
    overdue_count = customer.transactions.filter(type='credit').count() - customer.transactions.filter(type='payment').count()
    if overdue_count > 5:
        score += 10

    if score >= 60:
        level = 'high'
    elif score >= 30:
        level = 'medium'
    else:
        level = 'low'

    return {
        'level': level,
        'score': score,
        'repayment_ratio': round(repayment_ratio * 100, 1),
        'days_since_last_payment': days_since if days_since < 999 else None,
        'outstanding_balance': balance,
        'details': f'Risk score {score}/100 – {"High" if level == "high" else "Medium" if level == "medium" else "Low"} risk',
    }


class CustomerRiskView(APIView):
    def get(self, request, customer_id):
        try:
            customer = Customer.objects.get(id=customer_id, shop=request.user.shop)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)

        risk = _calculate_risk(customer)
        return Response({
            'customer': CustomerSerializer(customer).data,
            'risk': risk,
        })


# ─── Reminders ───────────────────────────────────────────────────

class ReminderConfigView(APIView):
    """GET / PUT reminder config for the shop owner."""

    def get(self, request):
        config, created = ReminderConfig.objects.get_or_create(shop=request.user.shop)
        return Response(ReminderConfigSerializer(config).data)

    def put(self, request):
        config, created = ReminderConfig.objects.get_or_create(shop=request.user.shop)
        serializer = ReminderConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ReminderLogListView(generics.ListAPIView):
    """GET reminder send history for the shop."""
    serializer_class = ReminderLogSerializer

    def get_queryset(self):
        return ReminderLog.objects.filter(shop=self.request.user.shop)[:50]


class TriggerRemindersView(APIView):
    """
    POST endpoint to trigger sending reminders.
    Protected by secret token (for external cron) OR authenticated owner.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings as django_settings

        # Auth: either valid JWT owner or secret token
        token = request.data.get('token') or request.query_params.get('token')
        secret = django_settings.REMINDER_SECRET_TOKEN

        if token and secret and token == secret:
            # Cron trigger – send for all enabled shops matching today
            today = timezone.now().weekday()
            configs = ReminderConfig.objects.filter(enabled=True, day_of_week=today)
            results = []
            for config in configs.select_related('shop'):
                result = send_weekly_reminders(config.shop)
                results.append({'shop': config.shop.shop_name, **result})
            return Response({'results': results})

        # Manual trigger by authenticated owner
        if request.user and request.user.is_authenticated:
            if not request.user.shop:
                return Response({'error': 'No shop associated'}, status=400)
            result = send_weekly_reminders(request.user.shop)
            return Response(result)

        return Response({'error': 'Unauthorized'}, status=401)
