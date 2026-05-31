import { Storage } from "@google-cloud/storage";

const storage = new Storage({ projectId: process.env.GCP_PROJECT_ID });

const BUCKET = process.env.GCS_BUCKET_NAME ?? "kawan-uploads";

const bucket = () => storage.bucket(BUCKET);

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const [url] = await bucket().file(key).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + expiresIn * 1000,
    contentType,
  });
  return url;
}

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const [url] = await bucket().file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  });
  return url;
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await bucket().file(key).save(buffer, { contentType });
}

export async function downloadBuffer(
  key: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const file = bucket().file(key);
  const [downloadResult, metadataResult] = await Promise.all([
    file.download(),
    file.getMetadata(),
  ]);
  const [buffer] = downloadResult;
  const [metadata] = metadataResult;

  return {
    buffer,
    contentType: metadata.contentType ?? inferContentType(key),
  };
}

export function buildPhotoKey(jobId: string, fileName: string): string {
  const ext = fileName.split(".").pop() ?? "jpg";
  return `uploads/${jobId}/photo.${ext}`;
}

export function buildBannerKey(jobId: string, extension = "png"): string {
  return `results/${jobId}/banner.${extension}`;
}

function inferContentType(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}
