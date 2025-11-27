from rest_framework import serializers
from files.models import Audio, Subset

class AudioListItemSerializer(serializers.ModelSerializer):
    subset_title = serializers.CharField(source='subset.title', read_only=True)
    file_name = serializers.SerializerMethodField()
    uploaded_at = serializers.DateTimeField(source='created_at', read_only=True)
    file_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Audio
        fields = [
            'id', 'file_name', 'uploaded_at', 'file_type', 'file_type_display',
            'status', 'status_display', 'subset_title', 'upload_uuid'
        ]
        read_only_fields = fields

    def get_file_name(self, obj):
        return obj.name
        # try:
        #     return obj.file.name.split('/')[-1]
        # except Exception:
        #     return obj.name

    def get_file_type_display(self, obj):
        return obj.get_file_type_display()

    def get_status_display(self, obj):
        return obj.get_status_display()
