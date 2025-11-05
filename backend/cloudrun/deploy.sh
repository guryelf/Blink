#!/usr/bin/env bash
set -euo pipefail

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required" >&2
  exit 1
fi

SERVICE_NAME=${SERVICE_NAME:-blink-backend}
REGION=${REGION:-us-central1}
PROJECT_ID=${PROJECT_ID:?PROJECT_ID environment variable must be set}
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

# Build and push the container image using the backend directory as context
gcloud builds submit --tag "${IMAGE}" .

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --execution-environment gen2 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "GEMINI_API_URL=${GEMINI_API_URL:-https://generativelanguage.googleapis.com/v1beta}"

echo "Deployment complete. Configure GEMINI_API_KEY as a secret or env var before sending traffic."
