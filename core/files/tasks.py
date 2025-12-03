import os
import whisper
import librosa
import soundfile as sf
import numpy as np
from celery import shared_task
import traceback
import json
import time
import requests
import logging
from urllib.parse import urlparse, urlunparse
from django.conf import settings
from files.models import Audio
from office.models import AudioFileText
from main.models import Prompt
from celery import states

logger = logging.getLogger(__name__)

# پرامپت پیش‌فرض بر اساس نوع فایل
DEFAULT_TYPE_PROMPTS = {
    "S": "این متن را به یک صورت جلسه رسمی با بخش‌های خلاصه، تصمیمات و اقدامات تبدیل کن.",
    "L": "این متن را به قالب درس آموخته با توضیح مسئله، اقدام انجام‌شده و نتیجه تبدیل کن.",
}


def get_prompt_text_for_audio(audio_instance):
    """دریافت پرامپت مناسب بر اساس نوع فایل یا زیرمجموعه"""
    prompt = None

    try:
        # ابتدا بر اساس زیرمجموعه فعلی (سازگاری با داده‌های موجود)
        prompt = Prompt.objects.filter(type=audio_instance.subset, is_active=True).first()

        # در صورت نبود پرامپت فعال، تلاش بر اساس عنوان نوع فایل (صورت‌جلسه، درس‌آموخته و ...)
        if not prompt:
            prompt = Prompt.objects.filter(
                type__title__iexact=audio_instance.get_file_type_display(),
                is_active=True,
            ).first()
    except Exception as e:
        logger.warning(f"⚠️ خطا در دریافت پرامپت: {e}")

    if prompt and prompt.content:
        return prompt.content

    # پرامپت پیش‌فرض متناسب با نوع فایل
    if audio_instance and audio_instance.file_type in DEFAULT_TYPE_PROMPTS:
        return DEFAULT_TYPE_PROMPTS[audio_instance.file_type]

    # fallback عمومی
    return "این متن رو به یک صورت جلسه رسمی تبدیل کن"


def build_hf_payload(prompt_text, content_file, audio_instance=None):
    """ساخت payload برای Hugging Face Chat Completions همراه با متادیتا."""
    meta = []
    if audio_instance:
        try:
            meta.append(f"نوع فایل: {audio_instance.get_file_type_display()}")
            meta.append(f"عنوان فایل: {audio_instance.name}")
            if getattr(audio_instance, "subject", None):
                meta.append(f"موضوع: {audio_instance.subject}")
        except Exception:
            pass

    system_content = prompt_text.strip()
    if meta:
        system_content = f"{system_content}\n\n" + "\n".join(meta)

    return {
        "model": getattr(settings, 'HF_MODEL', 'Qwen/Qwen2.5-72B-Instruct'),
        "messages": [
            {"role": "system", "content": system_content},
            {"role": "user", "content": content_file},
        ],
        "max_tokens": 1024,
        "temperature": 0.7,
    }


def resolve_hf_api_url(raw_url: str) -> str:
    """Normalize Hugging Face endpoint to router chat completions."""
    url = (raw_url or '').strip()
    if not url:
        raise RuntimeError("❌ HF_API_URL تنظیم نشده است")

    parsed = urlparse(url)

    scheme = parsed.scheme or 'https'
    netloc = parsed.netloc or ''
    path = parsed.path or ''

    if 'api-inference.huggingface.co' in netloc:
        netloc = netloc.replace('api-inference.huggingface.co', 'router.huggingface.co')

    if 'router.huggingface.co' in netloc:
        if '/v1/chat/completions' in path:
            path = path[path.find('/v1/chat/completions'):]
        elif '/chat/completions' in path:
            path = '/v1' + path[path.find('/chat/completions'):]
        else:
            path = '/v1/chat/completions'

    normalized = urlunparse((scheme, netloc, path or '/v1/chat/completions', '', '', ''))
    return normalized.rstrip('/')


