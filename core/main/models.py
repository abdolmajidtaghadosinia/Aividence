from django.db import models
from accounts.models import BaseModel, User
from files.models import Subset
# Create your models here.

class Prompt(BaseModel):
    title = models.CharField(max_length=255, verbose_name='عنوان', help_text='عنوان پرامپت')
    content = models.TextField(verbose_name='محتوا', help_text='محتوای پرامپت')
    type = models.ForeignKey(Subset, on_delete=models.CASCADE, verbose_name='نوع', help_text='نوع پرامپت', related_name='prompts')
    is_active = models.BooleanField(default=True, verbose_name='فعال', help_text='فعال یا غیرفعال')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='کاربر')

    class Meta:
        verbose_name = 'پرامپت'
        verbose_name_plural = 'پرامپت‌ها'