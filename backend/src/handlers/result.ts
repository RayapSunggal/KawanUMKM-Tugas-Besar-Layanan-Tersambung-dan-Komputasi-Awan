import { getJob } from "../lib/firestore.js";
import { getPresignedDownloadUrl } from "../lib/storage.js";
import { ok, badRequest, notFound, serverError } from "../lib/response.js";
import { GcpEvent } from "../lib/adapter.js";
import { ResultResponse, ApiResponse } from "../types/index.js";

/**
 * GET /result/{jobId}
 *
 * Mengembalikan hasil generasi: captions, hashtags, jadwal,
 * ide konten, dan signed URL banner dari Cloud Storage.
 * Tersedia begitu text generation selesai. Banner bisa menyusul saat
 * status job masih "processing".
 *
 * UC-06 | FR-16, FR-17
 */
export async function handler(event: GcpEvent): Promise<ApiResponse> {
  const jobId = event.pathParameters?.jobId;
  const sessionId = event.queryStringParameters?.sessionId;

  if (!jobId) {
    return badRequest("jobId wajib disertakan di path");
  }

  if (!sessionId) {
    return badRequest("Query parameter 'sessionId' wajib disertakan");
  }

  let job;
  try {
    job = await getJob(jobId);
  } catch (err) {
    console.error("Firestore getJob gagal", err);
    return serverError("Gagal mengambil hasil generasi");
  }

  if (!job) {
    return notFound(`Job dengan ID ${jobId} tidak ditemukan`);
  }

  if (job.sessionId !== sessionId) {
    return notFound(`Job dengan ID ${jobId} tidak ditemukan`);
  }

  if (!job.result) {
    return notFound("Hasil generasi belum tersedia");
  }

  let bannerUrl: string | undefined;
  if (job.result.bannerUrl) {
    try {
      bannerUrl = await getPresignedDownloadUrl(job.result.bannerUrl);
    } catch (err) {
      console.warn("Gagal membuat signed URL banner", err);
    }
  }

  const response: ResultResponse = {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    captions: job.result.captions,
    hashtags: job.result.hashtags,
    schedule: job.result.schedule,
    contentIdeas: job.result.contentIdeas,
    bannerUrl,
    assetErrors: job.assetErrors,
  };

  return ok(response);
}
