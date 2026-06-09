from django.core.management.base import BaseCommand, CommandError

from apps.common.firebase_config import ping_firebase


class Command(BaseCommand):
    help = "Verify the configured Firebase Realtime Database connection."

    def handle(self, *args, **options):
        result = ping_firebase()
        if not result["connected"]:
            raise CommandError(f"Firebase connection failed: {result.get('error', 'unknown error')}")

        self.stdout.write(self.style.SUCCESS("Connected to Firebase Realtime Database via firebase_admin."))
