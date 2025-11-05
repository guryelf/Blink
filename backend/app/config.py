"""Runtime configuration for the Blink backend service."""
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    gemini_api_key: str = Field(..., alias="GEMINI_API_KEY", description="API key for Gemini access")
    gemini_api_url: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta",
        alias="GEMINI_API_URL",
        description="Base URL for Gemini API",
    )
    request_timeout_seconds: float = Field(
        default=40.0, alias="GEMINI_REQUEST_TIMEOUT", description="HTTP timeout when calling Gemini"
    )
    max_upload_size_mb: int = Field(
        default=8, alias="MAX_UPLOAD_SIZE_MB", description="Maximum upload size allowed for images"
    )
    default_credits_remaining: Optional[int] = Field(
        default=None,
        alias="DEFAULT_CREDITS_REMAINING",
        description="Fallback credits remaining value when provider does not return one",
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""

    return Settings()
