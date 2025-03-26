# backend/core/views.py

from rest_framework import viewsets, generics, status
from .models import Folder, Video
from .serializers import FolderSerializer, VideoSerializer, RegisterSerializer, LoginSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from .permissions import IsAdminUser
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]  # Public access for GET requests
        return [IsAuthenticatedOrReadOnly()]  # Auth required for others


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticatedOrReadOnly()]



class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})