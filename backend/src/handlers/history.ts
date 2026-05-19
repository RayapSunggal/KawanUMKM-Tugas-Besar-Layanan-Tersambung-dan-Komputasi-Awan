import { listJobsBySession } from "../lib/firestore.js";
import { ok, badRequest, serverError } from "../lib/response.js";
import { GcpEvent } from "../lib/adapter.js";
import { HistoryResponse, HistoryItem, ApiResponse } from "../types/index.js";

/**
 * GET /history
 *
 * Mengambil daftar riwayat generasi berdasarkan sessionId
 * yang dikirim sebagai query string (?sessionId=xxx).
 *
 * UC-05 | FR-15
 */
export async function handler(event: GcpEvent): Promise<ApiResponse> {
  const sessionId = event.queryStringParameters?.sessionId;

  if (!sessionId) {
    return badRequest("Query parameter 'sessionId' wajib disertakan");
  }

  let jobs;
  try {
    jobs = await listJobsBySession(sessionId);
  } catch (err) {
    console.error("Firestore listJobsBySession gagal", err);
    return serverError("Gagal mengambil riwayat generasi");
  }

  const items: HistoryItem[] = jobs.map((job) => ({
    jobId: job.jobId,
    productName: job.productName,
    createdAt: job.createdAt,
    status: job.status,
  }));

  const response: HistoryResponse = { jobs: items };
  return ok(response);
}
