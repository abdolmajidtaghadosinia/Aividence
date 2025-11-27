from django.urls import path
from rest_framework import routers
from .views import *

app_name = 'office'

router = routers.DefaultRouter()
router.register('keyword', KeywordModelViewSet)
# router.register('customer_type', CustomerTypeModelViewSet)
# router.register('UserHistory', UserHistoryModelViewSet)

urlpatterns = [
    path('export-custom-zip/', ExportCustomContentZipView.as_view(), name='export_custom_zip'),
] + router.urls 

 