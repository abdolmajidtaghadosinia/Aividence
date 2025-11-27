from django.urls import path, include
from . import views

app_name = 'office'

urlpatterns = [
    path('api/v1/office/', include('office.api.v1.urls', namespace='office')),

]