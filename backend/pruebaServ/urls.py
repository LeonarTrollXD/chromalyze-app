"""
URL configuration for pruebaServ project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
"""
URL configuration for pruebaServ project.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

# Importaciones de Swagger
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Importamos tus ViewSets
from miApp.views.colorView import ColorViewSet
from miApp.views.rolView import RolViewSet
from miApp.views.userView import UsuarioViewSet
from miApp.views.capturaView import CapturaViewSet
from miApp.views.paletaView import PaletaViewSet

# 1. Configuración del Router
# El router detectará automáticamente el método 'analizar_rapido' 
# y creará la ruta /api/capturas/analizar-rapido/
router = DefaultRouter()
router.register(r'color', ColorViewSet, basename='color')
router.register(r'roles', RolViewSet, basename='roles')
router.register(r'usuarios', UsuarioViewSet, basename='usuarios')
router.register(r'capturas', CapturaViewSet, basename='capturas')
router.register(r'paletas', PaletaViewSet, basename='paletas')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # DOCUMENTACIÓN SWAGGER
    # Al entrar aquí, verás el nuevo botón POST /api/capturas/analizar-rapido/
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

# Configuración para servir archivos MEDIA (imágenes) en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)