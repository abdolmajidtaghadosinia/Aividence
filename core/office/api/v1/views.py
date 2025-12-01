from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.viewsets import ModelViewSet
from django.http import HttpResponse
import io
import os
import zipfile
from office.models import KeywordList, AudioFileText
from .serializers import KeywordListSerializer

try:
    from docx import Document  # python-docx
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
except Exception:  # pragma: no cover
    Document = None
    qn = None
    OxmlElement = None
    WD_PARAGRAPH_ALIGNMENT = None

try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
except Exception:  # pragma: no cover
    canvas = None
    A4 = None
    pdfmetrics = None
    TTFont = None

try:
    import arabic_reshaper
    from bidi.algorithm import get_display
except Exception:  # pragma: no cover
    arabic_reshaper = None
    get_display = None



class KeywordModelViewSet(ModelViewSet):
    """CRUD viewset for managing keyword lists via authenticated API access."""

    queryset = KeywordList.objects.all()
    serializer_class = KeywordListSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]


class ExportCustomContentZipView(APIView):
    """Generate DOCX and PDF exports of processed audio text and bundle them into a ZIP."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Return a ZIP containing DOCX and PDF renderings of the custom or processed text.

        The caller may provide either a direct audio text record ``id`` or an ``audio_id`` to
        locate the text content. The selected text is rendered to DOCX and PDF in-memory before
        being compressed and streamed back to the client.

        Args:
            request (Request): DRF request containing ``id`` or ``audio_id`` in ``data``.

        Returns:
            Response: ``HttpResponse`` with a ZIP attachment on success, or an error response if
                the record is missing or required dependencies are unavailable.
        """
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

        source_file_name = None
        if getattr(audio_text.file, "file", None):
            source_file_name = os.path.basename(audio_text.file.file.name or "")

        base_name, _ = os.path.splitext(source_file_name or audio_text.file.name or "")
        if not base_name:
            base_name = f"audio_{audio_text.file_id or audio_text.id}"

        # In-memory DOCX
        docx_buf = io.BytesIO()
        if Document is None:
            return Response({'detail': 'python-docx نصب نیست.'}, status=500)
        document = Document()

        def _apply_paragraph_rtl(paragraph):
            """Ensure paragraphs are right-aligned and marked as RTL when supported."""

            if WD_PARAGRAPH_ALIGNMENT is not None:
                paragraph.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT

            if qn is not None and OxmlElement is not None:
                try:
                    pPr = paragraph._p.get_or_add_pPr()
                    bidi = pPr.find(qn('w:bidi'))
                    if bidi is None:
                        bidi = OxmlElement('w:bidi')
                        bidi.set(qn('w:val'), '1')
                        pPr.append(bidi)
                except Exception:
                    pass

        # Set a Persian-friendly default font for better RTL rendering in Word.
        if qn is not None:
            try:
                normal_style = document.styles['Normal']
                normal_style.font.name = 'Vazirmatn'
                normal_style._element.rPr.rFonts.set(qn('w:eastAsia'), 'Vazirmatn')
                if WD_PARAGRAPH_ALIGNMENT is not None:
                    normal_style.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.RIGHT
            except Exception:
                pass

        for line in content.splitlines() or ['']:
            paragraph = document.add_paragraph(line)
            _apply_paragraph_rtl(paragraph)
        document.save(docx_buf)
        docx_buf.seek(0)

        # In-memory PDF
        pdf_buf = io.BytesIO()
        if canvas is None:
            return Response({'detail': 'reportlab نصب نیست.'}, status=500)
        if arabic_reshaper is None or get_display is None:
            return Response({'detail': 'کتابخانه‌های arabic-reshaper و python-bidi برای ساخت PDF فارسی الزامی هستند.'}, status=500)

        # Register a Persian-friendly font when available for proper glyph rendering.
        font_name = None
        if pdfmetrics is not None and TTFont is not None:
            for font_path in [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
            ]:
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))
                        font_name = 'DejaVuSans'
                        break
                    except Exception:
                        continue

        def _prepare_rtl_text(text: str) -> str:
            """Return a display-ready RTL string when bidi helpers are available."""

            if not text:
                return ""

            if arabic_reshaper and get_display:
                try:
                    reshaped = arabic_reshaper.reshape(text)
                    return get_display(reshaped)
                except Exception:
                    pass

            return text

        def _wrap_line(text, max_width, active_font):
            """Wrap a single line to the maximum width based on the active font metrics."""

            if not text:
                return [""]

            prepared_text = _prepare_rtl_text(text)

            # Fallback to a naive character-based wrap when metrics are unavailable.
            if pdfmetrics is None or active_font is None:
                import textwrap

                return textwrap.wrap(prepared_text, width=80) or [""]

            words = prepared_text.split()
            wrapped, current = [], ""
            for word in words:
                candidate = word if not current else f"{current} {word}"
                if (
                    pdfmetrics.stringWidth(candidate, active_font, 12)
                    <= max_width
                ):
                    current = candidate
                else:
                    if current:
                        wrapped.append(current)
                    current = word
            if current:
                wrapped.append(current)
            return wrapped or [""]

        c = canvas.Canvas(pdf_buf, pagesize=A4 or (595, 842))
        width, height = (A4 or (595, 842))
        margin = 48
        line_height = 18
        start_y = height - margin
        text_x = width - margin  # Right-aligned for Persian content.
        active_font = font_name or c._fontname
        c.setFont(active_font, 12)

        y = start_y
        for paragraph in content.splitlines() or [""]:
            max_width = width - (margin * 2)
            wrapped_lines = _wrap_line(paragraph, max_width, active_font)
            for line in wrapped_lines:
                if y < margin:
                    c.showPage()
                    c.setFont(active_font, 12)
                    y = start_y
                c.drawRightString(text_x, y, _prepare_rtl_text(line))
                y -= line_height
            # Extra spacing between paragraphs.
            y -= 4

        c.save()
        pdf_buf.seek(0)

        # ZIP both
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"{base_name}.docx", docx_buf.read())
            zf.writestr(f"{base_name}.pdf", pdf_buf.read())
        zip_buf.seek(0)

        resp = HttpResponse(zip_buf.getvalue(), content_type='application/zip')
        resp['Content-Disposition'] = f'attachment; filename="{base_name}.zip"'
        return resp

    