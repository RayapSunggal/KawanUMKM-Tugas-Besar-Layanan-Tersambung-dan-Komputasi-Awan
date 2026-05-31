# API Contract - KawanUMKM

Base URL production berasal dari service Cloud Run backend:

```text
https://<cloud-run-service-url>
```

Frontend membaca base URL melalui environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=<cloud-run-service-url>
```

Semua response error mengikuti format:

```json
{
  "error": "Pesan error dalam Bahasa Indonesia",
  "details": {}
}
```

## GET /upload-url

Menghasilkan signed URL Cloud Storage agar frontend dapat mengunggah foto produk langsung dari browser.

### Query Parameters

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `fileName` | string | Ya | Nama file asli |
| `contentType` | string | Ya | `image/jpeg`, `image/jpg`, atau `image/png` |
| `fileSizeBytes` | number | Ya | Ukuran file dalam bytes, maksimal 5 MB |

### Response 200

```json
{
  "uploadUrl": "https://storage.googleapis.com/...",
  "photoKey": "uploads/550e8400-xxxx/photo.jpg"
}
```

### Response 400

```json
{
  "error": "Ukuran file maksimal 5MB"
}
```

## POST /generate

Menerima metadata produk, membuat dokumen job di Firestore, lalu membuat Cloud Task agar worker memproses generate secara asynchronous.

### Request

```json
{
  "sessionId": "string",
  "productName": "Keripik Pisang Lumer",
  "description": "Keripik pisang renyah dengan topping cokelat lumer",
  "category": "kuliner",
  "vibe": "Modern",
  "price": "25000",
  "photoKey": "uploads/550e8400-xxxx/photo.jpg"
}
```

Validasi utama:
- `sessionId` wajib diisi.
- `productName` wajib diisi, maksimal 50 karakter.
- `description` minimal 10 karakter dan maksimal 500 karakter.
- `category` harus salah satu dari `kuliner`, `fashion`, `kerajinan`, `jasa`, atau `lainnya`.
- `vibe` harus `Modern` atau `Tradisional`.
- `photoKey` wajib diisi dan berasal dari response `/upload-url`.

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

## GET /status/:jobId

Mengambil status dan progress job berdasarkan `jobId`. Frontend menggunakan endpoint ini untuk polling.

### Query Parameters

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `sessionId` | string | Ya | ID sesi pengguna |

### Response 200

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 55
}
```

Nilai `status`:
- `queued`
- `processing`
- `completed`
- `failed`

### Response 404

```json
{
  "error": "Job dengan ID 550e8400-e29b-41d4-a716-446655440000 tidak ditemukan"
}
```

## GET /result/:jobId

Mengambil hasil generate. Endpoint ini dapat mengembalikan hasil parsial saat teks sudah selesai tetapi banner masih diproses.

### Query Parameters

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `sessionId` | string | Ya | ID sesi pengguna |

### Response 200

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "captions": [
    { "length": "pendek", "text": "..." },
    { "length": "sedang", "text": "..." },
    { "length": "panjang", "text": "..." }
  ],
  "hashtags": [
    "#KeripikPisang",
    "#CemilanEnak"
  ],
  "schedule": {
    "day": "Jumat",
    "time": "19:00 WIB",
    "reason": "Jam ramai audiens kuliner"
  },
  "contentIdeas": [
    "Ide konten story",
    "Ide konten carousel",
    "Ide konten reels"
  ],
  "bannerUrl": "https://storage.googleapis.com/...",
  "assetErrors": {
    "captionFailed": false,
    "bannerFailed": false
  }
}
```

### Response 404

```json
{
  "error": "Hasil generasi belum tersedia"
}
```

## GET /history

Mengambil daftar riwayat generate berdasarkan `sessionId`.

### Query Parameters

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `sessionId` | string | Ya | ID sesi pengguna |

### Response 200

```json
{
  "jobs": [
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "productName": "Keripik Pisang Lumer",
      "createdAt": "2026-05-15T10:30:00.000Z",
      "status": "completed"
    }
  ]
}
```

## POST /worker

Endpoint internal yang dipanggil Cloud Tasks untuk memproses job.

### Request

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "session-123",
  "productName": "Keripik Pisang Lumer",
  "description": "Keripik pisang renyah dengan topping cokelat lumer",
  "category": "kuliner",
  "vibe": "Modern",
  "price": "25000",
  "photoKey": "uploads/550e8400-xxxx/photo.jpg"
}
```

### Response 200

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

## GET /health

Health check untuk Cloud Run.

### Response 200

```json
{
  "status": "ok"
}
```

## Firestore Schema

Collection default: `kawan-jobs`

| Field | Tipe | Keterangan |
|---|---|---|
| `jobId` | string | ID job, sama dengan document ID |
| `sessionId` | string | ID sesi pengguna |
| `status` | string | `queued`, `processing`, `completed`, atau `failed` |
| `progress` | number | Progress job 0 sampai 100 |
| `createdAt` | string | ISO timestamp saat job dibuat |
| `updatedAt` | string | ISO timestamp saat job terakhir diubah |
| `productName` | string | Nama produk |
| `description` | string | Deskripsi produk |
| `category` | string | Kategori produk |
| `vibe` | string | Style marketing |
| `price` | string | Harga opsional |
| `photoKey` | string | Object key foto di Cloud Storage |
| `result` | map | Hasil generate |
| `assetErrors` | map | Status error parsial aset |
| `errorMessage` | string | Pesan error jika job gagal |

Index yang digunakan untuk riwayat:
- `sessionId` ascending
- `createdAt` descending

## Cloud Storage Object Path

Foto produk:

```text
uploads/{jobId}/photo.{ext}
```

Banner hasil generate:

```text
results/{jobId}/banner.{ext}
```
