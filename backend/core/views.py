# backend/core/views.py

from rest_framework import viewsets
from .models import Folder, Video
from .serializers import FolderSerializer, VideoSerializer

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer

class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer