"""Blink FastAPI entrypoint."""
from __future__ import annotations

import json
from contextlib import asynccontextmanager
from typing import Any

import httpx
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, status

from .config import Settings, get_settings
from .domains import DomainConfig, get_domain_config
from .gemini import GeminiClient
from .schemas import GeminiAnalysis, ProcessResponse


def _validate_image(file: UploadFile, data: bytes, settings: Settings) -> None:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Uploaded file must be an image")

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image exceeds {settings.max_upload_size_mb} MB limit",
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    async with httpx.AsyncClient() as http_client:
        app.state.gemini_client = GeminiClient(http_client, settings)
        yield


app = FastAPI(
    title="Blink Backend",
    version="0.1.0",
    summary="Image processing pipeline leveraging Gemini 2.0 Flash",
    lifespan=lifespan,
)


def get_gemini_client(request: Request) -> GeminiClient:
    return request.app.state.gemini_client


def get_domain(
    request: Request,
    domain_id: str | None = Form(default=None, alias="domainId"),
) -> DomainConfig:
    if domain_id is None:
        domain_id = request.query_params.get("domainId")

    if not domain_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="domainId is required")

    try:
        return get_domain_config(domain_id)
    except KeyError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@app.post("/process", response_model=ProcessResponse)
async def process_image(
    file: UploadFile = File(...),
    domain: DomainConfig = Depends(get_domain),
    settings: Settings = Depends(get_settings),
    gemini_client: GeminiClient = Depends(get_gemini_client),
) -> ProcessResponse:
    """Handle multipart uploads and forward them to Gemini."""

    contents = await file.read()
    _validate_image(file, contents, settings)

    gemini_payload, credits_remaining = await gemini_client.analyze_image(
        image_bytes=contents,
        mime_type=file.content_type or "image/jpeg",
        domain=domain,
    )

    structured = _extract_structured_response(gemini_payload)
    analysis = GeminiAnalysis.model_validate(structured)

    return ProcessResponse(
        domainId=domain.domain_id,
        model=domain.model,
        summary=analysis.summary,
        captions=analysis.captions,
        objects=analysis.objects,
        specialistNotes=analysis.specialistNotes,
        creditsRemaining=credits_remaining if credits_remaining is not None else settings.default_credits_remaining,
    )


@app.get("/health", tags=["infrastructure"])
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


def _extract_structured_response(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract JSON text emitted by Gemini when response schema is enforced."""

    candidates = payload.get("candidates")
    if not candidates:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Gemini returned no candidates")

    first_candidate = candidates[0]
    content = first_candidate.get("content") or {}
    parts = content.get("parts") or []

    for part in parts:
        text = part.get("text")
        if text:
            try:
                return json.loads(text)
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status.HTTP_502_BAD_GATEWAY,
                    detail="Gemini returned malformed JSON",
                ) from exc

    raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail="Gemini response missing JSON payload")
