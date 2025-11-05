"""Pydantic models used by the Blink backend."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, validator


class BoundingBox(BaseModel):
    """Normalized bounding box coordinates."""

    x: float = Field(..., ge=0, le=1)
    y: float = Field(..., ge=0, le=1)
    width: float = Field(..., ge=0, le=1)
    height: float = Field(..., ge=0, le=1)


class DetectedObject(BaseModel):
    """Represents an object detected in the image."""

    label: str
    confidence: float = Field(..., ge=0, le=1)
    boundingBox: Optional[BoundingBox] = None

    @validator("label")
    def validate_label(cls, value: str) -> str:  # pragma: no cover - simple validation
        value = value.strip()
        if not value:
            raise ValueError("Label must not be empty")
        return value


class GeminiAnalysis(BaseModel):
    """Structure returned by Gemini when response schema is enforced."""

    summary: str
    captions: List[str]
    objects: List[DetectedObject]
    specialistNotes: Optional[List[str]] = None


class ProcessResponse(BaseModel):
    """Response payload returned to the mobile client."""

    domainId: str
    model: str
    summary: str
    captions: List[str]
    objects: List[DetectedObject]
    specialistNotes: Optional[List[str]] = None
    creditsRemaining: Optional[int] = Field(
        default=None,
        description="Remaining Blink credits if provided by the upstream service.",
    )
