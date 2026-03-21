from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Shop, Customer, Transaction, ActivityLog, ReminderConfig, ReminderLog

User = get_user_model()


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'phone', 'role', 'shop', 'first_name', 'last_name']


class RegisterSerializer(serializers.Serializer):
    shop_name = serializers.CharField(max_length=200)
    owner_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=20)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        shop = Shop.objects.create(
            shop_name=validated_data['shop_name'],
            owner_name=validated_data['owner_name'],
            phone=validated_data['phone'],
        )
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            phone=validated_data['phone'],
            first_name=validated_data['owner_name'],
            role='owner',
            shop=shop,
        )
        return user


class CustomerSerializer(serializers.ModelSerializer):
    total_credit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_payment = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'address', 'created_at',
                  'total_credit', 'total_payment', 'balance']


class TransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'customer', 'amount', 'type', 'description',
                  'image', 'image_url', 'created_by', 'created_by_name', 'date']
        read_only_fields = ['created_by', 'date']

    def get_created_by_name(self, obj):
        return obj.created_by.first_name if obj.created_by else 'Unknown'

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class StaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'phone', 'role', 'password']

    def create(self, validated_data):
        shop = self.context['request'].user.shop
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', 'staff'),
            shop=shop,
        )
        return user


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'


class ReminderConfigSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = ReminderConfig
        fields = [
            'id', 'enabled', 'channel', 'channel_display',
            'day_of_week', 'day_of_week_display',
            'message_template', 'last_sent_at', 'created_at',
        ]
        read_only_fields = ['last_sent_at', 'created_at']


class ReminderLogSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = ReminderLog
        fields = [
            'id', 'customer', 'customer_name', 'channel',
            'phone', 'message', 'status', 'error_message', 'sent_at',
        ]
