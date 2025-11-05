"""Domain configuration for Blink image processing."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Mapping


@dataclass(frozen=True)
class DomainConfig:
    """Configuration describing how to interact with Gemini for a domain."""

    domain_id: str
    model: str
    system_instruction: str
    user_prompt: str
    response_schema: Dict[str, Any]
    temperature: float = 0.2
    max_output_tokens: int = 1024
    safety_settings: tuple[Dict[str, Any], ...] = field(default_factory=tuple)

    @property
    def generation_config(self) -> Dict[str, Any]:
        config: Dict[str, Any] = {
            "temperature": self.temperature,
            "maxOutputTokens": self.max_output_tokens,
            "responseMimeType": "application/json",
            "responseSchema": self.response_schema,
        }
        return config


_DEFAULT_OBJECT_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "label": {"type": "string"},
        "confidence": {"type": "number"},
        "boundingBox": {
            "type": "object",
            "properties": {
                "x": {"type": "number"},
                "y": {"type": "number"},
                "width": {"type": "number"},
                "height": {"type": "number"},
            },
            "required": ["x", "y", "width", "height"],
        },
    },
    "required": ["label", "confidence"],
}


def _make_response_schema(include_specialist_notes: bool = False) -> Dict[str, Any]:
    properties: Dict[str, Any] = {
        "summary": {"type": "string"},
        "captions": {"type": "array", "items": {"type": "string"}},
        "objects": {
            "type": "array",
            "items": _DEFAULT_OBJECT_SCHEMA,
        },
    }
    required = ["summary", "captions", "objects"]

    if include_specialist_notes:
        properties["specialistNotes"] = {"type": "array", "items": {"type": "string"}}
        required.append("specialistNotes")

    return {"type": "object", "properties": properties, "required": required}


_DOMAINS: Mapping[str, DomainConfig] = {
    "vision-pro": DomainConfig(
        domain_id="vision-pro",
        model="gemini-2.0-flash",
        system_instruction="""
            You are Blink's enterprise vision analyst. Produce concise JSON responses that summarize
            the scene, highlight key detected objects, and ensure bounding boxes are aligned with
            real-world coordinates. Avoid embellishment beyond the image content.
        """.strip(),
        user_prompt="""
            Review the uploaded image for enterprise insights. Identify notable objects, capture
            short captions describing relevant regions, and offer an overall summary suitable for
            operations teams.
        """.strip(),
        response_schema=_make_response_schema(),
        temperature=0.15,
        max_output_tokens=800,
    ),
    "vision-lite": DomainConfig(
        domain_id="vision-lite",
        model="gemini-2.0-flash",
        system_instruction="""
            You are an assistant providing lightweight object detection and captions.
            Focus on speed and provide only the most relevant results in JSON.
        """.strip(),
        user_prompt="""
            Provide at most five key objects, brief captions for the overall scene, and a one-sentence
            summary optimized for quick review.
        """.strip(),
        response_schema=_make_response_schema(),
        temperature=0.25,
        max_output_tokens=600,
    ),
    "vision-medical": DomainConfig(
        domain_id="vision-medical",
        model="gemini-2.0-flash",
        system_instruction="""
            You analyze medical imagery for Blink. Provide clinical-style summaries and highlight
            noteworthy findings. Do not offer diagnoses, only describe observable evidence.
        """.strip(),
        user_prompt="""
            Describe anatomical structures, anomalies, and notable regions with precise captions.
            Include specialist notes for follow-up when necessary.
        """.strip(),
        response_schema=_make_response_schema(include_specialist_notes=True),
        temperature=0.1,
        max_output_tokens=900,
    ),
}


def get_domain_config(domain_id: str) -> DomainConfig:
    """Return the domain configuration or raise a KeyError."""

    try:
        return _DOMAINS[domain_id]
    except KeyError as exc:  # pragma: no cover - FastAPI handles the HTTP translation
        raise KeyError(f"Unknown domain '{domain_id}'") from exc


def list_domain_configs() -> Mapping[str, DomainConfig]:
    """Return an immutable view of the domain configuration."""

    return dict(_DOMAINS)
