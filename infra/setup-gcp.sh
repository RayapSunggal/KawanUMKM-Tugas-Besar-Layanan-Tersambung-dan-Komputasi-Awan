#!/usr/bin/env bash
# setup-gcp.sh — Jalankan SEKALI untuk inisialisasi semua GCP resources
# Prasyarat: gcloud CLI terinstall & sudah login (gcloud auth login)
# Cara pakai: bash infra/setup-gcp.sh

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-asia-southeast2}"
BUCKET_NAME="kawan-uploads-${PROJECT_ID}"

echo "=== KawanUMKM GCP Setup ==="
echo "Project : $PROJECT_ID"
echo "Region  : $REGION"
echo ""

# ── Enable APIs ───────────────────────────────────────────────────────────────
echo "[1/6] Enable GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudtasks.googleapis.com \
  cloudbuild.googleapis.com \
  aiplatform.googleapis.com \
  --project="$PROJECT_ID"

# ── Firestore ─────────────────────────────────────────────────────────────────
echo "[2/6] Setup Firestore..."
gcloud firestore databases create \
  --location="$REGION" \
  --type=firestore-native \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (Firestore sudah ada, skip)"

# Index untuk query history: sessionId ASC + createdAt DESC
gcloud firestore indexes composite create \
  --collection-group=kawan-jobs \
  --field-config field-path=sessionId,order=ascending \
  --field-config field-path=createdAt,order=descending \
  --database="(default)" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (Index sudah ada, skip)"

echo "  Firestore siap."

# ── Cloud Storage ─────────────────────────────────────────────────────────────
echo "[3/6] Setup Cloud Storage bucket: $BUCKET_NAME..."
gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$BUCKET_NAME" 2>/dev/null || \
  echo "  (Bucket sudah ada, skip)"

# CORS agar frontend bisa upload langsung dari browser
cat > /tmp/cors.json <<'EOF'
[{
  "origin": ["*"],
  "method": ["GET", "PUT", "POST"],
  "responseHeader": ["Content-Type"],
  "maxAgeSeconds": 3000
}]
EOF
gsutil cors set /tmp/cors.json "gs://$BUCKET_NAME"

# Lifecycle: auto-delete upload setelah 30 hari
cat > /tmp/lifecycle.json <<'EOF'
{
  "rule": [{
    "action": { "type": "Delete" },
    "condition": { "age": 30, "matchesPrefix": ["uploads/"] }
  }]
}
EOF
gsutil lifecycle set /tmp/lifecycle.json "gs://$BUCKET_NAME"
echo "  Bucket siap: gs://$BUCKET_NAME"

# ── Cloud Tasks queue ─────────────────────────────────────────────────────────
echo "[4/6] Setup Cloud Tasks queue..."
gcloud tasks queues create kawan-jobs \
  --location="$REGION" \
  --max-attempts=3 \
  --min-backoff=10s \
  --max-backoff=300s \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (Queue sudah ada, skip)"

# Dead-letter queue
gcloud tasks queues create kawan-jobs-dlq \
  --location="$REGION" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (DLQ sudah ada, skip)"

echo "  Cloud Tasks queue siap."

# ── Service Account untuk Cloud Run ──────────────────────────────────────────
echo "[5/6] Setup Service Account..."
SA_NAME="kawan-backend-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create "$SA_NAME" \
  --display-name="KawanUMKM Backend" \
  --project="$PROJECT_ID" 2>/dev/null || echo "  (SA sudah ada, skip)"

for ROLE in \
  roles/datastore.user \
  roles/storage.objectAdmin \
  roles/cloudtasks.enqueuer \
  roles/aiplatform.user; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" --quiet
done
echo "  Service Account: $SA_EMAIL"

# ── Firestore Security Rules ──────────────────────────────────────────────────
echo "[6/7] Deploy Firestore security rules..."
RULES_FILE="$(dirname "$0")/../firestore.rules"
if [ -f "$RULES_FILE" ]; then
  gcloud firestore databases patch "(default)" \
    --location="$REGION" \
    --project="$PROJECT_ID" 2>/dev/null || true

  # Deploy rules via Firebase CLI (lebih reliable dari gcloud untuk rules)
  if command -v firebase &>/dev/null; then
    firebase deploy --only firestore:rules \
      --project "$PROJECT_ID" 2>/dev/null && \
      echo "  Security rules ter-deploy via Firebase CLI." || \
      echo "  Gagal deploy rules — jalankan manual: firebase deploy --only firestore:rules"
  else
    echo "  Firebase CLI tidak ditemukan."
    echo "  Install: npm install -g firebase-tools"
    echo "  Lalu jalankan manual: firebase deploy --only firestore:rules --project $PROJECT_ID"
  fi
else
  echo "  firestore.rules tidak ditemukan, skip."
fi

echo ""
echo "[7/7] Setup selesai!"
echo "Jalankan berikutnya: bash infra/deploy-cloud-run.sh"
echo "BUCKET_NAME=$BUCKET_NAME"
