import os
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.files.storage import default_storage
from django.conf import settings
from files.models import Audio, Subset
from .serializers import AudioSerializer
from files.tasks import check_processing_status, transcribe_online
from celery.result import AsyncResult
from django.shortcuts import get_object_or_404
from office.models import AudioFileText



class AudioUploadView(generics.CreateAPIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    queryset = Audio.objects.all()
    serializer_class = AudioSerializer

    def get(self, request, *args, **kwargs):
        # ارسال داده‌های فرم (برای frontend)
        file_type_choices = dict(Audio.FILE_TYPE_CHOICES)
        subsets = Subset.objects.values('id', 'title')
        return Response({
            'file_type_choices': file_type_choices,
            'subsets': list(subsets)
        })

    def perform_create(self, serializer):
        # ذخیره مدل با user uploader
        audio_instance = serializer.save(
            user_uplouder=self.request.user.profile
        )

        # اجرای تسک تبدیل گفتار به متن فقط از طریق Celery
        if audio_instance.file:
            abs_path = os.path.join(settings.MEDIA_ROOT, audio_instance.file.name)
            # ارسال تسک با ID فایل برای ذخیره در دیتابیس
            # task = transcribe_audio.delay(abs_path, audio_instance.id)
            task = transcribe_online.delay(audio_instance.file.name, abs_path, audio_instance.id)
            print(f"✅ تسک Celery ارسال شد برای فایل ID: {audio_instance.id}, Task ID: {task.id}")
            # ذخیره task_id در instance برای استفاده بعدی
            audio_instance.task_id = task.id
            audio_instance.save()

        return audio_instance

    def create(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({"error": "فایل آپلود نشده است"}, status=status.HTTP_400_BAD_REQUEST)

        # بررسی حجم فایل (حداکثر ۱۰ مگابایت)
        uploaded_file = request.FILES['file']
        max_size = 10 * 1024 * 1024  # 10MB
        if uploaded_file.size > max_size:
            file_size_mb = uploaded_file.size / (1024 * 1024)
            return Response({
                "error": f"حجم فایل باید کمتر از ۱۰ مگابایت باشد. حجم فایل ارسالی: {file_size_mb:.1f} مگابایت"
            }, status=status.HTTP_400_BAD_REQUEST)

        # استخراج فیلدهای مورد نیاز و تبدیل نام‌ها
        file_type = request.data.get('fileType', '')
        sub_collection_title = request.data.get('subCollection', '')
        
        # پیدا کردن subset بر اساس title (اولین مورد در صورت تکرار عنوان)
        subset = Subset.objects.filter(title=sub_collection_title).order_by('id').first()
        if subset is None:
            return Response({"error": "زیرمجموعه انتخاب شده معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST)

        data = {
            'name': request.data.get('fileName', ''),
            'subject': request.data.get('subject', ''),
            'file_type': file_type,
            'subset': subset.id,
            'status': 'AP',
        }

        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)

        return Response({"message": "Audio uploaded successfully"}, status=status.HTTP_201_CREATED, headers=headers)

    

class AudioDetailView(generics.RetrieveUpdateDestroyAPIView):
    # authentication_classes = [JWTAuthentication]
    # permission_classes = [IsAuthenticated]

    queryset = Audio.objects.all()
    serializer_class = AudioSerializer

    
    def get_object(self):
        obj = get_object_or_404(Audio, upload_uuid=self.kwargs['uuid'])
        # You might want to add additional permission checks here
        return obj
    
    def perform_update(self, serializer):
        instance = self.get_object()
        # Prevent updating certain fields
        if 'user_uplouder' in serializer.validated_data:
            del serializer.validated_data['user_uplouder']
        if 'upload_uuid' in serializer.validated_data:
            del serializer.validated_data['upload_uuid']
        serializer.save()


class AudioTextView(generics.RetrieveAPIView):
    """
    دریافت متن استخراج شده از فایل صوتی
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid, *args, **kwargs):
        try:
            # دریافت فایل صوتی
            audio = get_object_or_404(Audio, upload_uuid=uuid)
            
            # دریافت متن استخراج شده
            try:
                audio_text = AudioFileText.objects.get(file=audio)
                return Response({
                    'success': True,
                    'audio_id': audio.id,
                    'file_name': audio.name,
                    'status': audio.get_status_display(),
                    'original_text': audio_text.content_file,
                    'processed_text': audio_text.content_processed,
                    'custom_text': audio_text.custom_content,
                    'has_custom_text': bool(audio_text.custom_content),
                    'created_at': audio_text.created_at,
                    'updated_at': audio_text.updated_at,
                })
            except AudioFileText.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'متن استخراج شده یافت نشد',
                    'status': audio.get_status_display(),
                    'audio_id': audio.id,
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت متن: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AudioTextUpdateView(generics.UpdateAPIView):
    """
    ویرایش متن استخراج شده
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, uuid, *args, **kwargs):
        try:
            # دریافت فایل صوتی
            audio = get_object_or_404(Audio, upload_uuid=uuid)
            
            # دریافت متن استخراج شده
            try:
                audio_text = AudioFileText.objects.get(file=audio)
                
                # دریافت متن ویرایش شده از درخواست
                custom_text = request.data.get('custom_text', '')
                if not custom_text:
                    return Response({
                        'success': False,
                        'message': 'متن ویرایش شده الزامی است'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # ذخیره متن ویرایش شده
                audio_text.custom_content = custom_text
                audio_text.save()
                
                return Response({
                    'success': True,
                    'message': 'متن با موفقیت ویرایش شد',
                    'custom_text': audio_text.custom_content,
                    'updated_at': audio_text.updated_at,
                })
                
            except AudioFileText.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'متن استخراج شده یافت نشد'
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در ویرایش متن: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AudioStatusCheckView(generics.RetrieveAPIView):
    """
    بررسی وضعیت پردازش فایل صوتی
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, audio_id, *args, **kwargs):
        try:
            # دریافت فایل صوتی
            audio = get_object_or_404(Audio, id=audio_id)
            
            # بررسی وضعیت پردازش
            current_status = check_processing_status(audio_id)
            
            # بررسی وجود رکورد در AudioFileText
            has_text_record = AudioFileText.objects.filter(file=audio).exists()
            
            return Response({
                'success': True,
                'audio_id': audio.id,
                'file_name': audio.name,
                'current_status': current_status,
                'status_display': audio.get_status_display(),
                'has_text_record': has_text_record,
                'is_processing': current_status == 'P',
                'is_processed': current_status == 'PD',
                'is_approved': current_status == 'A',
                'is_failed': current_status == 'E',
                'is_rejected': current_status == 'R',
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در بررسی وضعیت: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, audio_id, *args, **kwargs):
        """
        به‌روزرسانی وضعیت فایل صوتی.
        بدنه درخواست باید شامل فیلد "status" با یکی از گزینه‌های مجاز باشد.
        """
        try:
            audio = get_object_or_404(Audio, id=audio_id)
            new_status = request.data.get('status')
            if not new_status:
                return Response({'success': False, 'message': 'فیلد status الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

            valid_statuses = {choice[0] for choice in Audio.STATUS_CHOICES}
            if new_status not in valid_statuses:
                return Response({'success': False, 'message': f'وضعیت نامعتبر. مقادیر مجاز: {sorted(list(valid_statuses))}'}, status=status.HTTP_400_BAD_REQUEST)

            audio.status = new_status
            audio.save(update_fields=['status'])

            return Response({
                'success': True,
                'audio_id': audio.id,
                'new_status': audio.status,
                'status_display': audio.get_status_display(),
            })
        except Exception as e:
            return Response({'success': False, 'message': f'خطا در به0روزرسانی وضعیت: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AudioTaskProgressView(generics.RetrieveAPIView):
    """
    دریافت درصد پیشرفت task پردازش فایل صوتی
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id, *args, **kwargs):
        try:
            # دریافت نتیجه task از Celery
            task_result = AsyncResult(task_id)
            
            if task_result.state == 'PENDING':
                response = {
                    'success': True,
                    'task_id': task_id,
                    'state': 'PENDING',
                    'progress': 0,
                    'status': 'در انتظار شروع...',
                    'is_completed': False,
                    'is_failed': False
                }
            elif task_result.state == 'PROGRESS':
                response = {
                    'success': True,
                    'task_id': task_id,
                    'state': 'PROGRESS',
                    'progress': task_result.info.get('progress', 0),
                    'status': task_result.info.get('status', 'در حال پردازش...'),
                    'is_completed': False,
                    'is_failed': False
                }
            elif task_result.state == 'SUCCESS':
                response = {
                    'success': True,
                    'task_id': task_id,
                    'state': 'SUCCESS',
                    'progress': 100,
                    'status': 'پردازش تکمیل شد!',
                    'is_completed': True,
                    'is_failed': False,
                    'result': task_result.result
                }
            elif task_result.state == 'FAILURE':
                response = {
                    'success': False,
                    'task_id': task_id,
                    'state': 'FAILURE',
                    'progress': 0,
                    'status': 'خطا در پردازش',
                    'is_completed': False,
                    'is_failed': True,
                    'error': str(task_result.info)
                }
            else:
                response = {
                    'success': True,
                    'task_id': task_id,
                    'state': task_result.state,
                    'progress': 0,
                    'status': 'وضعیت نامشخص',
                    'is_completed': False,
                    'is_failed': False
                }
            
            return Response(response)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در دریافت وضعیت task: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class AudioReprocessView(generics.CreateAPIView):
    """
    پردازش مجدد فایل صوتی: پاک کردن متن قبلی، تغییر وضعیت و ارسال مجدد تسک
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, uuid, *args, **kwargs):
        try:
            # پیدا کردن فایل با uuid
            audio = get_object_or_404(Audio, upload_uuid=uuid)

            # اگر فایل فیزیکی وجود نداشته باشد
            if not audio.file:
                return Response({'success': False, 'message': 'فایل برای پردازش موجود نیست'}, status=status.HTTP_400_BAD_REQUEST)

            # حذف رکوردهای قبلی متن
            AudioFileText.objects.filter(file=audio).delete()

            # تغییر وضعیت به در حال پردازش
            audio.status = 'P'
            audio.save()

            # مسیر مطلق فایل
            abs_path = os.path.join(settings.MEDIA_ROOT, audio.file.name)

            # ارسال مجدد تسک (آنلاین)
            task = transcribe_online.delay(audio.file.name, abs_path, audio.id)

            # ذخیره task_id
            audio.task_id = task.id
            audio.save()

            return Response({
                'success': True,
                'message': 'پردازش مجدد آغاز شد',
                'task_id': task.id,
                'audio_id': audio.id
            }, status=status.HTTP_202_ACCEPTED)

        except Exception as e:
            return Response({
                'success': False,
                'message': f'خطا در پردازش مجدد: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

