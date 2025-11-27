from django.core.management.base import BaseCommand
from accounts.models import User, Profile, Department, Role


class Command(BaseCommand):
    help = 'Create profile for admin user'

    def handle(self, *args, **options):
        try:
            # دریافت کاربر admin
            admin_user = User.objects.get(email='admin@example.com')
            
            # بررسی وجود پروفایل
            if hasattr(admin_user, 'profile'):
                self.stdout.write(
                    self.style.WARNING('پروفایل برای کاربر admin قبلاً وجود دارد')
                )
                return
            
            # ایجاد دپارتمان پیش‌فرض
            department, created = Department.objects.get_or_create(
                name='مدیریت',
                defaults={'description': 'دپارتمان مدیریت سیستم'}
            )
            if created:
                self.stdout.write('دپارتمان "مدیریت" ایجاد شد')
            
            # ایجاد نقش پیش‌فرض
            role, created = Role.objects.get_or_create(
                name='مدیر سیستم',
                defaults={'description': 'نقش مدیر سیستم'}
            )
            if created:
                self.stdout.write('نقش "مدیر سیستم" ایجاد شد')
            
            # ایجاد پروفایل
            profile = Profile.objects.create(
                user=admin_user,
                name='مدیر',
                family='سیستم',
                employee_id='ADMIN001',
                department=department,
                role=role
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'پروفایل برای کاربر admin با موفقیت ایجاد شد (ID: {profile.id})')
            )
            
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('کاربر admin یافت نشد')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'خطا در ایجاد پروفایل: {str(e)}')
            )
