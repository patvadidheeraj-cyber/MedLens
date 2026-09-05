"""
Document processing pipeline.
1. Detect file type
2. Extract text (pdfplumber for PDFs, Pillow for images)
3. Fall back to OCR if text is sparse
"""
from __future__ import annotations
import io
import os
from pathlib import Path
from typing import Tuple

# We import lazily inside functions so missing optional deps
# don't crash the whole app on startup.


def extract_text_from_pdf(file_path: str) -> Tuple[str, bool]:
    """
    Returns (text, ocr_used).
    Tries pdfplumber first; if the extracted text is too sparse, uses OCR.
    """
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            pages_text = []
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            text = "\n".join(pages_text)

        if len(text.strip()) > 100:
            return text, False

        # Sparse text → try OCR on rendered pages
        return _ocr_pdf(file_path), True
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {e}") from e


def _ocr_pdf(file_path: str) -> str:
    """Convert PDF pages to images and run OCR."""
    try:
        from pdf2image import convert_from_path
        images = convert_from_path(file_path, dpi=200)
    except Exception:
        # pdf2image not available — try pillow-only OCR on original file
        images = []

    if not images:
        return ""

    return _ocr_images(images)


def extract_text_from_image(file_path: str) -> Tuple[str, bool]:
    """Run OCR on a single image file. Returns (text, ocr_used=True)."""
    try:
        from PIL import Image
        img = Image.open(file_path)
        text = _ocr_images([img])
        return text, True
    except Exception as e:
        raise RuntimeError(f"Image OCR failed: {e}") from e


def _ocr_images(images) -> str:
    """Run pytesseract on a list of PIL images."""
    try:
        import pytesseract
        from app.config import settings
        if settings.TESSERACT_CMD and settings.TESSERACT_CMD != "tesseract":
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

        parts = []
        for img in images:
            parts.append(pytesseract.image_to_string(img))
        return "\n".join(parts)
    except Exception as e:
        raise RuntimeError(f"OCR failed: {e}") from e


def extract_text(file_path: str, file_type: str) -> Tuple[str, bool]:
    """
    Main entry-point for document text extraction.
    Returns (text, ocr_used).
    """
    ft = file_type.lower()
    if ft == "pdf":
        return extract_text_from_pdf(file_path)
    elif ft in ("png", "jpg", "jpeg"):
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