def raise_task_failure(task, message, progress=0):
    """Register a Celery failure state with proper exception metadata and raise."""
    try:
        task.update_state(
            state=states.FAILURE,
            meta={
                'exc_type': 'RuntimeError',
                'exc_message': message,
                'exc_module': 'builtins',
                'progress': progress,
                'status': message,
            },
        )
    except Exception:
        logger.debug("⚠️ ثبت وضعیت خطا در Celery ناموفق بود")
    raise RuntimeError(message)


def uplouder_audio(audio_name, audio_path,  retries=3, wait=5):
    url = "https://www.eboo.ir/api/ocr/getway"
    logger.info(f"🔄 شروع آپلود فایل: {audio_name} از مسیر: {audio_path}")

    payload = {"command": "addfile", "token": "dh4wReVMSttw38ps86wDj77Bteu2MkyY"}

    if not os.path.isabs(audio_path):
        audio_path = os.path.join(settings.MEDIA_ROOT, audio_path)
        logger.info(f"📁 مسیر نسبی تبدیل شد به: {audio_path}")

    if not os.path.exists(audio_path):
        logger.error(f"❌ مسیر فایل یافت نشد: {audio_path}")
        return {"error": "فایل فیزیکی یافت نشد", "status": 'E'}

    file_size = os.path.getsize(audio_path)
    logger.info(f"📊 حجم فایل: {file_size / (1024*1024):.2f} مگابایت")

    mime = 'audio/mpeg'
    try:
        import mimetypes
        guessed = mimetypes.guess_type(audio_path)[0]
        if guessed:
            mime = guessed
        logger.info(f"🎵 نوع MIME تشخیص داده شده: {mime}")
    except Exception as e:
        logger.warning(f"⚠️ خطا در تشخیص نوع فایل: {e}")

    headers = {
        'Cookie': 'XSRF-TOKEN=eyJpdiI6ImQ5MjVZc2V3RFlEeWxNbXdha1cwOUE9PSIsInZhbHVlIjoiQmhmUC9oRlh2WVN5YVYydmJvNDR6UkZjeGowVURsN20vZUJQNk9kSHJBVHlzY2V6MUpMSzR2a0dOeDlxTFdlWHRJY0xPSW0xYnpxRHRIZkF4d0xtenQ4Zk40ZVlhaUNhM2tza1ZmOWl6QTIvRVhNVzlBL0VWaWxPMnpLNlRtd0giLCJtYWMiOiIxMGY2OWIyMjZjNzY1YWY3ZmRjMzQwMGU2MTc2MmQ0N2JkYjkwMjM4YWUzYzBiNDg3NWZhNmEwMTFiMjcxZTE0IiwidGFnIjoiIn0%3D; ebooir_session=eyJpdiI6IjlsTXI1Z09uc29KY1dTdkVMMUVHV0E9PSIsInZhbHVlIjoibFlRZXNNbWZFSExDdG1aMnNYdTNpRWROd1dpWVRnQjltaDkxSkNYTlJrV0JNMEtnMTNjZTV6L3pMZDIwYU9WcGw4WTVhLzc2KzZXZDAxeGpBakRsbXRCMmxnZ1hiejV5cFc0RVp3WG14NXlwTXUxNVVXK2picUtjWjdiODVmTHkiLCJtYWMiOiIzNTgwODViNjQxMzEzN2Y5NmUzNjU1YjhkOTk2NTQzMGQ0MjM1MDY1YTg3YTUzN2RmNDQ0NTJjZTg2MzQ0ZjFmIiwidGFnIjoiIn0%3D'
    }

    logger.info(f"🌐 ارسال درخواست به: {url}")
    logger.info(f"📦 Payload: {payload}")
    logger.info(f"🍪 Headers: {list(headers.keys())}")

    for attempt in range(retries):
        try:
            with open(audio_path, 'rb') as audio_file:
                logger.info("✅ فایل با موفقیت باز شد")
                files = [
                    ('filehandle', (os.path.basename(audio_name) or os.path.basename(audio_path), audio_file, mime))
                ]

                response = requests.request("POST", url, headers=headers, data=payload, files=files, timeout=60)
                logger.info(f"📡 پاسخ دریافت شد - کد وضعیت: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ اشکال شبکه یا فایل در آپلود (تلاش {attempt + 1}/{retries}): {e}")
            if attempt < retries - 1:
                logger.info(f"↩️ تلاش مجدد در {wait} ثانیه")
                time.sleep(wait)
                continue
            return {"error": "اشکال شبکه در آپلود", "status": 'AP', "code": "TransientUploadError"}

        if response.status_code == 200:
            try:
                data = response.json()
                logger.info(f"📄 پاسخ JSON: {data}")
            except Exception as e:
                logger.error(f"❌ خطا در پارس کردن JSON: {e}")
                logger.error(f"📄 محتوای خام پاسخ: {response.text[:500]}")
                return {"error": "پاسخ نامعتبر از سرور", "status": 'E'}

            if data.get("Status") == "Done":
                result = data.get("FileToken")
                if result:
                    logger.info(f"✅ فایل با موفقیت آپلو شد - FileToken: {result}")
                    return result
                logger.warning("⚠️ فایل آپلود نشد - FileToken موجود نیست")
                return {"error": "فایل آپلود نشد", "status": 'E'}
            elif data.get("Status") == "NoEnoughCredit":
                logger.error("❌ خطا از سرویس iotype (Status): NoEnoughCredit - اعتبار حساب کافی نیست")
                logger.error(f"📄 کل پاسخ: {data}")
                return {"error": "اعتبار سرویس کافی نیست", "status": 'AP', "code": "NoEnoughCredit"}
            else:
                logger.error(f"❌ خطا از سرویس iotype (Status): {data.get('Status')}")
                logger.error(f"📄 کل پاسخ: {data}")
                return {"error": "خطا در آپلود فایل", "status": 'E'}

        try:
            body = response.text[:500]
        except Exception:
            body = ''
        logger.error(f"❌ خطا از سرویس iotype (کد {response.status_code})")
        logger.error(f"📄 محتوای پاسخ: {body}")

        if 500 <= response.status_code < 600 and attempt < retries - 1:
            logger.info(f"↩️ تلاش مجدد به دلیل خطای موقت سرور در {wait} ثانیه")
            time.sleep(wait)
            continue

        if 500 <= response.status_code < 600:
            logger.warning("⚠️ سرویس پردازش در دسترس نیست؛ تلاش بعدی به تعویق افتاد")
            return {
                "error": "سرویس پردازش در دسترس نیست، بعدا دوباره تلاش می‌کنیم",
                "status": 'SU',
                "code": "ServiceUnavailable",
                "next_retry_seconds": wait,
            }

        return {"error": "خطا در آپلود فایل", "status": 'E'}

