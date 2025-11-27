# urls.py
from django.urls import path
from .views import AudioListView

urlpatterns = [
    path('dashboard/', AudioListView.as_view(), name='dashboard'),
    ]