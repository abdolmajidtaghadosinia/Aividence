#!/usr/bin/env python
"""
مدیریت سرویس‌های Celery
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path

# تنظیم مسیر پروژه
BASE_DIR = Path(__file__).resolve().parent
os.chdir(BASE_DIR)

# تنظیم متغیرهای محیطی
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# import Django
import django
django.setup()

def run_command(command, background=False):
    """اجرای دستور"""
    print(f"اجرای دستور: {command}")
    if background:
        return subprocess.Popen(command, shell=True)
    else:
        return subprocess.run(command, shell=True)

def start_redis():
    """شروع Redis"""
    print("🔄 شروع Redis...")
    try:
        # تلاش برای اجرا با Docker
        result = run_command("docker-compose up -d redis")
        if result.returncode == 0:
            print("✅ Redis با Docker شروع شد")
            return True
    except:
        pass
    
    # تلاش برای اجرا مستقیم
    try:
        result = run_command("redis-server --daemonize yes")
        if result.returncode == 0:
            print("✅ Redis شروع شد")
            return True
    except:
        pass
    
    print("❌ خطا در شروع Redis")
    return False

def start_celery_worker():
    """شروع Celery Worker"""
    print("🔄 شروع Celery Worker...")
    try:
        # اجرا در foreground برای نمایش لاگ‌ها
        cmd = "celery -A core worker --loglevel=info --pool=solo"
        process = subprocess.Popen(
            cmd, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        print("✅ Celery Worker شروع شد")
        return process
    except Exception as e:
        print(f"❌ خطا در شروع Celery Worker: {e}")
        return None

def start_celery_beat():
    """شروع Celery Beat"""
    print("🔄 شروع Celery Beat...")
    try:
        cmd = "celery -A core beat --loglevel=info"
        process = run_command(cmd, background=True)
        print("✅ Celery Beat شروع شد")
        return process
    except Exception as e:
        print(f"❌ خطا در شروع Celery Beat: {e}")
        return None

def start_django():
    """شروع Django Server"""
    print("🔄 شروع Django Server...")
    try:
        cmd = "python manage.py runserver 0.0.0.0:8000"
        process = run_command(cmd, background=True)
        print("✅ Django Server شروع شد")
        return process
    except Exception as e:
        print(f"❌ خطا در شروع Django Server: {e}")
        return None

def stop_processes(processes):
    """توقف پروسه‌ها"""
    print("🛑 توقف سرویس‌ها...")
    for process in processes:
        if process:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                process.kill()

def monitor_celery_logs(process):
    """مانیتور کردن لاگ‌های Celery"""
    if process and process.stdout:
        try:
            for line in iter(process.stdout.readline, ''):
                if line:
                    print(f"[Celery] {line.strip()}")
        except:
            pass

def check_celery_status():
    """بررسی وضعیت Celery"""
    print("🔍 بررسی وضعیت Celery...")
    try:
        result = run_command("celery -A core inspect active")
        if result.returncode == 0:
            print("✅ Celery فعال است")
            return True
        else:
            print("❌ Celery غیرفعال است")
            return False
    except Exception as e:
        print(f"❌ خطا در بررسی وضعیت: {e}")
        return False

def main():
    """تابع اصلی"""
    if len(sys.argv) < 2:
        print("""
استفاده:
    python manage_celery.py start    # شروع همه سرویس‌ها
    python manage_celery.py stop     # توقف همه سرویس‌ها
    python manage_celery.py status   # بررسی وضعیت
    python manage_celery.py worker   # فقط Celery Worker
    python manage_celery.py beat     # فقط Celery Beat
    python manage_celery.py django   # فقط Django Server
        """)
        return

    command = sys.argv[1]
    processes = []

    if command == "start":
        print("🚀 شروع همه سرویس‌ها...")
        
        # شروع Redis
        if not start_redis():
            print("❌ خطا در شروع Redis")
            return
        
        # صبر برای آماده شدن Redis
        time.sleep(2)
        
        # شروع Celery Worker
        worker_process = start_celery_worker()
        if worker_process:
            processes.append(worker_process)
        
        # شروع Celery Beat
        beat_process = start_celery_beat()
        if beat_process:
            processes.append(beat_process)
        
        # شروع Django
        django_process = start_django()
        if django_process:
            processes.append(django_process)
        
        print("\n🎉 همه سرویس‌ها شروع شدند!")
        print("📱 Django: http://localhost:8000")
        print("🔧 Celery Worker: فعال")
        print("⏰ Celery Beat: فعال")
        print("\n📋 لاگ‌های Celery:")
        print("=" * 50)
        
        try:
            # مانیتور کردن لاگ‌های Celery Worker
            if worker_process:
                monitor_celery_logs(worker_process)
            
            # نگه داشتن برنامه
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 دریافت سیگنال توقف...")
            stop_processes(processes)
            print("✅ همه سرویس‌ها متوقف شدند")

    elif command == "stop":
        print("🛑 توقف همه سرویس‌ها...")
        run_command("docker-compose down")
        run_command("pkill -f 'celery.*core'")
        run_command("pkill -f 'python.*manage.py runserver'")
        print("✅ همه سرویس‌ها متوقف شدند")

    elif command == "status":
        check_celery_status()

    elif command == "worker":
        print("🔄 شروع فقط Celery Worker...")
        if start_redis():
            time.sleep(2)
            start_celery_worker()

    elif command == "beat":
        print("🔄 شروع فقط Celery Beat...")
        if start_redis():
            time.sleep(2)
            start_celery_beat()

    elif command == "django":
        print("🔄 شروع فقط Django Server...")
        start_django()

    else:
        print(f"❌ دستور نامعتبر: {command}")

if __name__ == "__main__":
    main()