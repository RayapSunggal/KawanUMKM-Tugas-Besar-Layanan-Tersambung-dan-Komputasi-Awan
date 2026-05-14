# Struktur Repository — KAWAN Platform

```
kawan/
│
├── .github/
│   ├── workflows/
│   │   ├── ci-frontend.yml          # lint + build check setiap PR
│   │   └── deploy-frontend.yml      # auto-deploy ke Amplify saat push ke main
│   └── PULL_REQUEST_TEMPLATE.md     # template deskripsi PR
│
├── frontend/                         # Layer 1 — Presentation
│   ├── src/
│   │   ├── app/                      # Next.js 14 App Router
│   │   │   ├── page.tsx              # halaman utama — form input produk
│   │   │   ├── status/
│   │   │   │   └── [jobId]/
│   │   │   │       └── page.tsx      # halaman progress real-time (UC-04)
│   │   │   ├── result/
│   │   │   │   └── [jobId]/
│   │   │   │       └── page.tsx      # halaman hasil generation (UC-06, UC-07)
│   │   │   ├── history/
│   │   │   │   └── page.tsx          # halaman riwayat generasi (UC-05)
│   │   │   └── layout.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── form/                 # komponen halaman input
│   │   │   │   ├── ProductForm.tsx   # form utama (FR-01 s.d. FR-07)
│   │   │   │   ├── PhotoUpload.tsx   # drag & drop foto (UC-02)
│   │   │   │   └── VibeSelector.tsx  # pilih vibe Modern/Tradisional (FR-05)
│   │   │   │
│   │   │   ├── result/               # komponen halaman hasil
│   │   │   │   ├── CaptionCard.tsx   # tampil 3 varian caption (FR-08)
│   │   │   │   ├── HashtagList.tsx   # tampil 15 hashtag (FR-09)
│   │   │   │   ├── BannerPreview.tsx # preview banner (FR-10)
│   │   │   │   └── ScheduleCard.tsx  # saran jadwal posting (FR-11)
│   │   │   │
│   │   │   ├── shared/               # komponen reusable lintas halaman
│   │   │   │   ├── ProgressIndicator.tsx   # animasi loading (FR-13)
│   │   │   │   ├── CopyButton.tsx          # salin ke clipboard (UC-07, FR-17)
│   │   │   │   └── DownloadButton.tsx      # unduh banner PNG (UC-06, FR-16)
│   │   │   │
│   │   │   └── ui/                   # shadcn/ui components (button, input, dll)
│   │   │
│   │   ├── hooks/
│   │   │   ├── usePolling.ts         # polling status job setiap 2 detik (UC-04)
│   │   │   └── useHistory.ts         # fetch riwayat generasi (UC-05)
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                # fetch wrapper ke API Gateway
│   │   │   └── utils.ts              # helper umum
│   │   │
│   │   └── types/
│   │       └── index.ts              # type definitions frontend
│   │
│   ├── public/
│   ├── .env.local.example            # template env vars frontend
│   ├── amplify.yml                   # konfigurasi build Amplify
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                          # Layer 2, 3, 4 — API + Logic + AI Service
│   ├── src/
│   │   │
│   │   ├── handlers/                 # Layer 3 — Business Logic (Lambda functions)
│   │   │   ├── submit.ts             # POST /generate → validasi + enqueue (UC-01, UC-03)
│   │   │   ├── worker.ts             # SQS trigger → orchestrate AI (UC-09, UC-10)
│   │   │   ├── status.ts             # GET /status/{jobId} → cek progress (UC-04)
│   │   │   └── history.ts            # GET /history → list riwayat (UC-05)
│   │   │
│   │   ├── services/                 # Layer 4 — AI Service (abstraction layer)
│   │   │   ├── bedrock-text.ts       # wrapper Claude Haiku (FR-08, FR-09, FR-11)
│   │   │   └── bedrock-image.ts      # wrapper Titan Image Generator (FR-10)
│   │   │
│   │   ├── lib/                      # Layer 3 utilities
│   │   │   ├── s3.ts                 # upload file, generate presigned URL
│   │   │   ├── dynamodb.ts           # read/write job metadata (Layer 5)
│   │   │   ├── sqs.ts                # enqueue / delete message
│   │   │   ├── compose-banner.ts     # Sharp compositing foto + teks overlay
│   │   │   └── validate.ts           # Zod schemas — dipakai handler + frontend
│   │   │
│   │   ├── prompts/                  # prompt templates Bedrock (iterasi di sini)
│   │   │   ├── caption.ts            # template 3 varian caption Indonesia
│   │   │   ├── hashtag.ts            # template 15 hashtag strategis
│   │   │   ├── schedule.ts           # template saran jadwal posting
│   │   │   └── banner-image.ts       # template prompt visual per vibe
│   │   │
│   │   └── types/
│   │       └── index.ts              # type definitions backend
│   │
│   ├── .env.example                  # template env vars backend
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   ├── api-contract.md               # spesifikasi endpoint (request/response schema)
│   ├── architecture.md               # diagram arsitektur 5-layer
│   ├── use-cases.md                  # UC-01 s.d. UC-11 lengkap
│   ├── fr-nfr.md                     # FR-01 s.d. FR-20 dan NFR-01 s.d. NFR-20
│   └── weekly-reports/
│       ├── week-01.md
│       ├── week-02.md
│       ├── week-03.md
│       ├── week-04.md
│       ├── week-05.md
│       └── week-06.md
│
├── .gitignore
└── README.md
```

