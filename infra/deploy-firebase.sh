#!/usr/bin/env bash
# deploy-firebase.sh — Deploy frontend Next.js ke Firebase Hosting
# Jalankan dari root repo: bash infra/deploy-firebase.sh
# Prasyarat: firebase CLI terinstall (npm install -g firebase-tools)
#            firebase login sudah dilakukan

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-}"

if [ -z "$API_BASE_URL" ]; then
  echo "ERROR: Set NEXT_PUBLIC_API_BASE_URL dulu."
  echo "Contoh: export NEXT_PUBLIC_API_BASE_URL=https://kawan-backend-xxx-as.a.run.app"
  exit 1
fi

echo "=== KawanUMKM Firebase Deploy ==="
echo "Project    : $PROJECT_ID"
echo "API URL    : $API_BASE_URL"
echo ""

# ── Build Next.js ─────────────────────────────────────────────────────────────
echo "[1/2] Build Next.js..."
cd "$(dirname "$0")/../frontend"
NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" npm run build
cd - > /dev/null

# ── Deploy ke Firebase Hosting ────────────────────────────────────────────────
echo "[2/2] Deploy ke Firebase Hosting..."
cd "$(dirname "$0")/../frontend"
firebase deploy --only hosting --project "$PROJECT_ID"
cd - > /dev/null

echo ""
echo "=== Frontend deploy selesai! ==="
