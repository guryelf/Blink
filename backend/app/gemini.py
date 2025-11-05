"""Client utilities for calling the Gemini API."""
from __future__ import annotations

import base64
import json
from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, status

from .config import Settings
from .domains import DomainConfig


class GeminiClient:
    """Abstraction responsible for interacting with Gemini."""

    def __init__(self, http_client: httpx.AsyncClient, settings: Settings) -> None:
        self._http_client = http_client
        self._settings = settings

    async def analyze_image(
        self,
        *,
        image_bytes: bytes,
        mime_type: str,
        domain: DomainConfig,
    ) -> tuple[Dict[str, Any], Optional[int]]:
        """Send the prompt and image to Gemini and return the structured response."""

        if not self._settings.gemini_api_key:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Gemini API key is not configured.",
            )

        inline_data = base64.b64encode(image_bytes).decode("utf-8")
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": domain.user_prompt},
                        {"inline_data": {"mime_type": mime_type, "data": inline_data}},
                    ],
                }
            ],
            "systemInstruction": {"parts": [{"text": domain.system_instruction}]},
            "generationConfig": domain.generation_config,
        }

        if domain.safety_settings:
            payload["safetySettings"] = list(domain.safety_settings)

        url = f"{self._settings.gemini_api_url.rstrip('/')}/models/{domain.model}:generateContent"
        params = {"key": self._settings.gemini_api_key}

        try:
            response = await self._http_client.post(
                url,
                params=params,
                json=payload,
                timeout=self._settings.request_timeout_seconds,
            )
        except httpx.RequestError as exc:  # pragma: no cover - network failure handled at runtime
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail="Gemini service unreachable") from exc

        if response.status_code != status.HTTP_200_OK:
            detail = self._extract_error_detail(response)
            raise HTTPException(response.status_code, detail=detail)

        credits_remaining = self._extract_credits_remaining(response)
        return response.json(), credits_remaining

    @staticmethod
    def _extract_error_detail(response: httpx.Response) -> str:
        try:
            data = response.json()
        except json.JSONDecodeError:
            return response.text or "Gemini request failed"

        if "error" in data:
            error = data["error"]
            if isinstance(error, dict):
                message = error.get("message") or error.get("status")
                if message:
                    return str(message)
        return response.text or "Gemini request failed"

    @staticmethod
    def _extract_credits_remaining(response: httpx.Response) -> Optional[int]:
        """Try to read credit remaining metadata from provider headers."""

        header_candidates = [
            "x-blink-credits-remaining",
            "x-usage-remaining",
            "x-ratelimit-remaining",
        ]
        for header in header_candidates:
            if header in response.headers:
                try:
                    return int(response.headers[header])
                except ValueError:
                    continue
        return None
