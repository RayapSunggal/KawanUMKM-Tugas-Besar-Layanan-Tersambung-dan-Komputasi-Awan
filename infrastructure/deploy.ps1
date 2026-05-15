# deploy.ps1 — Deploy KawanUMKM backend ke AWS
# Jalankan dari root repo: .\infrastructure\deploy.ps1
# Prasyarat: AWS CLI terinstall, aws configure sudah diisi (region us-east-1)

param(
    [string]$Stage = "prod",
    [string]$StackName = "kawan-stack"
)

$ErrorActionPreference = "Stop"
$Region = "us-east-1"

Write-Host "=== KawanUMKM Deploy ===" -ForegroundColor Cyan
Write-Host "Stage  : $Stage"
Write-Host "Stack  : $StackName"
Write-Host "Region : $Region"
Write-Host ""

# ── Step 1: Build TypeScript ──────────────────────────────────────────────────
Write-Host "[1/5] Build TypeScript..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\..\backend"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build gagal" }

# ── Step 2: ZIP dist/ ─────────────────────────────────────────────────────────
Write-Host "[2/5] Membuat ZIP artifact..." -ForegroundColor Yellow
$ZipPath = "$PSScriptRoot\kawan-backend.zip"
if (Test-Path $ZipPath) { Remove-Item $ZipPath }
Compress-Archive -Path "dist\*" -DestinationPath $ZipPath
Write-Host "  ZIP: $ZipPath"

# ── Step 3: Upload ZIP ke S3 ──────────────────────────────────────────────────
Write-Host "[3/5] Upload ZIP ke S3..." -ForegroundColor Yellow

# Gunakan bucket deploy terpisah (bukan bucket upload produk)
$AccountId = (aws sts get-caller-identity --query Account --output text)
$DeployBucket = "kawan-deploy-$AccountId"

# Buat bucket jika belum ada
$BucketExists = aws s3api head-bucket --bucket $DeployBucket 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Membuat deploy bucket: $DeployBucket"
    aws s3api create-bucket --bucket $DeployBucket --region $Region
    aws s3api put-bucket-versioning --bucket $DeployBucket --versioning-configuration Status=Enabled
}

aws s3 cp $ZipPath "s3://$DeployBucket/kawan-backend.zip"
if ($LASTEXITCODE -ne 0) { throw "Upload ZIP gagal" }
Write-Host "  Upload selesai: s3://$DeployBucket/kawan-backend.zip"

# ── Step 4: Deploy CloudFormation stack ──────────────────────────────────────
Write-Host "[4/5] Deploy CloudFormation stack..." -ForegroundColor Yellow
$TemplateFile = "$PSScriptRoot\template.yaml"

aws cloudformation deploy `
    --template-file $TemplateFile `
    --stack-name $StackName `
    --parameter-overrides Stage=$Stage LambdaCodeBucket=$DeployBucket `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) { throw "CloudFormation deploy gagal" }

# ── Step 5: Tampilkan Outputs ─────────────────────────────────────────────────
Write-Host "[5/5] Stack Outputs:" -ForegroundColor Yellow
aws cloudformation describe-stacks `
    --stack-name $StackName `
    --query "Stacks[0].Outputs" `
    --output table `
    --region $Region

Write-Host ""
Write-Host "=== Deploy selesai! ===" -ForegroundColor Green
Write-Host "Salin nilai ApiBaseUrl ke environment variable NEXT_PUBLIC_API_BASE_URL di Amplify."
