from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.models import User, Profile, Department, Role


class UserInfo(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # تلاش برای دریافت پروفایل کاربر
        try:
            profile = Profile.objects.get(user=user)
            user_data = {
                'id': user.id,
                'email': user.email,
                'name': profile.name,
                'full_name': f"{profile.name} {profile.family}",
                'role': profile.role.name if profile.role else 'ناظر',
                'user_type': profile.role.name if profile.role else 'ناظر',
                'employee_id': profile.employee_id,
                'department': profile.department.name if profile.department else 'فناوری اطلاعات',
            }
        except Profile.DoesNotExist:
            # اگر پروفایل وجود نداشت، اطلاعات پیش‌فرض برگردان
            user_data = {
                'id': user.id,
                'email': user.email,
                'name': user.email.split('@')[0],
                'full_name': user.email.split('@')[0],
                'role': 'ناظر',
                'user_type': 'ناظر',
                'employee_id': str(user.id),
                'department': 'فناوری اطلاعات',
            }
        
        return Response(user_data)