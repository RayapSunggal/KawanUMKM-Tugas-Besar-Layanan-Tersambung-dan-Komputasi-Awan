import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-1" });

const BUCKET = process.env.S3_BUCKET_NAME ?? "kawan-uploads";

// ─── Presigned Upload URL (FR-01, NFR-09) ─────────────────────────────────────
// Frontend upload langsung ke S3, bypass Lambda untuk file besar

export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

// ─── Presigned Download URL (FR-16) ───────────────────────────────────────────

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

// ─── Upload Buffer (dipakai Worker untuk simpan banner hasil kompositing) ──────

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
}

// ─── Build S3 Key Helpers ─────────────────────────────────────────────────────

export function buildPhotoKey(jobId: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "jpg";
  return `uploads/${jobId}/photo.${ext}`;
}

export function buildBannerKey(jobId: string): string {
  return `results/${jobId}/banner.png`;
}
