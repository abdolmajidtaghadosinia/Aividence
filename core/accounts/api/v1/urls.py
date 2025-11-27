from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path
from .views import UserInfo

app_name = 'accounts'


urlpatterns = [
                path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
                path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),    
                path('user-info/', UserInfo.as_view(),name='user_info'),
              ] 