import { getJob } from "../lib/firestore.js";
import { ok, badRequest, notFound, serverError } from "../lib/response.js";
import { GcpEvent } from "../lib/adapter.js";
import { StatusResponse, ApiResponse } from "../types/index.js";

/**
 * GET /status/{jobId}
 *
 * Query Firestore by jobId, kembalikan status + progress.
 * Frontend melakukan polling setiap 2 detik di halaman progress.
 *
 * UC-04 | FR-13 | NFR-02
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
    return serverError("Gagal mengambil status job");
  }

  if (!job) {
    return notFound(`Job dengan ID ${jobId} tidak ditemukan`);
  }

  if (job.sessionId !== sessionId) {
    return notFound(`Job dengan ID ${jobId} tidak ditemukan`);
  }

  const response: StatusResponse = {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
  };

  return ok(response);
}
