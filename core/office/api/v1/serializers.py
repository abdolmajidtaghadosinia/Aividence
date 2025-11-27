from rest_framework import serializers
from office.models import KeywordList, Subset, AudioFileText
from accounts.models import Profile

class KeywordListSerializer(serializers.ModelSerializer):
    subset = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = KeywordList
        fields = ('id', 'Keyword', 'description', 'subset')
        read_only_fields = ('id', )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request_method = self.context.get('request').method if self.context.get('request') else None

        if request_method in ['PUT', 'PATCH']:
            # در زمان ویرایش، فقط توضیحات فعال باشد
            self.fields['Keyword'].read_only = True
            self.fields['subset'].read_only = True

    def validate(self, data):
        request = self.context.get('request')

        if request and request.method == 'POST':
            required_fields = ['Keyword', 'description']
            for field in required_fields:
                if field not in data:
                    raise serializers.ValidationError({field: 'این فیلد الزامی است.'})

        return data

    def create(self, validated_data):
        # پردازش subset از طریق context
        request = self.context.get('request')
        if request and request.method == 'POST':
            validated_data['user_creator'] = Profile.objects.get(user=request.user)

            subset_title = request.data.get('subset')
            if subset_title:
                try:
                    validated_data['subset'] = Subset.objects.get(title=subset_title)
                except Subset.DoesNotExist:
                    raise serializers.ValidationError({'subset': 'زیرمجموعه با این عنوان یافت نشد.'})
            else:
                raise serializers.ValidationError({'subset': 'این فیلد الزامی است.'})
            

        return super().create(validated_data)

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subset
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class AudioFileTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudioFileText
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
