import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# این خط تنظیمات رو از settings.py می‌خونه با پیشوند CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# تسک‌ها رو از همه اپ‌ها می‌خونه
app.autodiscover_tasks()