def start_convert_audio_to_text(file_token):
    url = "https://www.eboo.ir/api/ocr/getway"
    logger.info(f"🔄 شروع تبدیل گفتار به متن برای FileToken: {file_token}")

    payload = {'token': 'dh4wReVMSttw38ps86wDj77Bteu2MkyY',
    'lang': 'fa',
    'command': 'convert',
    'filetoken': file_token}

    headers = {
    'Cookie': 'XSRF-TOKEN=eyJpdiI6InNzZ0FVRllLZWp4OWhjME54OE12THc9PSIsInZhbHVlIjoiMFhnbkppME9Bczl0dHpGYXRSbGM0WkExbGdDcjZyM3NGMXlnYmxXZHN1aC84NDNvUkM5YzdsRngvT0NuNWRLbm0zK3Y4N2RoblJVMDhodTdLekFOdnY4T2w1WHNVWGVnNVV0a0pjblphcVFJVklIR2FmMi9mWDQxTW5HTFFhNTkiLCJtYWMiOiJhZGZjZWIwMzM2MDZhNDhkMzc1NTUzY2FkNDMxNWU4MGQzYzkxYWQ3MzJlYWE4NjEzMzZmZDU0NjYxZGNhZTMxIiwidGFnIjoiIn0%3D; ebooir_session=eyJpdiI6Ikw1UGdEcmZBUVNxd2JXUDdQanFZK0E9PSIsInZhbHVlIjoiZXpiSWlzb0t2NEJpSTQrSFVLTXNKbVlyMm04d00xRDBvbWIzTDlpSndmcUd5ZEFRZDdqcUlMcDdVbjlwVkFzQVZLTmNVOU5TN3A4WTZjaDM1UUxxU0VRcFNqNmFodUJGOHo5MWEvTkRpUHpReGR0T3FTL3VVNlNXa3N6ZjdadFEiLCJtYWMiOiIwZmVjMzVhZjhhM2I4MDhhMGYwZmI1MzI3OTY1MTg3MmVmNjE0OGE1ZmZlYWViNjJlZTE5NGQ1NjFiZGE3Mjg2IiwidGFnIjoiIn0%3D'
    }

    logger.info(f"🌐 ارسال درخواست تبدیل به: {url}")
    logger.info(f"📦 Payload: {payload}")

    try:
        response = requests.request("POST", url, headers=headers, data=payload, timeout=60)
        logger.info(f"📡 پاسخ دریافت شد - کد وضعیت: {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"❌ اشکال شبکه در شروع تبدیل: {e}")
        return {"error": "اشکال شبکه در شروع تبدیل", "status": 'E'}

    if response.status_code == 200:
        try:
            data = response.json()
            logger.info(f"📄 پاسخ JSON: {data}")
        except Exception as e:
            logger.error(f"❌ خطا در پارس کردن JSON: {e}")
            logger.error(f"📄 محتوای خام پاسخ: {response.text[:500]}")
            return {"error": "پاسخ نامعتبر از سرور", "status": 'E'}
            
        if data.get("Status") == "ConvertStarted":
            logger.info("✅ تبدیل گفتار به متن با موفقیت شروع شد")
            return "ConvertStarted"
        else:
            logger.error(f"❌ خطا در شروع تبدیل (Status): {data.get('Status')}")
            logger.error(f"📄 کل پاسخ: {data}")
            return {"error": "خطا در شروع تبدیل گفتار به متن", "status": 'E'}
    else:
        try:
            body = response.text[:500]
        except Exception:
            body = ''
        logger.error(f"❌ خطا از سرویس iotype (کد {response.status_code})")
        logger.error(f"📄 محتوای پاسخ: {body}")
        return {"error": "خطا در شروع تبدیل گفتار به متن", "status": 'E'}

def get_text_from_file_token(file_token):
    url = "https://www.eboo.ir/api/ocr/getway"
    logger.info(f"🔍 بررسی وضعیت تبدیل برای FileToken: {file_token}")

    payload = {'token': 'dh4wReVMSttw38ps86wDj77Bteu2MkyY',
    'command': 'checkconvert',
    'filetoken': file_token}
    headers = {
    'Cookie': 'XSRF-TOKEN=eyJpdiI6IjN2U0JNY1VHQVhlQTBYTnB3anpmYlE9PSIsInZhbHVlIjoiSmJGZWR2ZUlESUR2ZWgzSXRDOWNGY24vaS81NGJ1UzRMYy9jaFVmalcxNzB0OXhyZjIzazAvbHM4U0FDZmhPeU5Pd0VwWW9PcVU1QjliK3FIRzUrc0pCM2tkS292dEpCeEo0WG04dUxMallsYlcyR1NJQzVLZjBxdll0S3Q5a2MiLCJtYWMiOiI2MjlhM2MyM2ZiMjQ2NDIxYjY0N2M1YzZiN2JiNjZjOWJhODdkNTM2YjA4N2JiM2E1ZmNjMDllYWNiYzQ5YjMxIiwidGFnIjoiIn0%3D; ebooir_session=eyJpdiI6Ijc2WW9CNGE0bGlnRHVXUWtKNFNGQkE9PSIsInZhbHVlIjoiZ1orQ2xQVk4vUGExOTJkZHdsd0hlU0FaY21DVTd5Wkp0SEJwSzU1VWs2TmJUblB1eVRidWtpNXRpMURGNHJOSjdRaUQvU3FEV2VCRUlIUTF2Z0h2NTNDcWNuTm4vTjNqcW9zcHhmakV0S244YUVNTy9uZUtZeS9qbElJQjRsK1AiLCJtYWMiOiI5ZDAxNmMzYjgzNGQ1MThlNGFhZGRhNzFjMTU2NjQxNzFiYWFkNmEwOTRmZDZlZWVhNjcxZWIzYjA0NjU3MDZmIiwidGFnIjoiIn0%3D'
    }

    logger.info(f"🌐 ارسال درخواست بررسی وضعیت به: {url}")
    logger.info(f"📦 Payload: {payload}")

    try:
        response = requests.request("POST", url, headers=headers, data=payload, timeout=60)
        logger.info(f"📡 پاسخ دریافت شد - کد وضعیت: {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"❌ اشکال شبکه در بررسی وضعیت: {e}")
        return {"error": "اشکال شبکه در بررسی وضعیت", "status": 'E'}

    if response.status_code == 200:
        try:
            data = response.json()
            logger.info(f"📄 پاسخ JSON: {data}")
        except Exception as e:
            logger.error(f"❌ خطا در پارس کردن JSON: {e}")
            logger.error(f"📄 محتوای خام پاسخ: {response.text[:500]}")
            return {"error": "پاسخ نامعتبر از سرور", "status": 'E'}
            
        status = data.get("Status")
        progress = data.get("Progress")
        
        logger.info(f"📊 وضعیت: {status}, پیشرفت: {progress}")
        
        if status == "ConvertFinished" and progress == "100.00%":
            output = data.get("Output")
            if output:
                logger.info(f"✅ تبدیل تکمیل شد - طول متن: {len(output)} کاراکتر")
                return output
            else:
                logger.warning("⚠️ تبدیل تکمیل شد اما خروجی موجود نیست")
                return {"error": "خروجی موجود نیست", "status": 'E'}
        else:
            # هنوز در حال پردازش
            logger.info(f"⏳ در حال پردازش - پیشرفت: {progress}")
            return {"status": 'Pr', "progress": progress}
    else:
        try:
            body = response.text[:500]
        except Exception:
            body = ''
        logger.error(f"❌ خطا از سرویس iotype (کد {response.status_code})")
        logger.error(f"📄 محتوای پاسخ: {body}")
        return {"error": "خطا در دریافت متن", "status": 'E'}

def save_text_to_database(audio_instance, text, full_text):
    try:
        # حذف رکورد قبلی اگر وجود دارد
        AudioFileText.objects.filter(file=audio_instance).delete()

        # ایجاد رکورد جدید
        audio_text = AudioFileText.objects.create(
            file=audio_instance,
            content_file=text,
            content_processed=full_text,
            custom_content=""  # خالی برای ویرایش بعدی
        )
        logger.info(f"متن در دیتابیس ذخیره شد (ID: {audio_text.id})")

        # تغییر وضعیت فایل به محتوای تولید شده
        audio_instance.status = 'PD'
        audio_instance.save()
        logger.info(f"وضعیت فایل {audio_instance.id} به 'محتوای تولید شده' تغییر یافت")

    except Exception as e:
        error_msg = f"خطا در ذخیره دیتابیس: {str(e)}"
        logger.error(error_msg)
        if audio_instance:
            update_audio_status(audio_instance.id, 'E')
        return {"error": error_msg, "status": 'E'}



@shared_task(bind=True)
def transcribe_online(self, audio_name, audio_path, audio_id=None, language='fa'):
    logger.info(f"🚀 شروع پردازش فایل صوتی: {audio_name} (ID: {audio_id})")

    try:
        # تغییر وضعیت به در حال پردازش
        update_audio_status(audio_id, 'P')
        logger.info(f"📝 وضعیت فایل {audio_id} به 'در حال پردازش' تغییر یافت")
        try:
            self.update_state(state='PROGRESS', meta={'progress': 5, 'status': 'شروع پردازش فایل'})
        except Exception:
            logger.debug("⚠️ به‌روزرسانی اولیه وضعیت Celery ناموفق بود")

        # مرحله 1: آپلود فایل
        logger.info("📤 مرحله 1: آپلود فایل به سرویس iotype")
        file_token = uplouder_audio(audio_name, audio_path)

        if isinstance(file_token, str):
            logger.info(f"✅ آپلود موفق - FileToken: {file_token}")

            try:
                self.update_state(state='PROGRESS', meta={'progress': 20, 'status': 'آپلود فایل انجام شد'})
            except Exception:
                logger.debug("⚠️ ثبت پیشرفت آپلود در Celery ناموفق بود")

            # ذخیره file_token در دیتابیس
            audio_instance = Audio.objects.get(id=audio_id)
            audio_instance.file_token = file_token
            audio_instance.save()
            logger.info(f"💾 FileToken در دیتابیس ذخیره شد")
            
            # مرحله 2: شروع تبدیل
            logger.info("🔄 مرحله 2: شروع تبدیل گفتار به متن")
            convert_result = start_convert_audio_to_text(file_token)

            if convert_result == "ConvertStarted":
                logger.info("✅ تبدیل با موفقیت شروع شد")

                try:
                    self.update_state(state='PROGRESS', meta={'progress': 30, 'status': 'شروع تبدیل فایل'})
                except Exception:
                    logger.debug("⚠️ ثبت پیشرفت شروع تبدیل در Celery ناموفق بود")

                # فرصت به سرویس برای شروع پردازش
                logger.info("⏳ انتظار 10 ثانیه برای شروع پردازش...")
                time.sleep(10)

                # مرحله 3: بررسی وضعیت تبدیل
                logger.info("🔍 مرحله 3: بررسی وضعیت تبدیل")
                start_time = time.time()
                max_wait_seconds = 15 * 60  # 15 دقیقه سقف انتظار
                check_count = 0
                
                while True:
                    check_count += 1
                    logger.info(f"🔍 بررسی شماره {check_count} - زمان باقی‌مانده: {max_wait_seconds - (time.time() - start_time):.0f} ثانیه")
                    
                    text = get_text_from_file_token(file_token)
                    
                    if isinstance(text, str):
                        logger.info(f"✅ تبدیل تکمیل شد - طول متن: {len(text)} کاراکتر")
                        break
                        
                    if isinstance(text, dict):
                        status_flag = text.get("status")
                        progress = text.get("progress", "نامشخص")

                        if status_flag == 'E':
                            logger.error(f"❌ خطا در تبدیل: {text}")
                            update_audio_status(audio_id, 'E')
                            raise_task_failure(self, str(text))

                        # اگر همچنان در حال پردازش است، منتظر بمانیم
                        if status_flag == 'Pr':
                            logger.info(f"⏳ در حال پردازش - پیشرفت: {progress}")

                            try:
                                numeric_progress = float(str(progress).replace('%', ''))
                            except Exception:
                                numeric_progress = 0

                            try:
                                self.update_state(
                                    state='PROGRESS',
                                    meta={
                                        'progress': max(0, min(100, numeric_progress)),
                                        'status': f"در حال تبدیل ({progress})"
                                    }
                                )
                            except Exception:
                                logger.debug("⚠️ ثبت درصد پیشرفت در Celery ناموفق بود")

                            # کنترل تایم‌اوت کلی
                            if time.time() - start_time > max_wait_seconds:
                                logger.error(f"⏰ تایم‌اوت - بیش از {max_wait_seconds/60:.0f} دقیقه انتظار")
                                update_audio_status(audio_id, 'E')
                                raise_task_failure(self, 'تایم‌اوت در پردازش', numeric_progress)

                            logger.info("⏳ انتظار 5 ثانیه...")
                            time.sleep(5)
                            continue
                    
                    # پاسخ نامعتبر
                    logger.error(f"❌ پاسخ نامعتبر از سرویس: {text}")
                    update_audio_status(audio_id, 'E')
                    return {"error": "Invalid response from conversion status", "status": 'E'}
                
                # مرحله 4: پردازش متن با Hugging Face (اختیاری)
                logger.info("🤖 مرحله 4: پردازش متن با Hugging Face")
                full_text = text  # استفاده از متن خام به عنوان fallback
                try:
                    prompt_text = get_prompt_text_for_audio(audio_instance)
                    logger.info(f"📝 پرامپت استفاده شده: {prompt_text[:50]}...")

                    processed_text = process_with_huggingface(prompt_text, text, audio_instance)
                    if processed_text and processed_text.strip():
                        full_text = processed_text.strip()
                        logger.info(f"✅ پردازش با Hugging Face تکمیل شد - متن ساختاریافته جایگزین شد (طول: {len(full_text)})")
                    else:
                        logger.warning("⚠️ متن پردازش شده توسط Hugging Face خالی بود، از متن اصلی استفاده می‌شود")

                except Exception as e:
                    logger.warning(f"⚠️ خطا در پردازش متن با Hugging Face، از متن اصلی استفاده می‌شود: {str(e)}")

                # مرحله 5: ذخیره در دیتابیس
                logger.info("💾 مرحله 5: ذخیره در دیتابیس")
                save_text_to_database(audio_instance, text, full_text)

                try:
                    self.update_state(state='SUCCESS', meta={'progress': 100, 'status': 'پردازش تکمیل شد'})
                except Exception:
                    logger.debug("⚠️ ثبت اتمام پردازش در Celery ناموفق بود")

                logger.info(f"🎉 پردازش فایل {audio_id} با موفقیت تکمیل شد")
                return {"success": True, "audio_id": audio_id, "status": 'PD'}
            else:
                logger.error(f"❌ خطا در شروع تبدیل: {convert_result}")
                update_audio_status(audio_id, 'E')
                raise_task_failure(self, 'خطا در شروع تبدیل گفتار به متن')
        else:
            logger.error(f"❌ خطا در آپلود فایل: {file_token}")
            error_status = None

            if isinstance(file_token, dict):
                error_status = file_token.get("status")
                error_code = file_token.get("code")

                if error_code in {"ServiceUnavailable", "TransientUploadError"}:
                    logger.warning("🚧 سرویس پردازش در دسترس نیست؛ فایل در حالت عدم دسترسی ثبت می‌شود")
                    update_audio_status(audio_id, 'SU')

                    retry_in = file_token.get("next_retry_seconds", 0)
                    status_message = 'سرویس پردازش موقتا در دسترس نیست؛ لطفاً بعداً دوباره تلاش کنید'

                    try:
                        self.update_state(
                            state=states.FAILURE,
                            meta={
                                'exc_type': 'RuntimeError',
                                'exc_message': status_message,
                                'exc_module': 'builtins',
                                'progress': 0,
                                'status': status_message,
                                'retry_after': retry_in,
                            }
                        )
                    except Exception:
                        logger.debug("⚠️ ثبت پیام وضعیت موقت در Celery ناموفق بود")

                    return {"error": status_message, "status": 'SU', "code": error_code}

                # اگر اعتبار سرویس کافی نباشد، فایل را به حالت انتظار پردازش برگردانیم تا به صورت خودکار رد نشود
                if error_code == "NoEnoughCredit" or error_status == 'AP':
                    logger.info("↩️ برگرداندن وضعیت فایل به 'در انتظار پردازش' به دلیل کمبود اعتبار سرویس")
                    update_audio_status(audio_id, 'AP')
                    try:
                        self.update_state(state='PROGRESS', meta={'progress': 0, 'status': 'کمبود اعتبار سرویس پردازش'})
                    except Exception:
                        logger.debug("⚠️ ثبت پیام کمبود اعتبار در Celery ناموفق بود")
                    return {"error": "اعتبار سرویس پردازش کافی نیست. لطفاً پس از شارژ مجدد دوباره تلاش کنید.", "status": 'AP'}

            update_audio_status(audio_id, 'E')
            raise_task_failure(self, 'خطا در آپلود فایل')

    except Exception as e:
        logger.error(f"❌ خطای کلی در پردازش: {str(e)}")
        try:
            audio = Audio.objects.get(id=audio_id)
            if audio.status != 'SU':
                update_audio_status(audio_id, 'E')
        except Exception:
            update_audio_status(audio_id, 'E')
        raise_task_failure(self, str(e))

    return {"success": True, "audio_id": audio_id, "status": 'P'}






def process_with_huggingface(prompt_text, content_file, audio_instance=None):
    """پردازش متن خام با Hugging Face Chat Completions"""
    import logging

    logger = logging.getLogger(__name__)
    if not getattr(settings, 'HF_API_TOKEN', ''):
        raise RuntimeError("❌ HF_API_TOKEN تنظیم نشده است")

    url = resolve_hf_api_url(getattr(settings, 'HF_API_URL', ''))

    payload = build_hf_payload(prompt_text, content_file, audio_instance)
    headers = {
        'Authorization': f"Bearer {settings.HF_API_TOKEN}",
        'Content-Type': 'application/json',
    }

    try:
        safe_url = url.replace(settings.HF_API_TOKEN, "[redacted]") if settings.HF_API_TOKEN else url
        logger.info(f"ارسال درخواست به Hugging Face API - URL: {safe_url}")
        resp = requests.post(url, headers=headers, json=payload, timeout=120)
        resp.raise_for_status()

        data = resp.json()
        if not isinstance(data, dict):
            raise RuntimeError("❌ ساختار پاسخ Hugging Face نامعتبر است")

        choices = data.get('choices')
        if not choices:
            raise RuntimeError("❌ متن در پاسخ Hugging Face یافت نشد")

        message = choices[0].get('message') if isinstance(choices[0], dict) else None
        if not message or 'content' not in message:
            raise RuntimeError("❌ متن در پاسخ Hugging Face یافت نشد")

        result_text = (message.get('content') or '').strip()
        if not result_text:
            raise RuntimeError("❌ متن پاسخ خالی است")

        logger.info("پردازش متن با Hugging Face با موفقیت انجام شد")
        return result_text

    except requests.exceptions.Timeout:
        error_msg = "تایم‌اوت در ارتباط با Hugging Face API"
        logger.error(error_msg)
        raise RuntimeError(f"❌ {error_msg}")
    except requests.exceptions.ConnectionError:
        error_msg = "خطا در اتصال به Hugging Face API"
        logger.error(error_msg)
        raise RuntimeError(f"❌ {error_msg}")
    except requests.exceptions.HTTPError as e:
        error_msg = f"خطای HTTP از Hugging Face API: {e}"
        logger.error(error_msg)
        raise RuntimeError(f"❌ {error_msg}")
    except Exception as e:
        error_msg = f"خطا در Hugging Face API: {e}"
        logger.error(error_msg)
        raise RuntimeError(f"❌ {error_msg}")


# --- توابع جانبی دیگر ---

def update_audio_status(audio_id, status):
    """تغییر وضعیت فایل صوتی"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        audio = Audio.objects.get(id=audio_id)
        audio.status = status
        audio.save()
        logger.info(f"وضعیت فایل {audio_id} به '{status}' تغییر یافت")
    except Audio.DoesNotExist:
        logger.error(f"فایل با ID {audio_id} یافت نشد")
    except Exception as e:
        logger.error(f"خطا در تغییر وضعیت فایل {audio_id}: {str(e)}")


def check_processing_status(audio_id):
    """بررسی وضعیت پردازش فایل صوتی"""
    try:
        audio = Audio.objects.get(id=audio_id)
        
        # بررسی وجود رکورد در AudioFileText
        has_text_record = AudioFileText.objects.filter(file=audio).exists()
        
        if has_text_record:
            # اگر رکورد وجود دارد، وضعیت باید "تایید شده" باشد
            if audio.status != 'A':
                audio.status = 'A'
                audio.save()
                print(f"✅ وضعیت فایل {audio_id} به 'تایید شده' تغییر یافت")
            return 'A'  # تایید شده
        else:
            # اگر رکورد وجود ندارد و خطا یا عدم دسترسی ثبت شده، همان وضعیت حفظ شود
            if audio.status in {'E', 'R', 'SU'}:
                return audio.status

            # اگر رکورد وجود ندارد، وضعیت باید "در حال پردازش" باشد
            if audio.status != 'P':
                audio.status = 'P'
                audio.save()
                print(f"✅ وضعیت فایل {audio_id} به 'در حال پردازش' تغییر یافت")
            return 'P'  # در حال پردازش
            
    except Audio.DoesNotExist:
        print(f"❌ فایل با ID {audio_id} یافت نشد")
        return None
    except Exception as e:
        print(f"❌ خطا در بررسی وضعیت فایل {audio_id}: {str(e)}")
        return None
