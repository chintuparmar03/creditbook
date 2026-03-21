from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.http import JsonResponse

urlpatterns = [
    path('', lambda r: JsonResponse({'status': 'ok', 'app': 'CreditBook Pro API'})),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
