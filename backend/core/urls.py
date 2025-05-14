# backend/config/urls.py

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import FolderViewSet, VideoViewSet

router = DefaultRouter()
router.register(r'folders', FolderViewSet)
router.register(r'videos', VideoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]