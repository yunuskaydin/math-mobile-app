# backend/core/serializers.py

from rest_framework import serializers
from .models import Folder, Video

class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = '__all__'

class FolderSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(many=True, read_only=True)
    subfolders = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = '__all__'

    def get_subfolders(self, obj):
        subfolders = obj.subfolders.all()
        return FolderSerializer(subfolders, many=True).data