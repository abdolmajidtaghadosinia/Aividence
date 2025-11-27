# Aividence

یک دستیار هوشمند برای مدیریت و پردازش فایل‌های صوتی/متنی است که با تکیه بر Django، Celery و رابط کاربری React (Vite) تجربه‌ای یکپارچه از بارگذاری تا ترنسکرایب و خلاصه‌سازی را فراهم می‌کند.

## قابلیت‌های کلیدی
- **بارگذاری و صف پردازش**: فایل‌ها به‌صورت غیرهمزمان در صف Celery قرار می‌گیرند و وضعیت آن‌ها (در صف، در حال پردازش، تکمیل‌شده، رد شده) به‌روزرسانی می‌شود.
- **نمایش پیشرفت لحظه‌ای**: برای فایل‌های در حال پردازش، درصد پیشرفت به‌صورت زنده در داشبورد با نوار پیشرفت نمایش داده می‌شود و در صورت تغییر وضعیت، نوتیفیکیشن مرورگر ارسال می‌گردد.
- **ترنسکرایب و خلاصه‌سازی**: پس از تکمیل تبدیل/ترنسکرایب، متن استخراج‌شده ذخیره می‌شود و در صورت در دسترس بودن، پردازش زبانی تکمیلی انجام می‌شود.
- **داشبورد و جست‌وجو**: داشبورد ثابت با منوی چسبنده، جست‌وجوی سریع در بخش قهرمان صفحه، و فیلتر بر اساس نام فایل‌های پردازش‌شده.
- **واژه‌نامه و بازبینی**: صفحات جداگانه برای مدیریت واژه‌های کلیدی و بازبینی/ویرایش خروجی‌ها.

## معماری فنی
- **Frontend**: React 19 + TypeScript با Vite، استایل شیشه‌ای و کامپوننت‌های سفارشی برای نوار پیشرفت و نوتیفیکیشن‌ها.
- **Backend**: Django + Django REST Framework، مدیریت کاربران و فایل‌ها، وبهوک/پولینگ وضعیت، و APIهای کمکی.
- **Task Queue**: Celery با Redis به‌عنوان broker/result backend برای پردازش پس‌زمینه و ردیابی وضعیت.
- **دیتابیس**: PostgreSQL برای ذخیره فایل‌ها، متن پردازش‌شده، و متادیتا.
- **وب سرور**: Nginx به‌همراه Gunicorn در استقرار کانتینری.

## پیش‌نیازها
- Docker و Docker Compose (برای استقرار/اجرای سریع).
- یا برای توسعه محلی بدون Docker:
  - Python 3.12
  - Node.js 20 و npm
  - PostgreSQL و Redis در دسترس

## آماده‌سازی متغیرهای محیطی
نمونه‌ای از مقادیر مورد نیاز در `core/secrets.env` قرار دارد. برای توسعه یا استقرار محلی:
1. یک کپی به نام `core/secrets.local.env` بسازید.
2. مقادیر حساس را با کلیدهای امن خود جایگزین کنید (کلید جنگو، کلید API ترنسکرایب، کلید Gemini و ...).
3. این فایل در `.gitignore` قرار دارد و نباید در مخزن عمومی تعهد شود.

## اجرای سریع با Docker Compose
```bash
# اجرا با کانفیگ محلی و هلس‌چک (پیشنهادی)
docker-compose -f docker-compose.local.yml up --build
# یا به‌صورت پس‌زمینه
docker-compose -f docker-compose.local.yml up --build -d
```
سرویس‌ها پس از بالا آمدن:
- Frontend: http://localhost:3000
- Backend API و Swagger: http://localhost:8000
- Django Admin: http://localhost:8000/admin/
- Nginx (تجمیع سرویس‌ها): http://localhost

در صورت مشکل هلس‌چک، می‌توانید از `docker-compose.simple.yml` استفاده کنید.

## راه‌اندازی برای توسعه بدون Docker
### Backend (Django)
```bash
cd core
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-py312.txt
export $(cat secrets.local.env | xargs)  # یا بارگذاری دستی مقادیر لازم
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
اجرای Celery (در ترمینال جدا):
```bash
cd core
source .venv/bin/activate
export $(cat secrets.local.env | xargs)
python manage_celery.py worker -l info
python manage_celery.py beat -l info  # در صورت نیاز به زمان‌بندی
```

### Frontend (React + Vite)
```bash
cd front
npm install
npm run dev -- --host --port 3000
```
پیش‌فرض API در همان میزبان لوکال است؛ در صورت نیاز آدرس را در لایه فراخوانی API به‌روزرسانی کنید.

## ساخت و تست
- ساخت فرانت‌اند: `cd front && npm run build`
- تست‌های بک‌اند (در صورت تعریف): `cd core && python manage.py test`
- می‌توانید با `docker-compose -f docker-compose.local.yml logs -f` لاگ تمام سرویس‌ها را مشاهده کنید.

## ساختار مخزن
- `core/` : کد Django، تنظیمات، اسکریپت Celery، و فایل‌های Docker مرتبط با بک‌اند.
- `front/` : کد React/Vite، کامپوننت‌ها، صفحات، و استایل‌های فرانت‌اند.
- `docker-compose*.yml` : سناریوهای اجرای کانتینری (محلی یا ساده).
- `README_LOCAL.md` : راهنمای مختصر اجرای محلی با Docker به زبان فارسی.

## نکات عملیاتی
- برای کلیدها و رمزها از متغیرهای محیطی استفاده کنید و فایل‌های حاوی اسرار را متعهد نکنید.
- هنگام استقرار تولیدی، `DJANGO_DEBUG` را روی 0 و `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS` را مطابق دامنه تنظیم کنید.
- اطمینان حاصل کنید Redis و PostgreSQL قبل از اجرای Celery و Django در دسترس باشند.

## پشتیبانی و مشارکت
Pull Requestها و Issueها خوش‌آمدید. لطفاً پیش از ارسال، تغییرات خود را با `npm run build` برای فرانت و تست‌های جنگو برای بک‌اند بررسی کنید.
