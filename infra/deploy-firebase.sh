#!/usr/bin/env bash
# deploy-firebase.sh — Deploy frontend Next.js ke Firebase Hosting
# Jalankan dari root repo: bash infra/deploy-firebase.sh
# Prasyarat:
#   1. npm install -g firebase-tools
#   2. firebase login
#   3. Isi PROJECT_ID di .firebaserc (ganti GANTI_DENGAN_PROJECT_ID_GCP)
#   4. Set NEXT_PUBLIC_API_BASE_URL ke URL Cloud Run backend

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-}"

if [ -z "$API_BASE_URL" ]; then
  echo "ERROR: NEXT_PUBLIC_API_BASE_URL belum di-set."
  echo ""
  echo "Cara set:"
  echo "  export NEXT_PUBLIC_API_BASE_URL=https://kawan-backend-xxx-as.a.run.app"
  echo ""
  echo "URL bisa dilihat dari output deploy-cloud-run.sh"
  exit 1
fi

# Cek .firebaserc sudah diisi
if grep -q "GANTI_DENGAN_PROJECT_ID_GCP" .firebaserc 2>/dev/null; then
  echo "ERROR: Isi dulu PROJECT_ID di .firebaserc"
  echo "  Ganti 'GANTI_DENGAN_PROJECT_ID_GCP' dengan project ID GCP teman kamu"
  exit 1
fi

echo "=== KawanUMKM Firebase Hosting Deploy ==="
echo "Project : $PROJECT_ID"
echo "API URL : $API_BASE_URL"
echo ""

# ── Enable Next.js framework support di Firebase ──────────────────────────────
export FIREBASE_CLI_EXPERIMENTS=webframeworks

# ── Deploy ke Firebase Hosting ────────────────────────────────────────────────
echo "[1/1] Deploy ke Firebase Hosting..."
NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" \
  firebase deploy --only hosting --project "$PROJECT_ID"

echo ""
echo "=== Frontend deploy selesai! ==="
echo "Cek hasilnya di: https://console.firebase.google.com/project/$PROJECT_ID/hosting"
