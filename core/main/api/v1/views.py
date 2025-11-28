import os
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.files.storage import default_storage
from django.conf import settings
from files.models import Audio, Subset
from .serializers import AudioListItemSerializer
from django.shortcuts import get_object_or_404



class AudioListView(generics.ListAPIView):
    """Provide a summarized list of uploaded audio files for dashboard consumption."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = AudioListItemSerializer

    def get_queryset(self):
        """Return the ordered queryset with subset relationship eagerly loaded."""
        return Audio.objects.select_related('subset').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """Return paginated audio items along with aggregate counts.

        Args:
            request (Request): DRF request carrying authentication context.
            *args: Additional positional arguments passed by the viewset infrastructure.
            **kwargs: Additional keyword arguments passed by the viewset infrastructure.

        Returns:
            Response: Collection of serialized audio items and summary metrics.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        total = queryset.count()
        status_counts = {
            'AP': queryset.filter(status='AP').count(),
            'P': queryset.filter(status='P').count(),
            'PD': queryset.filter(status='PD').count(),
            'SU': queryset.filter(status='SU').count(),
            'A': queryset.filter(status='A').count(),
            'E': queryset.filter(status='E').count(),
            'R': queryset.filter(status='R').count(),
        }

        return Response({
            'items': serializer.data,
            'counts': status_counts,
            'total': total,
        })