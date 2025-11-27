from django.urls import path, include
from . import views

app_name = 'accounts'

urlpatterns = [
    path('api/v1/accounts/', include('accounts.api.v1.urls', namespace='accounts')),
    # path('accounts/login/', views.login_view, name='login'),
    # path('accounts/logout/', views.logout_view, name='logout'),
    # path('accounts/change-password/', views.change_password, name='change_password'),
]