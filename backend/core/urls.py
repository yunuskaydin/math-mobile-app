# backend/config/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.views import FolderViewSet, VideoViewSet

router = DefaultRouter()
router.register(r'folders', FolderViewSet)
router.register(r'videos', VideoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]