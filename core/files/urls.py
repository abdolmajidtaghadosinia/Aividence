from django.urls import path, include
from . import views

app_name = 'files'

urlpatterns = [
    path('api/v1/files/', include('files.api.v1.urls')),
]