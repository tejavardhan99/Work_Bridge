from django.core.management.base import BaseCommand, CommandError

from apps.accounts.documents import User
from apps.accounts.services import register_user


class Command(BaseCommand):
    help = "Create a WorkBridge admin user."

    def add_arguments(self, parser):
        parser.add_argument("--name", required=True)
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)

    def handle(self, *args, **options):
        if User.objects(email=options["email"]).first():
            raise CommandError("Admin with this email already exists.")
        user = register_user(name=options["name"], email=options["email"], password=options["password"], role=User.ROLE_ADMIN)
        self.stdout.write(self.style.SUCCESS(f"Created admin user {user.email}"))
