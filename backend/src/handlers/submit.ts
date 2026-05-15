import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { submitJobSchema } from "../lib/validate.js";
import { putJob } from "../lib/dynamodb.js";
import { enqueueJob } from "../lib/sqs.js";
import { ok, badRequest, serverError } from "../lib/response.js";
import { Job, SqsJobMessage } from "../types/index.js";

/**
 * POST /generate
 *
 * Menerima metadata produk + photoKey (S3 key dari presigned upload),
 * membuat job baru di DynamoDB dengan status "queued",
 * lalu meng-enqueue pesan ke SQS agar Worker memprosesnya.
 *
 * UC-01, UC-03 | FR-03–FR-07 | NFR-02
 */
export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  console.log("submit.handler invoked", { requestId: _context.awsRequestId });

  // ── Parse Body ────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Body harus berupa JSON yang valid");
  }

  // ── Validasi Input (FR-07) ────────────────────────────────────────────────
  const parsed = submitJobSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validasi input gagal", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const jobId = uuidv4();
  const now = new Date().toISOString();

  // ── Simpan Job ke DynamoDB (status: queued) ───────────────────────────────
  const job: Job = {
    jobId,
    sessionId: input.sessionId,
    status: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
    productName: input.productName,
    description: input.description,
    category: input.category,
    vibe: input.vibe,
    price: input.price,
    photoKey: input.photoKey,
  };

  try {
    await putJob(job);
  } catch (err) {
    console.error("DynamoDB putJob gagal", err);
    return serverError("Gagal menyimpan job ke database");
  }

  // ── Enqueue ke SQS (FR-19, NFR-19) ───────────────────────────────────────
  const message: SqsJobMessage = {
    jobId,
    sessionId: input.sessionId,
    productName: input.productName,
    description: input.description,
    category: input.category,
    vibe: input.vibe,
    price: input.price,
    photoKey: input.photoKey,
  };

  try {
    await enqueueJob(message);
  } catch (err) {
    console.error("SQS enqueueJob gagal", err);
    // Job sudah tersimpan di DynamoDB — kembalikan error agar frontend retry
    return serverError("Gagal mengantre job untuk diproses");
  }

  console.log("Job berhasil dibuat dan dienqueue", { jobId });

  return ok({ jobId, status: "queued" });
}
