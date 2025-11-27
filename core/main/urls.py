from django.urls import path, include

app_name = 'main'

urlpatterns = [
    path('api/v1/main/', include('main.api.v1.urls')),
]