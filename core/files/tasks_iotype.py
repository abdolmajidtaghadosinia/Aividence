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
from django.conf import settings
from files.models import Audio
from office.models import AudioFileText
from main.models import Prompt

logger = logging.getLogger(__name__)

# پرامپت پیش‌فرض بر اساس نوع فایل
DEFAULT_TYPE_PROMPTS = {
    "S": "این متن را به یک صورت جلسه رسمی با ساختار منظم شامل خلاصه، حاضرین و مصوبات تبدیل کن.",
    "L": "این متن را به قالب درس آموخته شامل مسئله، اقدام اصلاحی و نتیجه تبدیل کن.",
}


def get_prompt_text_for_audio(audio_instance):
    """دریافت پرامپت مناسب بر اساس نوع فایل یا زیرمجموعه"""
    prompt = None

    try:
        prompt = Prompt.objects.filter(type=audio_instance.subset, is_active=True).first()
        if not prompt:
            prompt = Prompt.objects.filter(
                type__title__iexact=audio_instance.get_file_type_display(),
                is_active=True,
            ).first()
    except Exception as e:
        logger.warning(f"⚠️ خطا در دریافت پرامپت: {e}")

    if prompt and prompt.content:
        return prompt.content

    if audio_instance and audio_instance.file_type in DEFAULT_TYPE_PROMPTS:
        return DEFAULT_TYPE_PROMPTS[audio_instance.file_type]

    return "این متن رو به یک صورت جلسه رسمی تبدیل کن"


def build_hf_payload(prompt_text, content_file, audio_instance=None):
    """ساخت payload استاندارد برای Hugging Face Chat Completions."""

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


