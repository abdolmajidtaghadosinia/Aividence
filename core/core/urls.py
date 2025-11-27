from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib import admin
from django.urls import path, include


from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.views.static import serve
from rest_framework.authentication import SessionAuthentication, BasicAuthentication


# schema_view = get_schema_view(
#     openapi.Info(
#         title="redwebplus",
#         default_version='v1',
#         description="redwebplus",
#         terms_of_service="https://www.redwebplus.com/policies/terms/",
#         contact=openapi.Contact(email="contact@snippets.local"),
#         license=openapi.License(name="BSD License"),
#     ),
#     public=False,
#     authentication_classes=[SessionAuthentication],
#     # permission_classes=[IsSuperuser],

# )

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', include('accounts.urls')),
    path('', include('files.urls')),
    path('', include('office.urls')),
    path('', include('main.urls')),

#     path('swagger/t.json/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
#     path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
#     path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]