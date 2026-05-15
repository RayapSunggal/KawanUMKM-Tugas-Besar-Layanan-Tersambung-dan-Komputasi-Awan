# API Contract — KAWAN Platform

Base URL: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod`

---

## POST /generate

Menerima metadata produk, membuat job baru, dan meng-enqueue ke SQS.

### Request
```json
Content-Type: application/json

{
  "sessionId": "string (required)",
  "productName": "string, 1–50 karakter (required)",
  "description": "string, 10–500 karakter (required)",
  "category": "kuliner | fashion | kerajinan | jasa | lainnya (required)",
  "vibe": "Modern | Tradisional (required)",
  "price": "string (optional)",
  "photoKey": "string — S3 key dari presigned upload (required)"
}
```

### Response 200
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued"
}
```

### Response 400
```json
{
  "error": "Validasi input gagal",
  "details": {
    "productName": ["Nama produk wajib diisi"],
    "category": ["Kategori tidak valid"]
  }
}
```

---

## GET /status/{jobId}

Query status dan progress job yang sedang berjalan.
Frontend melakukan polling setiap 2 detik.

### Response 200
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued | processing | completed | failed",
  "progress": 0
}
```
`progress` adalah integer 0–100.

### Response 404
```json
{ "error": "Job dengan ID xxx tidak ditemukan" }
```

---

## GET /result/{jobId}

Mengambil hasil generasi lengkap. Hanya tersedia bila `status = "completed"`.

### Response 200
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "captions": [
    { "length": "panjang", "text": "..." },
    { "length": "sedang",  "text": "..." },
    { "length": "pendek",  "text": "..." }
  ],
  "hashtags": [
    "#KeripikPisang", "#CemilanEnak", "..."
  ],
  "schedule": {
    "day": "Jumat",
    "time": "19:00 WIB",
    "reason": "Jam ramai audiens kuliner"
  },
  "contentIdeas": [
    "Idea konten 1",
    "Idea konten 2",
    "Idea konten 3"
  ],
  "bannerUrl": "https://kawan-uploads.s3.amazonaws.com/results/xxx/banner.png?..."
}
```

### Response 404
```json
{ "error": "Hasil generasi belum tersedia" }
```

---

## GET /history

Mengambil daftar riwayat generasi berdasarkan sesi pengguna.

### Query Parameters
| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `sessionId` | string | Ya | ID sesi pengguna |

### Response 200
```json
{
  "jobs": [
    {
      "jobId": "550e8400-...",
      "productName": "Keripik Pisang Lumer",
      "createdAt": "2026-05-15T10:30:00.000Z",
      "status": "completed"
    }
  ]
}
```

---

## GET /upload-url

Mendapatkan presigned URL untuk upload foto produk langsung ke S3.

### Query Parameters
| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `fileName` | string | Ya | Nama file asli |
| `contentType` | string | Ya | `image/jpeg`, `image/jpg`, atau `image/png` |
| `fileSizeBytes` | number | Ya | Ukuran file dalam bytes (maks 5.242.880 = 5MB) |

### Response 200
```json
{
  "uploadUrl": "https://kawan-uploads.s3.amazonaws.com/uploads/xxx/photo.jpg?X-Amz-...",
  "photoKey": "uploads/550e8400-xxx/photo.jpg"
}
```

### Response 400
```json
{ "error": "Ukuran file maksimal 5MB" }
```

---

## Konvensi Error

Semua error mengikuti format:
```json
{ "error": "Pesan error dalam Bahasa Indonesia", "details": {} }
```

| Status Code | Arti |
|---|---|
| 400 | Validasi input gagal |
| 404 | Resource tidak ditemukan |
| 500 | Internal server error |

---

## DynamoDB Schema — Tabel `kawan-jobs`

| Atribut | Tipe | Keterangan |
|---|---|---|
| `jobId` | String (PK) | UUID v4 |
| `sessionId` | String (GSI PK) | ID sesi pengguna |
| `status` | String | `queued \| processing \| completed \| failed` |
| `progress` | Number | 0–100 |
| `createdAt` | String (GSI SK) | ISO 8601 |
| `updatedAt` | String | ISO 8601 |
| `productName` | String | Nama produk |
| `description` | String | Deskripsi produk |
| `category` | String | Kategori produk |
| `vibe` | String | `Modern \| Tradisional` |
| `price` | String | Harga (opsional) |
| `photoKey` | String | S3 object key foto upload |
| `result` | Map | Hasil generasi (setelah completed) |
| `errorMessage` | String | Pesan error (setelah failed) |
| `assetErrors` | Map | `{ captionFailed?, bannerFailed? }` |

**GSI:** `sessionId-createdAt-index` — untuk query history per sesi.
