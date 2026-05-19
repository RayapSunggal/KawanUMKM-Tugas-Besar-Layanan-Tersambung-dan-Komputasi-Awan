import { v4 as uuidv4 } from "uuid";
import { submitJobSchema } from "../lib/validate.js";
import { putJob } from "../lib/firestore.js";
import { enqueueJob } from "../lib/tasks.js";
import { ok, badRequest, serverError } from "../lib/response.js";
import { GcpEvent } from "../lib/adapter.js";
import { Job, SqsJobMessage, ApiResponse } from "../types/index.js";

/**
 * POST /generate
 *
 * Menerima metadata produk + photoKey (GCS key dari signed upload),
 * membuat job baru di Firestore dengan status "queued",
 * lalu membuat Cloud Task agar Worker memprosesnya via HTTP POST /worker.
 *
 * UC-01, UC-03 | FR-03–FR-07 | NFR-02
 */
export async function handler(event: GcpEvent): Promise<ApiResponse> {
  console.log("submit.handler invoked");

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return badRequest("Body harus berupa JSON yang valid");
  }

  const parsed = submitJobSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest("Validasi input gagal", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const jobId = uuidv4();
  const now = new Date().toISOString();

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
    console.error("Firestore putJob gagal", err);
    return serverError("Gagal menyimpan job ke database");
  }

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
    console.error("Cloud Tasks enqueueJob gagal", err);
    return serverError("Gagal mengantre job untuk diproses");
  }

  console.log("Job berhasil dibuat dan dienqueue", { jobId });
  return ok({ jobId, status: "queued" });
}
