from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = "Creates a default admin user if one does not exist."

    def handle(self, *args, **options):
        email = "admin@example.com"
        password = "Admin123"
        ip=''

        if not User.objects.filter(pk=1).exists():
            User.objects.create_superuser(email=email, password=password)
            self.stdout.write(self.style.SUCCESS(f'Default admin user "{email}" created.'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user "{email}" already exists.'))