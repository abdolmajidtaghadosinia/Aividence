from rest_framework import serializers
from files.models import Audio, Subset

class AudioListItemSerializer(serializers.ModelSerializer):
    """Serializer returning concise audio metadata for dashboard listings."""

    subset_title = serializers.CharField(source='subset.title', read_only=True)
    file_name = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)
    file_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    uploader = serializers.SerializerMethodField()

    class Meta:
        model = Audio
        fields = [
            'id', 'file_name', 'uploaded_at', 'file_type', 'file_type_display',
            'status', 'status_display', 'subset_title', 'upload_uuid', 'task_id', 'uploader'
        ]
        read_only_fields = fields

    def get_file_name(self, obj):
        """Resolve the friendly file name for the audio object.

        Args:
            obj (Audio): Audio instance being serialized.

        Returns:
            str: Preferred display name for the uploaded file.
        """
        return obj.name

    def get_file_type_display(self, obj):
        """Return the human-readable label for the audio file type.

        Args:
            obj (Audio): Audio instance being serialized.

        Returns:
            str: Display name for the file type choice field.
        """
        return obj.get_file_type_display()

    def get_status_display(self, obj):
        """Return the human-readable label for the processing status.

        Args:
            obj (Audio): Audio instance being serialized.

        Returns:
            str: Display label of the current processing status.
        """
        return obj.get_status_display()

    def get_uploader(self, obj):
        """Return the full name of the uploader profile if available."""

        profile = getattr(obj, 'user_uplouder', None)
        if not profile:
            return ''

        name = getattr(profile, 'name', '') or ''
        family = getattr(profile, 'family', '') or ''

        full_name = f"{name} {family}".strip()
        return full_name or ''