@shared_task(bind=True)
def transcribe_audio(self, audio_path, audio_id=None, language='fa'):
    """
    تبدیل فایل صوتی به متن و ذخیره در دیتابیس
    """
    try:
        # بررسی وجود فایل صوتی
        if not os.path.exists(audio_path):
            print(f"❌ فایل صوتی یافت نشد: {audio_path}")
            if audio_id:
                update_audio_status(audio_id, 'R')  # رد شده
            return {"error": "فایل صوتی یافت نشد"}

        # دریافت نمونه Audio از دیتابیس
        audio_instance = None
        if audio_id:
            try:
                audio_instance = Audio.objects.get(id=audio_id)
                # تغییر وضعیت به "در حال پردازش هوشمند"
                audio_instance.status = 'Pr'
                audio_instance.save()
                print(f"✅ وضعیت فایل صوتی {audio_id} به 'در حال پردازش هوشمند' تغییر یافت")
            except Audio.DoesNotExist:
                print(f"❌ فایل صوتی با ID {audio_id} یافت نشد")
                return {"error": "فایل صوتی در دیتابیس یافت نشد"}

        # گزارش پیشرفت: شروع بارگذاری مدل (10%)
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'بارگذاری مدل Whisper...'})
        
        # بارگذاری مدل Whisper
        print("🔄 در حال بارگذاری مدل Whisper...")
        model = whisper.load_model("base", device="cpu")
        print("✅ مدل Whisper بارگذاری شد")

        # گزارش پیشرفت: شروع پردازش (30%)
        self.update_state(state='PROGRESS', meta={'progress': 30, 'status': 'شروع پردازش هوشمند فایل صوتی...'})

        # تبدیل صوت به متن
        print(f"🔄 در حال پردازش هوشمند فایل صوتی: {audio_path}")
        result = model.transcribe(audio_path, verbose=True, language=language)
        print("✅ تبدیل صوت به متن تکمیل شد")

        # گزارش پیشرفت: تکمیل پردازش (70%)
        self.update_state(state='PROGRESS', meta={'progress': 70, 'status': 'پردازش هوشمند فایل صوتی تکمیل شد، در حال ذخیره...'})

        # استخراج متن کامل
        full_text = result.get("text", "").strip()
        
        if not full_text:
            print("❌ متن استخراج شده خالی است")
            if audio_instance:
                update_audio_status(audio_instance.id, 'R')
            return {"error": "متن استخراج شده خالی است"}

        # ذخیره در جدول AudioFileText
        if audio_instance:
            try:
                # حذف رکورد قبلی اگر وجود دارد
                AudioFileText.objects.filter(file=audio_instance).delete()
                
                # ایجاد رکورد جدید
                audio_text = AudioFileText.objects.create(
                    file=audio_instance,
                    content_processed=full_text,
                    custom_content=""  # خالی برای ویرایش بعدی
                )
                print(f"✅ متن در دیتابیس ذخیره شد (ID: {audio_text.id})")
                
                # گزارش پیشرفت: ذخیره در دیتابیس (90%)
                self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'ذخیره در دیتابیس تکمیل شد...'})
                
                # فقط بعد از ذخیره موفق در AudioFileText، وضعیت را به "تایید شده" تغییر می‌دهیم
                audio_instance.status = 'A'
                audio_instance.save()
                print(f"✅ وضعیت فایل {audio_id} به 'تایید شده' تغییر یافت")
                
            except Exception as e:
                print(f"❌ خطا در ذخیره دیتابیس: {str(e)}")
                if audio_instance:
                    update_audio_status(audio_instance.id, 'R')
                return {"error": f"خطا در ذخیره دیتابیس: {str(e)}"}

        # ذخیره فایل‌های خروجی (اختیاری)
        try:
            output_dir = os.path.join(settings.MEDIA_ROOT, "transcriptions")
            os.makedirs(output_dir, exist_ok=True)
            
            # ذخیره JSON
            json_path = os.path.join(output_dir, f"audio_{audio_id or 'unknown'}.json")
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            # ذخیره SRT
            srt_path = os.path.join(output_dir, f"audio_{audio_id or 'unknown'}.srt")
            write_srt(result["segments"], srt_path)
            
            print(f"✅ فایل‌های خروجی ذخیره شدند: {json_path}, {srt_path}")
            
        except Exception as e:
            print(f"⚠️ خطا در ذخیره فایل‌های خروجی: {str(e)}")

        # گزارش پیشرفت: تکمیل (100%)
        self.update_state(state='SUCCESS', meta={'progress': 100, 'status': 'پردازش هوشمند تکمیل شد!'})

        return {
            "success": True,
            "text": full_text,
            "audio_id": audio_id,
            "segments_count": len(result.get("segments", [])),
            "progress": 100
        }

    except Exception as e:
        error_msg = f"خطا در پردازش هوشمند فایل صوتی: {str(e)}"
        print(f"❌ {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        
        # تغییر وضعیت به "رد شده" در صورت خطا
        if audio_id:
            update_audio_status(audio_id, 'R')
        
        return {"error": error_msg}

def update_audio_status(audio_id, status):
    """تغییر وضعیت فایل صوتی"""
    try:
        audio = Audio.objects.get(id=audio_id)
        audio.status = status
        audio.save()
        print(f"✅ وضعیت فایل {audio_id} به '{status}' تغییر یافت")
    except Audio.DoesNotExist:
        print(f"❌ فایل با ID {audio_id} یافت نشد")
    except Exception as e:
        print(f"❌ خطا در تغییر وضعیت فایل {audio_id}: {str(e)}")


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
            # اگر رکورد وجود ندارد، وضعیت باید "در حال پردازش هوشمند" باشد
            if audio.status != 'Pr':
                audio.status = 'Pr'
                audio.save()
                print(f"✅ وضعیت فایل صوتی {audio_id} به 'در حال پردازش هوشمند' تغییر یافت")
            return 'Pr'  # در حال پردازش هوشمند
            
    except Audio.DoesNotExist:
        print(f"❌ فایل با ID {audio_id} یافت نشد")
        return None
    except Exception as e:
        print(f"❌ خطا در بررسی وضعیت فایل {audio_id}: {str(e)}")
        return None


def write_srt(segments, filename="output.srt"):
    """ساخت فایل SRT"""
    with open(filename, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):
            start = seg["start"]
            end = seg["end"]
            text = seg["text"].strip()
            f.write(f"{i}\n")
            f.write(f"{format_timestamp(start)} --> {format_timestamp(end)}\n")
            f.write(f"{text}\n\n")


def format_timestamp(seconds: float) -> str:
    """فرمت کردن تایم‌استمپ برای SRT"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

########################################################################################
# todo: online
########################online################################



@shared_task(bind=True)
def transcribe_online(self, audio_name, audio_path, audio_id=None, language='fa'):
    """
    تبدیل فایل صوتی به متن و ذخیره در دیتابیس
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"شروع پردازش هوشمند فایل صوتی: {audio_name}")
    try:
        logger.info(f"مسیر فایل: {audio_path}")
        
        # بررسی وجود فایل صوتی
        if not os.path.exists(audio_path):
            error_msg = f"فایل یافت نشد: {audio_path}"
            logger.error(error_msg)
            if audio_id:
                update_audio_status(audio_id, 'R')
            return {"error": error_msg}

        # دریافت نمونه Audio از دیتابیس
        audio_instance = None
        if audio_id:
            try:
                audio_instance = Audio.objects.get(id=audio_id)
                # تغییر وضعیت به "در حال پردازش هوشمند"
                audio_instance.status = 'Pr'
                audio_instance.save()
                logger.info(f"وضعیت فایل {audio_id} به 'در حال پردازش' تغییر یافت")
            except Audio.DoesNotExist:
                error_msg = f"فایل با ID {audio_id} یافت نشد"
                logger.error(error_msg)
                return {"error": error_msg}

        # بررسی وجود audio_instance
        if not audio_instance:
            error_msg = "Audio instance یافت نشد"
            logger.error(error_msg)
            return {"error": error_msg}

        # گزارش پیشرفت: شروع بارگذاری مدل (10%)
        self.update_state(state='PROGRESS', meta={'progress': 10, 'status': 'شروع پردازش هوشمند فایل صوتی...'})

        # گزارش پیشرفت: شروع پردازش (30%)
        self.update_state(state='PROGRESS', meta={'progress': 30, 'status': 'ارسال فایل به سرویس تبدیل گفتار...'})

        # --- تبدیل صوت به متن ---
        try:
            content_file = transcribe_file(audio_name, audio_path, retries=3, wait=5)
            logger.info("تبدیل گفتار به متن تکمیل شد")
        except Exception as e:
            error_msg = f"خطا در تبدیل گفتار به متن: {str(e)}"
            logger.error(error_msg)
            if audio_id:
                update_audio_status(audio_id, 'R')
            return {"error": error_msg}

        # دریافت prompt
        try:
            prompt_text = get_prompt_text_for_audio(audio_instance)
            logger.info(f"پرامپت استفاده شده: {prompt_text[:50]}...")
        except Exception as e:
            logger.warning(f"خطا در دریافت پرامپت: {str(e)}")
            prompt_text = "این متن رو به یک صورت جلسه رسمی تبدیل کن"

        # گزارش پیشرفت: تکمیل پردازش (70%)
        self.update_state(state='PROGRESS', meta={'progress': 70, 'status': 'پردازش متن با هوش مصنوعی...'})

        # --- پردازش هوشمند متن با Hugging Face (اختیاری) ---
        full_text = content_file  # استفاده از متن خام به عنوان fallback
        try:
            processed_text = process_with_huggingface(prompt_text, content_file, audio_instance)
            if processed_text and processed_text.strip():
                full_text = processed_text.strip()
                logger.info("پردازش هوشمند متن با Hugging Face تکمیل شد و جایگزین متن خام شد")
            else:
                logger.warning("متن پردازش شده توسط Hugging Face خالی بود، از متن اصلی استفاده می‌شود")
        except Exception as e:
            logger.warning(f"خطا در پردازش هوشمند متن با Hugging Face، از متن اصلی استفاده می‌شود: {str(e)}")

        if not full_text or not full_text.strip():
            error_msg = "متن استخراج شده خالی است"
            logger.error(error_msg)
            if audio_instance:
                update_audio_status(audio_instance.id, 'R')
            return {"error": error_msg}

        # ذخیره در جدول AudioFileText
        try:
            # حذف رکورد قبلی اگر وجود دارد
            AudioFileText.objects.filter(file=audio_instance).delete()

            # ایجاد رکورد جدید
            audio_text = AudioFileText.objects.create(
                file=audio_instance,
                content_file=content_file,
                content_processed=full_text,
                custom_content=""  # خالی برای ویرایش بعدی
            )
            logger.info(f"متن در دیتابیس ذخیره شد (ID: {audio_text.id})")

            # گزارش پیشرفت: ذخیره در دیتابیس (90%)
            self.update_state(state='PROGRESS', meta={'progress': 90, 'status': 'ذخیره در دیتابیس تکمیل شد...'})

            # تغییر وضعیت فایل به محتوای تولید شده
            audio_instance.status = 'Pd'
            audio_instance.save()
            logger.info(f"وضعیت فایل {audio_id} به 'محتوای تولید شده' تغییر یافت")

        except Exception as e:
            error_msg = f"خطا در ذخیره دیتابیس: {str(e)}"
            logger.error(error_msg)
            if audio_instance:
                update_audio_status(audio_instance.id, 'R')
            return {"error": error_msg}

        # گزارش پیشرفت: تکمیل (100%)
        self.update_state(state='SUCCESS', meta={'progress': 100, 'status': 'پردازش هوشمند تکمیل شد!'})

        logger.info(f"پردازش هوشمند فایل صوتی {audio_name} با موفقیت تکمیل شد")
        return {
            "success": True,
            "text": full_text,
            "audio_id": audio_id,
            "segments_count": 0,
            "progress": 100
        }

    except Exception as e:
        error_msg = f"خطا در پردازش هوشمند فایل صوتی: {str(e)}"
        logger.error(error_msg)
        logger.error(f"Traceback: {traceback.format_exc()}")

        if audio_id:
            update_audio_status(audio_id, 'R')

        return {"error": error_msg}


