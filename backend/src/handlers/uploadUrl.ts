import { v4 as uuidv4 } from "uuid";
import { signedUrlSchema } from "../lib/validate.js";
import { getSignedUploadUrl, buildPhotoKey } from "../lib/storage.js";
import { ok, badRequest, serverError } from "../lib/response.js";
import { GcpEvent } from "../lib/adapter.js";
import { ApiResponse } from "../types/index.js";

/**
 * GET /upload-url
 *
 * Menghasilkan Cloud Storage signed PUT URL agar frontend bisa upload foto
 * langsung ke GCS tanpa melewati Cloud Function.
 * Setelah upload selesai, frontend menyertakan photoKey ke POST /generate.
 *
 * FR-01 | NFR-09
 */
export async function handler(event: GcpEvent): Promise<ApiResponse> {
  const qs = event.queryStringParameters ?? {};

  const parsed = signedUrlSchema.safeParse({
    fileName: qs.fileName,
    contentType: qs.contentType,
    fileSizeBytes: qs.fileSizeBytes ? Number(qs.fileSizeBytes) : undefined,
  });

  if (!parsed.success) {
    return badRequest("Validasi parameter gagal", parsed.error.flatten().fieldErrors);
  }

  const { fileName, contentType } = parsed.data;
  const jobId = uuidv4();
  const photoKey = buildPhotoKey(jobId, fileName);

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUploadUrl(photoKey, contentType);
  } catch (err) {
    console.error("Gagal generate signed URL", err);
    return serverError("Gagal membuat URL upload");
  }

  return ok({ uploadUrl, photoKey });
}
