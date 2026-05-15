import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { presignedUrlSchema } from "../lib/validate.js";
import { getPresignedUploadUrl, buildPhotoKey } from "../lib/s3.js";
import { ok, badRequest, serverError } from "../lib/response.js";

/**
 * GET /upload-url
 *
 * Menghasilkan S3 presigned PUT URL agar frontend bisa upload foto
 * langsung ke S3 tanpa melewati Lambda (bypass untuk file besar).
 * Setelah upload selesai, frontend menyertakan photoKey ke POST /generate.
 *
 * FR-01 | NFR-09
 */
export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  const qs = event.queryStringParameters ?? {};

  const parsed = presignedUrlSchema.safeParse({
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
    uploadUrl = await getPresignedUploadUrl(photoKey, contentType);
  } catch (err) {
    console.error("Gagal generate presigned URL", err);
    return serverError("Gagal membuat URL upload");
  }

  return ok({ uploadUrl, photoKey });
}
