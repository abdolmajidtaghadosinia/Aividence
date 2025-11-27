#!/usr/bin/env python
"""
Final test to verify transcription works with ffmpeg.
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
    """Test transcription with a real audio file."""
    audio_file = '/src/media/audio/test.mp3'

    if not os.path.exists(audio_file):
        print(f"❌ Audio file not found: {audio_file}")
        return False

    print(f"🔄 Testing transcription with: {audio_file}")

    result = transcribe_audio_local(audio_file, audio_id=None, language='fa')

    if result.get('success'):
        text = result.get('text', '')
        print("✅ Transcription successful!")
        print(f"📝 Extracted text length: {len(text)} characters")
        print(f"📝 First 200 characters: {text[:200]}...")
        return True
    else:
        print(f"❌ Transcription failed: {result.get('error', 'Unknown error')}")
        return False

if __name__ == "__main__":
    success = test_transcription()
    print(f"\n{'🎉 SUCCESS: Transcription is working!' if success else '💥 FAILED: Transcription still has issues'}")
