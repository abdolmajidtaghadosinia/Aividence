from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.viewsets import ModelViewSet
from django.http import HttpResponse
import io
import zipfile
from office.models import KeywordList, AudioFileText
from .serializers import KeywordListSerializer

try:
    from docx import Document  # python-docx
except Exception:  # pragma: no cover
    Document = None

try:
    from reportlab.pdfgen import canvas
except Exception:  # pragma: no cover
    canvas = None



class KeywordModelViewSet(ModelViewSet):
    queryset = KeywordList.objects.all()
    serializer_class = KeywordListSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

class ExportCustomContentZipView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        audio_text_id = request.data.get('id')
        audio_id = request.data.get('audio_id')
        if not audio_text_id and not audio_id:
            return Response({'detail': 'یکی از id یا audio_id الزامی است.'}, status=400)

        try:
            if audio_text_id:
                audio_text = AudioFileText.objects.select_related('file').get(id=audio_text_id)
            else:
                audio_text = AudioFileText.objects.select_related('file').get(file__id=audio_id)
        except AudioFileText.DoesNotExist:
            return Response({'detail': 'رکورد یافت نشد.'}, status=404)

        content = audio_text.custom_content or ''
        if not content.strip():
            content = audio_text.content_processed
            # return Response({'detail': 'custom_content خالی است.'}, status=400)

        # In-memory DOCX
        docx_buf = io.BytesIO()
        if Document is None:
            return Response({'detail': 'python-docx نصب نیست.'}, status=500)
        document = Document()
        for line in content.splitlines() or ['']:
            document.add_paragraph(line)
        document.save(docx_buf)
        docx_buf.seek(0)

        # In-memory PDF
        pdf_buf = io.BytesIO()
        if canvas is None:
            return Response({'detail': 'reportlab نصب نیست.'}, status=500)
        c = canvas.Canvas(pdf_buf)
        width, height = 595, 842  # A4 points
        x, y = 40, height - 40
        line_height = 14
        for line in content.splitlines() or ['']:
            if y < 40:
                c.showPage()
                y = height - 40
            c.drawString(x, y, line)
            y -= line_height
        c.showPage()
        c.save()
        pdf_buf.seek(0)

        # ZIP both
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
            base_name = f"custom_content_{audio_text_id}"
            zf.writestr(f"{base_name}.docx", docx_buf.read())
            zf.writestr(f"{base_name}.pdf", pdf_buf.read())
        zip_buf.seek(0)

        resp = HttpResponse(zip_buf.getvalue(), content_type='application/zip')
        resp['Content-Disposition'] = f'attachment; filename="custom_content_{audio_text_id}.zip"'
        return resp

    