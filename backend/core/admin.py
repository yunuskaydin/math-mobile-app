# backend/core/admin.py

from django.contrib import admin
from .models import Folder, Video

admin.site.register(Folder)
admin.site.register(Video)