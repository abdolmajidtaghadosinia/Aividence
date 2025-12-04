from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.viewsets import ModelViewSet
from django.http import HttpResponse
import functools
import io
import os
import tempfile
import zipfile
from urllib.parse import quote
from urllib.request import urlretrieve
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
    from reportlab.lib.enums import TA_RIGHT
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
except Exception:  # pragma: no cover
    canvas = None
    A4 = None
    pdfmetrics = None
    TTFont = None
    TA_RIGHT = None
    ParagraphStyle = None
    getSampleStyleSheet = None
    SimpleDocTemplate = None
    Paragraph = None
    Spacer = None

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

    @staticmethod
    def _derive_export_base_name(audio_text: AudioFileText) -> str:
        """Return the user-visible audio title (without extension) when available."""

        def _sanitize_component(value: str) -> str:
            cleaned = value.strip()
            if not cleaned:
                return ""

            return cleaned.replace("/", "-").replace("\\", "-")

        # Prefer the explicit audio title the user chose.
        user_named = _sanitize_component(getattr(audio_text.file, "name", ""))
        if user_named:
            return user_named

        # Fallback to the subject if the title is missing but subject is present.
        subject_named = _sanitize_component(getattr(audio_text.file, "subject", ""))
        if subject_named:
            return subject_named

        # Then try the uploaded file's base name.
        source_file_name = ""
        field_file = getattr(audio_text.file, "file", None)
        if field_file and getattr(field_file, "name", ""):
            source_file_name = os.path.basename(field_file.name)

        if not source_file_name:
            source_file_name = os.path.basename(audio_text.file.name or "")

        base_name, _ = os.path.splitext(source_file_name)
        if base_name:
            return base_name

        return f"audio_{audio_text.file_id or audio_text.id}"

    @staticmethod
    def _content_disposition(filename: str) -> str:
        """Build a UTF-8 friendly Content-Disposition header value."""

        quoted = quote(filename)
        return f"attachment; filename*=UTF-8''{quoted}; filename=\"{filename}\""

    @staticmethod
    @functools.lru_cache(maxsize=1)
    def _resolve_vazirmatn_fonts() -> list[str]:
        """Return candidate Vazirmatn font paths with a non-variable fallback.

        ReportLab is often picky about variable fonts. To keep shaping stable, we
        try the bundled variable file first and then download a static Regular
        face into a temp cache so that registration can succeed even if the
        variable font cannot be parsed.
        """

        candidates: list[str] = []
        base_dir = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "..",
                "..",
                "front",
            )
        )

        local_variable = os.path.join(base_dir, "Vazirmatn-VariableFont_wght.ttf")
        if os.path.exists(local_variable):
            candidates.append(local_variable)

        download_url = os.environ.get(
            "PDF_PERSIAN_FONT_URL",
            "https://github.com/rastikerdar/vazirmatn/releases/download/v33.003/Vazirmatn-Regular.ttf",
        )

        cache_dir = os.path.join(tempfile.gettempdir(), "aividence_fonts")
        os.makedirs(cache_dir, exist_ok=True)
        cached_regular = os.path.join(cache_dir, "Vazirmatn-Regular.ttf")

        if not os.path.exists(cached_regular):
            try:
                urlretrieve(download_url, cached_regular)
            except Exception:
                cached_regular = ""

        if cached_regular and os.path.exists(cached_regular):
            candidates.append(cached_regular)

        return candidates

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

        base_name = self._derive_export_base_name(audio_text)

        # In-memory DOCX
        docx_buf = io.BytesIO()
        if Document is None:
            return Response({'detail': 'python-docx نصب نیست.'}, status=500)
        document = Document()

        def _apply_paragraph_rtl(paragraph):
            """Ensure paragraphs are left-aligned while keeping RTL glyph shaping."""

            if WD_PARAGRAPH_ALIGNMENT is not None:
                paragraph.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
            try:
                paragraph.paragraph_format.rtl = False
            except Exception:
                pass

            if qn is not None and OxmlElement is not None:
                try:
                    pPr = paragraph._p.get_or_add_pPr()
                    bidi = pPr.find(qn('w:bidi'))
                    if bidi is None:
                        bidi = OxmlElement('w:bidi')
                        bidi.set(qn('w:val'), '1')
                        pPr.append(bidi)
                    rtl = pPr.find(qn('w:rtl'))
                    if rtl is None:
                        rtl = OxmlElement('w:rtl')
                        rtl.set(qn('w:val'), '1')
                        pPr.append(rtl)
                except Exception:
                    pass

            try:
                for run in paragraph.runs:
                    run.font.name = 'Vazirmatn'
                    if qn is not None:
                        r_fonts = run._element.rPr.rFonts
                        for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
                            r_fonts.set(qn(attr), 'Vazirmatn')
            except Exception:
                pass

        def _apply_document_rtl_defaults():
            """Set document-level defaults to left alignment while keeping Vazirmatn font."""

            if WD_PARAGRAPH_ALIGNMENT is not None:
                try:
                    normal_style = document.styles['Normal']
                    normal_style.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
                    normal_style.paragraph_format.rtl = False
                except Exception:
                    pass

            if qn is not None:
                try:
                    normal_style = document.styles['Normal']
                    normal_style.font.name = 'Vazirmatn'
                    r_fonts = normal_style._element.rPr.rFonts
                    for attr in ('w:ascii', 'w:hAnsi', 'w:cs', 'w:eastAsia'):
                        r_fonts.set(qn(attr), 'Vazirmatn')
                except Exception:
                    pass

            if qn is not None and OxmlElement is not None:
                try:
                    for section in document.sections:
                        sect_pr = section._sectPr
                        bidi = sect_pr.find(qn('w:bidi'))
                        if bidi is None:
                            bidi = OxmlElement('w:bidi')
                            bidi.set(qn('w:val'), '1')
                            sect_pr.append(bidi)
                except Exception:
                    pass

        _apply_document_rtl_defaults()

        for line in content.splitlines() or ['']:
            paragraph = document.add_paragraph(line)
            _apply_paragraph_rtl(paragraph)
        document.save(docx_buf)
        docx_buf.seek(0)

        # In-memory PDF
        pdf_buf = io.BytesIO()
        if canvas is None or SimpleDocTemplate is None or Paragraph is None:
            return Response({'detail': 'reportlab نصب نیست.'}, status=500)
        if ParagraphStyle is None or getSampleStyleSheet is None or TA_RIGHT is None:
            return Response({'detail': 'reportlab style components در دسترس نیستند.'}, status=500)
        if arabic_reshaper is None or get_display is None:
            return Response({'detail': 'کتابخانه‌های arabic-reshaper و python-bidi برای ساخت PDF فارسی الزامی هستند.'}, status=500)

        # Register a Persian-friendly font when available for proper glyph rendering.
        def _register_persian_font():
            """Try to register a bundled or system font that supports Persian glyphs."""

            if pdfmetrics is None or TTFont is None:
                return None

            preferred_fonts = []

            for font_path in self._resolve_vazirmatn_fonts():
                preferred_fonts.append((font_path, "Vazirmatn"))

            preferred_fonts.extend(
                [
                    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVuSans"),
                    ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "DejaVuSans"),
                    ("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", "DejaVuSans"),
                ]
            )

            for font_path, family in preferred_fonts:
                if font_path and os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont(family, font_path))
                        return family
                    except Exception:
                        continue

            return None

        font_name = _register_persian_font()
        if not font_name:
            return Response({'detail': 'فونت وزیرمتن برای ساخت PDF در دسترس نیست.'}, status=500)

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

        # Build a proper RTL PDF using Platypus so glyph shaping and wrapping stay intact.
        doc = SimpleDocTemplate(
            pdf_buf,
            pagesize=A4 or (595, 842),
            rightMargin=48,
            leftMargin=48,
            topMargin=48,
            bottomMargin=48,
        )

        base_styles = getSampleStyleSheet()
        persian_style = ParagraphStyle(
            name="Persian",
            parent=base_styles["Normal"],
            fontName=font_name,
            fontSize=12,
            leading=16,
            alignment=TA_RIGHT,
            wordWrap="RTL",
            allowOrphans=0,
            allowWidows=0,
            rightIndent=0,
            leftIndent=0,
        )

        story = []
        for paragraph in content.splitlines() or [""]:
            prepared = _prepare_rtl_text(paragraph)
            story.append(Paragraph(prepared, persian_style, encoding="utf-8"))
            story.append(Spacer(1, 8))

        doc.build(story)
        pdf_buf.seek(0)

        # ZIP both
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, mode='w', compression=zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"{base_name}.docx", docx_buf.read())
            zf.writestr(f"{base_name}.pdf", pdf_buf.read())
        zip_buf.seek(0)

        resp = HttpResponse(zip_buf.getvalue(), content_type='application/zip')
        resp['Content-Disposition'] = self._content_disposition(f"{base_name}.zip")
        return resp

    