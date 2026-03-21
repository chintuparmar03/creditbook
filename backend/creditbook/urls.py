from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

urlpatterns = [
    path('', lambda r: JsonResponse({'status': 'ok', 'app': 'CreditBook Pro API'})),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Serve media files (uploaded transaction images) in all environments.
# For high-traffic production, consider using S3/Cloudinary instead.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

