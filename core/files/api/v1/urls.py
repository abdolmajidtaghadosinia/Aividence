# urls.py
from django.urls import path
from .views import AudioUploadView, AudioDetailView, AudioTextView, AudioTextUpdateView, AudioStatusCheckView, AudioTaskProgressView, AudioReprocessView

urlpatterns = [
    path('audio/upload/', AudioUploadView.as_view(), name='audio-upload'),
    path('audio/<uuid:uuid>/', AudioDetailView.as_view(), name='audio-detail'),
    path('audio/<uuid:uuid>/text/', AudioTextView.as_view(), name='audio-text'),
    path('audio/<uuid:uuid>/text/update/', AudioTextUpdateView.as_view(), name='audio-text-update'),
    path('audio/<uuid:uuid>/reprocess/', AudioReprocessView.as_view(), name='audio-reprocess'),
    path('audio/<int:audio_id>/status/', AudioStatusCheckView.as_view(), name='audio-status-check'),
    path('task/<str:task_id>/progress/', AudioTaskProgressView.as_view(), name='audio-task-progress'),
]