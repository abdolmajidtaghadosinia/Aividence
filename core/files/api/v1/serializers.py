from rest_framework import serializers
from files.models import Audio, Subset


class AudioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audio
        fields = [
            'id',
            'file',
            'file_type',
            'subset',
            'name',
            'subject',
            'status',
            'user_uplouder',
            'upload_uuid',
            'file_duration',
            'file_token',
            'task_id',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'user_uplouder', 'upload_uuid', 'created_at', 'updated_at', 'task_id', 'file_duration', 'file_token']
    
    def create(self, validated_data):
        # اضافه کردن فایل از context
        request = self.context.get('request')
        if request and hasattr(request, 'FILES') and 'file' in request.FILES:
            validated_data['file'] = request.FILES.get('file')
        return super().create(validated_data)
