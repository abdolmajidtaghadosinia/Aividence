from django.contrib import admin
from .models import Profile, Department, Role, User, Permission, RolePermission

# Register your models here.

admin.site.register(User)
admin.site.register(Department)
admin.site.register(Role)
# admin.site.register(Permission)
# admin.site.register(RolePermission)
admin.site.register(Profile)