from django.db import models
from accounts.models import BaseModel, Profile
import uuid
# Create your models here.


class Subset(BaseModel):
    title = models.CharField(max_length=50,blank=False,null=False)

    class Meta:
        verbose_name = 'زیرمجموعه'
        verbose_name_plural = 'زیرمجموعه‌ها'
        
    def __str__(self) -> str:
        return self.title




class Audio(BaseModel):
    STATUS_CHOICES = (
        ("AP","در انتظار پردازش هوشمند"),
        ("P","در حال پردازش هوشمند"),
        ("PD","محتوای تولید شده"),
        ("E","خطا در پردازش هوشمند"),
        ("A","تایید شده"),
        ("R","رد شده")
    )
    
    FILE_TYPE_CHOICES =(
        ("S","صورت جلسه"),
        ("L","درس آموخته"),
    )

    file = models.FileField(upload_to='audio/', blank=True)
    file_type = models.CharField(max_length=2, choices=FILE_TYPE_CHOICES) 
    subset = models.ForeignKey(Subset, on_delete=models.DO_NOTHING)
    name = models.CharField(max_length=250, blank=False)
    subject = models.CharField(max_length=250, blank=False)
    status = models.CharField(max_length=2, choices=STATUS_CHOICES, default='P')
    user_uplouder = models.ForeignKey(Profile, on_delete=models.CASCADE)
    upload_uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    task_id = models.CharField(max_length=255, blank=True, null=True, help_text='Celery task ID')
    file_duration = models.FloatField(blank=True, null=True)
    file_token = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = 'فایل صوتی'
        verbose_name_plural = 'فایل‌های صوتی'

    def __str__(self):
        return f"{self.name} - {self.subset.title}"



