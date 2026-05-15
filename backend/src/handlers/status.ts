import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { getJob } from "../lib/dynamodb.js";
import { ok, badRequest, notFound, serverError } from "../lib/response.js";
import { StatusResponse } from "../types/index.js";

/**
 * GET /status/{jobId}
 *
 * Query DynamoDB by jobId, kembalikan status + progress.
 * Frontend melakukan polling setiap 2 detik di halaman progress.
 *
 * UC-04 | FR-13 | NFR-02
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
    return serverError("Gagal mengambil status job");
  }

  if (!job) {
    return notFound(`Job dengan ID ${jobId} tidak ditemukan`);
  }

  const response: StatusResponse = {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
  };

  return ok(response);
}