# --- توابع کمکی برای APIها ---

def transcribe_file(audio_name, audio_path, retries=3, wait=5):
    """ارسال فایل به سرویس iotype و دریافت متن"""
    import logging
    logger = logging.getLogger(__name__)
    
    url = settings.IO_TRANSCRIBE_URL
    payload = {'type': 'file'}
    headers = {
        'Authorization': settings.IO_TRANSCRIBE_TOKEN
    }
    
    if not settings.IO_TRANSCRIBE_TOKEN:
        raise RuntimeError("❌ IO_TRANSCRIBE_TOKEN تنظیم نشده است")

    for attempt in range(retries):
        try:
            logger.info(f"تلاش {attempt + 1}/{retries} برای ارسال فایل به iotype")
            
            # استفاده از context manager برای مدیریت فایل
            with open(audio_path, 'rb') as audio_file:
                files = [
                    ('file', (audio_name, audio_file, 'audio/mpeg'))
                ]
                
                resp = requests.post(
                    url, 
                    headers=headers, 
                    data=payload, 
                    files=files, 
                    timeout=120  # افزایش timeout به 2 دقیقه
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    result = data.get("result")
                    if result:
                        logger.info("تبدیل گفتار به متن با موفقیت انجام شد")
                        return result
                    else:
                        logger.warning("سرویس iotype پاسخ خالی برگرداند")
                else:
                    logger.error(f"خطا از سرویس iotype (کد {resp.status_code}): {resp.text}")
                    
        except requests.exceptions.Timeout:
            logger.warning(f"تایم‌اوت در ارتباط با سرویس iotype (تلاش {attempt + 1})")
        except requests.exceptions.ConnectionError:
            logger.warning(f"خطا در اتصال به سرویس iotype (تلاش {attempt + 1})")
        except Exception as e:
            logger.error(f"خطا در ارسال فایل به iotype (تلاش {attempt + 1}): {str(e)}")

        if attempt < retries - 1:
            logger.info(f"تلاش مجدد در {wait} ثانیه...")
            time.sleep(wait)

    raise RuntimeError("❌ سرویس iotype پس از چندین تلاش پاسخگو نیست یا متن برنگشت.")


def process_with_huggingface(prompt_text, content_file, audio_instance=None):
    """پردازش هوشمند متن خام با Hugging Face"""
    import logging

    logger = logging.getLogger(__name__)
    if not getattr(settings, 'HF_API_TOKEN', ''):
        raise RuntimeError("❌ HF_API_TOKEN تنظیم نشده است")

    url = getattr(settings, 'HF_API_URL', '').strip()
    if not url:
        raise RuntimeError("❌ HF_API_URL تنظیم نشده است")

    payload = build_hf_payload(prompt_text, content_file, audio_instance)
    headers = {
        'Authorization': f"Bearer {settings.HF_API_TOKEN}",
        'Content-Type': 'application/json',
    }

    try:
        logger.info(f"ارسال درخواست به Hugging Face API - URL: {url}")
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

        logger.info("پردازش هوشمند متن با Hugging Face با موفقیت انجام شد")
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
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        audio = Audio.objects.get(id=audio_id)

        has_text_record = AudioFileText.objects.filter(file=audio).exists()

        if has_text_record:
            if audio.status != 'A':
                audio.status = 'A'
                audio.save()
                logger.info(f"وضعیت فایل {audio_id} به 'تایید شده' تغییر یافت")
            return 'A'
        else:
            if audio.status != 'Pr':
                audio.status = 'Pr'
                audio.save()
                logger.info(f"وضعیت فایل {audio_id} به 'در حال پردازش' تغییر یافت")
            return 'Pr'

    except Audio.DoesNotExist:
        logger.error(f"فایل با ID {audio_id} یافت نشد")
        return None
    except Exception as e:
        logger.error(f"خطا در بررسی وضعیت فایل {audio_id}: {str(e)}")
        return None


def write_srt(segments, filename="output.srt"):
    """ساخت فایل SRT"""
    with open(filename, "w", encoding="utf-8") as f:
        for i, seg in enumerate(segments, start=1):
            start = seg["start"]
            end = seg["end"]
            text = seg["text"].strip()
            f.write(f"{i}\n")
            f.write(f"{format_timestamp(start)} --> {format_timestamp(end)}\n")
            f.write(f"{text}\n\n")


def format_timestamp(seconds: float) -> str:
    """فرمت کردن تایم‌استمپ برای SRT"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds % 1) * 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
