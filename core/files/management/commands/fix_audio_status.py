from django.core.management.base import BaseCommand
from files.models import Audio
from office.models import AudioFileText


class Command(BaseCommand):
    help = 'اصلاح وضعیت فایل‌های صوتی بر اساس وجود رکورد در AudioFileText'

    def handle(self, *args, **options):
        self.stdout.write('🔄 شروع اصلاح وضعیت فایل‌های صوتی...')
        
        # دریافت تمام فایل‌های صوتی
        audios = Audio.objects.all()
        fixed_count = 0
        
        for audio in audios:
            # بررسی وجود رکورد در AudioFileText
            has_text_record = AudioFileText.objects.filter(file=audio).exists()
            
            if has_text_record:
                # اگر رکورد وجود دارد، وضعیت باید "تایید شده" باشد
                if audio.status != 'A':
                    audio.status = 'A'
                    audio.save()
                    self.stdout.write(f'✅ فایل {audio.id}: وضعیت به "تایید شده" تغییر یافت')
                    fixed_count += 1
            else:
                # اگر رکورد وجود ندارد، وضعیت باید "در حال پردازش" باشد
                if audio.status not in ['Pr', 'R']:  # R = رد شده
                    audio.status = 'Pr'
                    audio.save()
                    self.stdout.write(f'✅ فایل {audio.id}: وضعیت به "در حال پردازش" تغییر یافت')
                    fixed_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ اصلاح وضعیت تکمیل شد. {fixed_count} فایل اصلاح شد.')
        )
