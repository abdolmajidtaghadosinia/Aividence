#!/usr/bin/env python
"""
Test script to verify transcription fix.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'core'))
django.setup()

from files.tasks import transcribe_audio_local

def test_transcription():
    """Test the local transcription function."""
    # Find an audio file to test with
    audio_dir = 'core/media/audio'
    if os.path.exists(audio_dir):
        audio_files = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')]
        if audio_files:
            test_file = os.path.join(audio_dir, audio_files[0])
            print(f"Testing transcription with: {test_file}")

            result = transcribe_audio_local(test_file, audio_id=None, language='fa')
            print(f"Result: {result}")
            return result
    else:
        print("No audio files found for testing")
        return None

if __name__ == "__main__":
    test_transcription()
