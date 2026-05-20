#!/usr/bin/env bash
# deploy-cloud-run.sh — Build & deploy backend ke Cloud Run
# Jalankan dari root repo: bash infra/deploy-cloud-run.sh
# Prasyarat: setup-gcp.sh sudah pernah dijalankan sebelumnya

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-asia-southeast2}"
SERVICE_NAME="kawan-backend"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
BUCKET_NAME="kawan-uploads-${PROJECT_ID}"
SA_EMAIL="kawan-backend-sa@${PROJECT_ID}.iam.gserviceaccount.com"

echo "=== KawanUMKM Cloud Run Deploy ==="
echo "Project : $PROJECT_ID"
echo "Region  : $REGION"
echo "Image   : $IMAGE"
echo ""

# ── Step 1: Build TypeScript ──────────────────────────────────────────────────
echo "[1/4] Build TypeScript..."
cd "$(dirname "$0")/../backend"
npm ci
npm run build
cd - > /dev/null

# ── Step 2: Build & push Docker image ────────────────────────────────────────
echo "[2/4] Build & push Docker image..."
gcloud builds submit \
  --tag "$IMAGE" \
  --project "$PROJECT_ID" \
  "$(dirname "$0")/../backend"

# ── Step 3: Deploy ke Cloud Run ───────────────────────────────────────────────
echo "[3/4] Deploy ke Cloud Run..."

# Ambil URL service dulu (kalau sudah ada) untuk WORKER_URL
EXISTING_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)" 2>/dev/null || echo "")

gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --service-account="$SA_EMAIL" \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300s \
  --concurrency=80 \
  --set-env-vars="\
GCP_PROJECT_ID=${PROJECT_ID},\
GCP_REGION=${REGION},\
GCP_LOCATION=global,\
GCS_BUCKET_NAME=${BUCKET_NAME},\
FIRESTORE_COLLECTION=kawan-jobs,\
CLOUD_TASKS_QUEUE=kawan-jobs,\
GCP_VERTEX_TEXT_MODEL=gemini-2.5-flash,\
GCP_VERTEX_IMAGE_MODEL=gemini-3-pro-image-preview,\
WORKER_URL=${EXISTING_URL}" \
  --project="$PROJECT_ID"

# ── Step 4: Update WORKER_URL dengan URL final ────────────────────────────────
echo "[4/4] Update WORKER_URL env var..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

gcloud run services update "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --update-env-vars="WORKER_URL=${SERVICE_URL}" \
  --quiet

echo ""
echo "=== Deploy selesai! ==="
echo ""
echo "Backend URL : $SERVICE_URL"
echo ""
echo "Salin URL ini ke:"
echo "  → frontend/.env.local  : NEXT_PUBLIC_API_BASE_URL=$SERVICE_URL"
echo "  → Firebase Hosting     : environment variable di deploy-firebase.sh"