---

## Isi File Penting

### `.gitignore`
```
# dependencies
node_modules/
.pnp
.pnp.js

# environment variables — JANGAN PERNAH DI-COMMIT
.env
.env.local
.env.*.local

# next.js build
frontend/.next/
frontend/out/

# aws
.aws/

# misc
.DS_Store
*.pem
dist/
build/
```

---

### `frontend/.env.local.example`
```
NEXT_PUBLIC_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_S3_UPLOAD_BUCKET=kawan-uploads
```

---

### `backend/.env.example`
```
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=kawan-jobs
S3_BUCKET_NAME=kawan-uploads
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/xxxxxxxxxxxx/kawan-queue
BEDROCK_TEXT_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_IMAGE_MODEL_ID=amazon.titan-image-generator-v2:0
```

---

### `docs/api-contract.md` (skeleton)
```
# API Contract — KAWAN Platform

## POST /generate
Request  : multipart/form-data { photo, name, description, category, vibe, price? }
Response : { jobId: string, status: "queued" }

## GET /status/{jobId}
Response : { jobId, status: "queued"|"processing"|"completed"|"failed", progress: number }

## GET /history
Response : { jobs: [{ jobId, name, createdAt, status }] }

## GET /result/{jobId}
Response : { captions: string[], hashtags: string[], schedule: string,
             bannerUrl: string, contentIdeas: string[] }
```

---

### `docs/weekly-reports/week-01.md` (template)
```
# Laporan Progress — Minggu 1

## Target Minggu Ini
-

## Progress yang Diselesaikan
-

## Kendala yang Dihadapi
-

## Solusi / Next Step
-

## Pembagian Tugas
| Anggota | Tugas Minggu Ini | Status |
|---------|------------------|--------|
| Raynard | | |
| Moreno  | | |
| Richard | | |
```

---

## Konvensi Penamaan Branch

```
main              → production, hanya merge via PR
dev               → staging, base branch untuk semua PR

feat/submit-handler       → fitur baru
fix/banner-compositing    → bug fix
docs/api-contract         → update dokumentasi
refactor/bedrock-wrapper  → refactoring tanpa fitur baru
```

---

## Konvensi Commit Message

```
feat: tambah Lambda submit handler
fix: perbaiki error presigned URL S3
docs: update api-contract endpoint history
refactor: pisahkan bedrock-text dan bedrock-image
test: tambah unit test validate schema
```
