"""
Twilio-based reminder service for sending SMS and WhatsApp messages.
"""
import logging
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_twilio_client():
    """Create and return a Twilio client."""
    from twilio.rest import Client
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        raise ValueError("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.")
    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_sms(to, message):
    """Send an SMS via Twilio. Returns (success, error_message)."""
    try:
        client = _get_twilio_client()
        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to,
        )
        logger.info(f"SMS sent to {to}: SID={msg.sid}")
        return True, ''
    except Exception as e:
        logger.error(f"SMS failed to {to}: {e}")
        return False, str(e)


def send_whatsapp(to, message):
    """Send a WhatsApp message via Twilio. Returns (success, error_message)."""
    try:
        client = _get_twilio_client()
        msg = client.messages.create(
            body=message,
            from_=f'whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}',
            to=f'whatsapp:{to}',
        )
        logger.info(f"WhatsApp sent to {to}: SID={msg.sid}")
        return True, ''
    except Exception as e:
        logger.error(f"WhatsApp failed to {to}: {e}")
        return False, str(e)


def format_reminder_message(template, customer, shop):
    """Format the message template with customer & shop data."""
    return template.format(
        customer_name=customer.name,
        shop_name=shop.shop_name,
        balance=f"{customer.balance:,.2f}",
        total_credit=f"{customer.total_credit:,.2f}",
        total_payment=f"{customer.total_payment:,.2f}",
    )


def send_weekly_reminders(shop):
    """
    Send reminders to all customers with outstanding balance > 0 for a shop.
    Returns dict with counts: {sent, failed, skipped}.
    """
    from .models import ReminderConfig, ReminderLog, Customer

    try:
        config = shop.reminder_config
    except ReminderConfig.DoesNotExist:
        return {'sent': 0, 'failed': 0, 'skipped': 0, 'error': 'No reminder config'}

    if not config.enabled:
        return {'sent': 0, 'failed': 0, 'skipped': 0, 'error': 'Reminders disabled'}

    customers = Customer.objects.filter(shop=shop)
    sent, failed, skipped = 0, 0, 0

    for customer in customers:
        # Only send to customers with outstanding balance
        if customer.balance <= 0:
            skipped += 1
            continue

        # Skip customers without phone numbers
        if not customer.phone:
            skipped += 1
            continue

        message = format_reminder_message(config.message_template, customer, shop)

        if config.channel == 'sms':
            success, error = send_sms(customer.phone, message)
        else:
            success, error = send_whatsapp(customer.phone, message)

        # Log the result
        ReminderLog.objects.create(
            shop=shop,
            customer=customer,
            channel=config.channel,
            phone=customer.phone,
            message=message,
            status='sent' if success else 'failed',
            error_message=error,
        )

        if success:
            sent += 1
        else:
            failed += 1

    # Update last sent timestamp
    config.last_sent_at = timezone.now()
    config.save(update_fields=['last_sent_at'])

    return {'sent': sent, 'failed': failed, 'skipped': skipped}
