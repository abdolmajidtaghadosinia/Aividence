# راهنمای اجرای پروژه روی سیستم محلی

## پیش‌نیازها
- Docker و Docker Compose نصب شده باشد
- پورت‌های 80، 3000، 5432، 6379، 8000 آزاد باشند

## مراحل اجرا

### 1. کلون کردن پروژه
```bash
git clone <repository-url>
cd aidoc
```

### 2. اجرای پروژه با Docker Compose

#### روش اول: با Healthcheck (پیشنهادی)
```bash
# اجرای تمام سرویس‌ها
docker-compose -f docker-compose.local.yml up --build

# یا اجرا در background
docker-compose -f docker-compose.local.yml up --build -d
```

#### روش دوم: بدون Healthcheck (در صورت مشکل)
```bash
# اجرای تمام سرویس‌ها
docker-compose -f docker-compose.simple.yml up --build

# یا اجرا در background
docker-compose -f docker-compose.simple.yml up --build -d
```

### 3. دسترسی به سرویس‌ها
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/swagger/
- **Nginx (تمام سرویس‌ها)**: http://localhost

### 4. مدیریت سرویس‌ها
```bash
# مشاهده لاگ‌ها
docker-compose -f docker-compose.local.yml logs -f
# یا
docker-compose -f docker-compose.simple.yml logs -f

# توقف سرویس‌ها
docker-compose -f docker-compose.local.yml down
# یا
docker-compose -f docker-compose.simple.yml down

# توقف و حذف volume ها
docker-compose -f docker-compose.local.yml down -v
# یا
docker-compose -f docker-compose.simple.yml down -v
```

## مشکلات احتمالی و راه‌حل

### مشکل 0: عدم اتصال Docker Desktop (ویندوز)
اگر پیام‌هایی شبیه زیر دریافت کردید:

```
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified
```

1. Docker Desktop را اجرا کنید و مطمئن شوید در حالت **Linux containers** است.
2. در **PowerShell** یا **WSL** دستور `docker info` را اجرا کنید؛ اگر خطا داد، WSL2 را نصب/فعال و Docker Desktop را ری‌استارت کنید.
3. در صورت داشتن چند context، با `docker context use default` به context پیش‌فرض برگردید.
4. سپس دوباره `docker-compose -f docker-compose.local.yml up --build` را اجرا کنید.

### مشکل 1: Healthcheck Error
اگر با پیام "dependency failed to start: container backend_local has no healthcheck configured" مواجه شدید:

```bash
# استفاده از نسخه ساده بدون healthcheck
docker-compose -f docker-compose.simple.yml up --build
```

### مشکل 2: پورت در حال استفاده
```bash
# بررسی پورت‌های در حال استفاده
netstat -tulpn | grep :80
netstat -tulpn | grep :5432

# تغییر پورت در docker-compose.local.yml در صورت نیاز
```

### مشکل 3: مشکل دسترسی به دیتابیس
```bash
# بررسی وضعیت دیتابیس
docker-compose -f docker-compose.local.yml exec postgres_db_local psql -U postgres -d AIDoc
# یا
docker-compose -f docker-compose.simple.yml exec postgres_db_local psql -U postgres -d AIDoc

# ریست کردن دیتابیس
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up --build
# یا
docker-compose -f docker-compose.simple.yml down -v
docker-compose -f docker-compose.simple.yml up --build
```

### مشکل 4: مشکل در Celery
```bash
# بررسی وضعیت Celery
docker-compose -f docker-compose.local.yml logs celery_worker_local
docker-compose -f docker-compose.local.yml logs celery_beat_local
# یا
docker-compose -f docker-compose.simple.yml logs celery_worker_local
docker-compose -f docker-compose.simple.yml logs celery_beat_local
```

### مشکل 5: مشکل در Frontend
```bash
# بررسی وضعیت Frontend
docker-compose -f docker-compose.local.yml logs frontend_local
# یا
docker-compose -f docker-compose.simple.yml logs frontend_local
```

## تنظیمات اضافی

### تغییر پورت‌ها
در فایل `docker-compose.local.yml` می‌توانید پورت‌ها را تغییر دهید:
```yaml
ports:
  - "8080:80"  # تغییر پورت nginx
  - "3001:80"  # تغییر پورت frontend
  - "8001:8000"  # تغییر پورت backend
```

### تغییر تنظیمات دیتابیس
در فایل `core/secrets.local.env` می‌توانید تنظیمات دیتابیس را تغییر دهید:
```env
DB_PASSWORD=your_password
POSTGRES_PORT=5433
```

### تنظیم Gemini
برای جلوگیری از خطاهای 404 در Gemini:

1. کلید را در `GEMINI_API_KEY` تنظیم کنید.
2. در صورت استفاده از URL پیش‌فرض قدیمی، مقدار `GEMINI_URL` را خالی بگذارید یا مدل را به `gemini-1.5-flash-latest` تغییر دهید:

```env
GEMINI_URL=
GEMINI_MODEL=gemini-1.5-flash-latest
GEMINI_API_BASE=https://generativelanguage.googleapis.com/v1beta/models
```

کد پردازش خودکاراً URL قدیمی `.../gemini-1.5-flash:generateContent` را به نسخه `-latest` ارتقا می‌دهد و در صورت نبودن `?key=` کلید را به URL اضافه می‌کند.

## نکات مهم
1. فایل `secrets.local.env` را در `.gitignore` قرار دهید
2. برای production از فایل‌های اصلی استفاده کنید
3. در صورت مشکل، لاگ‌ها را بررسی کنید
4. مطمئن شوید که تمام پورت‌های مورد نیاز آزاد هستند
