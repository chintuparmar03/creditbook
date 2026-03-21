"""
Management command to send weekly reminders to customers.
Usage: python manage.py send_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import ReminderConfig
from api.reminder_service import send_weekly_reminders


class Command(BaseCommand):
    help = 'Send weekly reminders to customers with outstanding balances'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Send reminders regardless of day_of_week setting',
        )

    def handle(self, *args, **options):
        today = timezone.now().weekday()  # 0=Monday, 6=Sunday
        force = options['force']

        configs = ReminderConfig.objects.filter(enabled=True).select_related('shop')

        if not force:
            configs = configs.filter(day_of_week=today)

        if not configs.exists():
            self.stdout.write(self.style.WARNING(
                f'No reminder configs found for today ({today}). Use --force to override.'
            ))
            return

        total_sent, total_failed = 0, 0

        for config in configs:
            shop = config.shop
            self.stdout.write(f'Sending reminders for shop: {shop.shop_name}...')

            result = send_weekly_reminders(shop)
            total_sent += result['sent']
            total_failed += result['failed']

            self.stdout.write(
                f'  → Sent: {result["sent"]}, Failed: {result["failed"]}, '
                f'Skipped: {result["skipped"]}'
            )

        self.stdout.write(self.style.SUCCESS(
            f'Done! Total sent: {total_sent}, Total failed: {total_failed}'
        ))
