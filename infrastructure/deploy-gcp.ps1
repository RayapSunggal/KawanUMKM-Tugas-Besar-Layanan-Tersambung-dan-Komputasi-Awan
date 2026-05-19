# deploy-gcp.ps1 — Deploy KawanUMKM backend ke Google Cloud Platform
# Jalankan dari root repo: .\infrastructure\deploy-gcp.ps1
# Prasyarat: gcloud CLI terinstall & sudah login (gcloud auth login)

param(
    [string]$ProjectId = $env:GCP_PROJECT_ID,
    [string]$Region    = "asia-southeast2"  # Jakarta
)

$ErrorActionPreference = "Stop"

if (-not $ProjectId) {
    $ProjectId = (gcloud config get-value project 2>$null)
    if (-not $ProjectId) { throw "Set GCP_PROJECT_ID atau jalankan: gcloud config set project <id>" }
}

Write-Host "=== KawanUMKM GCP Deploy ===" -ForegroundColor Cyan
Write-Host "Project : $ProjectId"
Write-Host "Region  : $Region"
Write-Host ""

# ── Step 1: Set project aktif ─────────────────────────────────────────────────
gcloud config set project $ProjectId

# ── Step 2: Enable APIs yang dibutuhkan ───────────────────────────────────────
Write-Host "[1/7] Enable GCP APIs..." -ForegroundColor Yellow
gcloud services enable `
    cloudfunctions.googleapis.com `
    firestore.googleapis.com `
    pubsub.googleapis.com `
    storage.googleapis.com `
    cloudbuild.googleapis.com `
    run.googleapis.com `
    aiplatform.googleapis.com

# ── Step 3: Build TypeScript ──────────────────────────────────────────────────
Write-Host "[2/7] Build TypeScript..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
npm install
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build TypeScript gagal" }

# ── Step 4: Setup Firestore ───────────────────────────────────────────────────
Write-Host "[3/7] Setup Firestore..." -ForegroundColor Yellow
# Buat database Firestore (mode native, gratis)
gcloud firestore databases create --location=$Region --type=firestore-native 2>$null
# Buat index untuk query history by sessionId + createdAt
gcloud firestore indexes composite create `
    --collection-group=kawan-jobs `
    --field-config field-path=sessionId,order=ascending `
    --field-config field-path=createdAt,order=descending `
    --database="(default)" 2>$null
Write-Host "  Firestore siap."

# ── Step 5: Setup Cloud Storage bucket ───────────────────────────────────────
Write-Host "[4/7] Setup Cloud Storage..." -ForegroundColor Yellow
$BucketName = "kawan-uploads-$ProjectId"
gsutil mb -p $ProjectId -c STANDARD -l $Region "gs://$BucketName" 2>$null
# CORS agar frontend bisa upload langsung
$CorsConfig = '[{"origin":["*"],"method":["GET","PUT","POST"],"maxAgeSeconds":3000}]'
$CorsFile = "$env:TEMP\cors.json"
$CorsConfig | Out-File -FilePath $CorsFile -Encoding utf8
gsutil cors set $CorsFile "gs://$BucketName"
# Lifecycle: hapus file upload setelah 30 hari
$LifecycleConfig = '{"rule":[{"action":{"type":"Delete"},"condition":{"age":30,"matchesPrefix":["uploads/"]}}]}'
$LifecycleFile = "$env:TEMP\lifecycle.json"
$LifecycleConfig | Out-File -FilePath $LifecycleFile -Encoding utf8
gsutil lifecycle set $LifecycleFile "gs://$BucketName"
Write-Host "  Bucket: gs://$BucketName"

# ── Step 6: Setup Pub/Sub topic + subscription ────────────────────────────────
Write-Host "[5/7] Setup Pub/Sub..." -ForegroundColor Yellow
gcloud pubsub topics create kawan-jobs 2>$null
# Dead letter topic (pengganti SQS DLQ)
gcloud pubsub topics create kawan-jobs-dlq 2>$null
# Subscription push ke worker Cloud Function
gcloud pubsub subscriptions create kawan-jobs-sub `
    --topic=kawan-jobs `
    --dead-letter-topic=kawan-jobs-dlq `
    --max-delivery-attempts=3 `
    --ack-deadline=120 2>$null
Write-Host "  Pub/Sub topic + subscription siap."

# ── Step 7: Deploy Cloud Functions ───────────────────────────────────────────
Write-Host "[6/7] Deploy Cloud Functions..." -ForegroundColor Yellow

$EnvVars = "GCP_PROJECT_ID=$ProjectId,GCS_BUCKET_NAME=$BucketName,FIRESTORE_COLLECTION=kawan-jobs,PUBSUB_TOPIC=kawan-jobs,PUBSUB_SUBSCRIPTION=kawan-jobs-sub"

$CommonArgs = @(
    "--region=$Region",
    "--runtime=nodejs20",
    "--source=dist",
    "--set-env-vars=$EnvVars",
    "--gen2",
    "--allow-unauthenticated"
)

# HTTP Functions
foreach ($fn in @(
    @{ name="submit";    entry="submit";    trigger="--trigger-http"; memory="256Mi"; timeout="30s" },
    @{ name="status";    entry="status";    trigger="--trigger-http"; memory="128Mi"; timeout="10s" },
    @{ name="history";   entry="history";   trigger="--trigger-http"; memory="128Mi"; timeout="10s" },
    @{ name="result";    entry="result";    trigger="--trigger-http"; memory="128Mi"; timeout="10s" },
    @{ name="uploadUrl"; entry="uploadUrl"; trigger="--trigger-http"; memory="128Mi"; timeout="10s" }
)) {
    Write-Host "  Deploy $($fn.name)..."
    gcloud functions deploy "kawan-$($fn.name)" `
        --entry-point=$($fn.entry) `
        $($fn.trigger) `
        --memory=$($fn.memory) `
        --timeout=$($fn.timeout) `
        @CommonArgs
}

# Pub/Sub Worker
Write-Host "  Deploy worker..."
gcloud functions deploy kawan-worker `
    --entry-point=worker `
    --trigger-topic=kawan-jobs `
    --memory=512Mi `
    --timeout=60s `
    @CommonArgs

# ── Step 8: Tampilkan URL Functions ──────────────────────────────────────────
Write-Host "[7/7] Endpoint yang sudah live:" -ForegroundColor Yellow
foreach ($fn in @("kawan-submit","kawan-status","kawan-history","kawan-result","kawan-uploadUrl")) {
    $url = (gcloud functions describe $fn --region=$Region --format="value(serviceConfig.uri)" 2>$null)
    if ($url) { Write-Host "  $fn : $url" }
}

Write-Host ""
Write-Host "=== Deploy GCP selesai! ===" -ForegroundColor Green
Write-Host "Salin URL kawan-submit sebagai NEXT_PUBLIC_API_BASE_URL di Vercel."
Write-Host "Ganti path /generate, /status, /history, /result sesuai nama function di atas."
