"""
Reference range status calculator.
The application (not the AI) computes LOW / NORMAL / HIGH.
"""
from __future__ import annotations
import re
from typing import Optional
from app.models.report import ResultStatus


def parse_reference_range(ref_range_raw: Optional[str]):
    """
    Parse a raw reference range string into (low, high) floats.
    Handles formats like:
      "3.5-5.0"
      "< 200"
      "> 40"
      "70 - 100"
      "Negative"
    Returns (low, high) or (None, None) if unparseable.
    """
    if not ref_range_raw:
        return None, None

    text = ref_range_raw.strip()

    # Range format: "3.5-5.0" or "3.5 - 5.0"
    m = re.match(r"^([\d.]+)\s*[-–]\s*([\d.]+)$", text)
    if m:
        return float(m.group(1)), float(m.group(2))

    # Less than: "< 200" or "<=200"
    m = re.match(r"^[<≤]=?\s*([\d.]+)$", text)
    if m:
        return None, float(m.group(1))

    # Greater than: "> 40" or ">=40"
    m = re.match(r"^[>≥]=?\s*([\d.]+)$", text)
    if m:
        return float(m.group(1)), None

    return None, None


def calculate_status(
    value_numeric: Optional[float],
    ref_low: Optional[float],
    ref_high: Optional[float],
) -> ResultStatus:
    """
    Compute NORMAL / LOW / HIGH / UNKNOWN.
    Decision is purely mathematical — the AI is never involved.
    """
    if value_numeric is None:
        return ResultStatus.UNKNOWN

    if ref_low is None and ref_high is None:
        return ResultStatus.UNKNOWN

    if ref_low is not None and value_numeric < ref_low:
        return ResultStatus.LOW

    if ref_high is not None and value_numeric > ref_high:
        return ResultStatus.HIGH

    return ResultStatus.NORMAL


def try_parse_numeric(value_raw: str) -> Optional[float]:
    """Extract the leading numeric portion from a value string."""
    if not value_raw:
        return None
    m = re.match(r"^\s*([\d.]+)", value_raw.strip())
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return None
