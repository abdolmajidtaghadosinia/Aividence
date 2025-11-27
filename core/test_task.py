#!/usr/bin/env python
import os
import sys
import django

# Add the current directory to Python path
sys.path.append('.')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from files.models import Audio
from office.models import AudioFileText
from files.tasks import transcribe_audio

print("=== Audio Files ===")
for audio in Audio.objects.all():
    print(f"ID: {audio.id}, Name: {audio.name}, Status: {audio.status}")

print("\n=== AudioFileText Records ===")
for text in AudioFileText.objects.all():
    print(f"ID: {text.id}, Audio ID: {text.file.id}, File: {text.content_file[:50] if text.content_file else 'None'}..., Processed: {text.content_processed[:50] if text.content_processed else 'None'}...")

print("\n=== Testing Task ===")
# Test the task directly
audio_path = "media/audio/a.wav"
if os.path.exists(audio_path):
    print(f"File exists: {audio_path}")
    result = transcribe_audio(audio_path, 12)
    print(f"Task result: {result}")
else:
    print(f"File not found: {audio_path}")
    # List files in media/audio directory
    audio_dir = "media/audio"
    if os.path.exists(audio_dir):
        print(f"Files in {audio_dir}:")
        for file in os.listdir(audio_dir):
            print(f"  - {file}")
    else:
        print(f"Directory {audio_dir} does not exist")
