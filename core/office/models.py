from django.db import models
from accounts.models import BaseModel, Profile
from files.models import Audio, Subset
# Create your models here.



class KeywordList(BaseModel):
    Keyword = models.CharField(max_length=50,blank=False,null=False)
    subset=models.ForeignKey(Subset,on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    user_creator = models.ForeignKey(Profile, on_delete=models.CASCADE)


class AudioFileText(BaseModel):
    file =models.ForeignKey(Audio, on_delete=models.DO_NOTHING)
    content_file =models.TextField(blank=True,null=True)
    content_processed =models.TextField(blank=True,null=True)
    custom_content=models.TextField(blank=True,null=True)


