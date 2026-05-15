import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { getJob } from "../lib/dynamodb.js";
import { getPresignedDownloadUrl } from "../lib/s3.js";
import { ok, badRequest, notFound, serverError } from "../lib/response.js";
import { ResultResponse } from "../types/index.js";

/**
 * GET /result/{jobId}
 *
 * Mengembalikan hasil generasi lengkap: captions, hashtags, jadwal,
 * ide konten, dan presigned URL banner S3.
 * Hanya tersedia bila status job = "completed".
 *
 * UC-06 | FR-16, FR-17
 */
export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  const jobId = event.pathParameters?.jobId;

  if (!jobId) {
    return badRequest("jobId wajib disertakan di path");
  }

  let job;
  try {
    job = await getJob(jobId);
  } catch (err) {
    console.error("DynamoDB getJob gagal", err);
    return serverError("Gagal mengambil hasil generasi");
  }

  if (!job) {
    return notFound(`Job dengan ID ${jobId} tidak ditemukan`);
  }

  if (job.status !== "completed" || !job.result) {
    return notFound("Hasil generasi belum tersedia");
  }

  // Buat presigned URL segar untuk banner (berlaku 1 jam)
  let bannerUrl: string | undefined;
  if (job.result.bannerUrl) {
    try {
      // bannerUrl di DynamoDB menyimpan S3 key, bukan URL penuh
      bannerUrl = await getPresignedDownloadUrl(job.result.bannerUrl);
    } catch (err) {
      console.warn("Gagal membuat presigned URL banner", err);
      // Banner gagal tidak fatal — kembalikan hasil teks tetap ada
    }
  }

  const response: ResultResponse = {
    jobId: job.jobId,
    captions: job.result.captions,
    hashtags: job.result.hashtags,
    schedule: job.result.schedule,
    contentIdeas: job.result.contentIdeas,
    bannerUrl,
  };

  return ok(response);
}
