import { v4 as uuidv4 } from "uuid";
import { submitJobSchema } from "../lib/validate.js";
import { putJob, claimDailyQuota } from "../lib/firestore.js";
import { enqueueJob } from "../lib/tasks.js";
import { ok, badRequest, serverError, tooManyRequests } from "../lib/response.js";
import { GcpEvent } from "../lib/adapter.js";
import { Job, CloudTaskJobMessage, ApiResponse } from "../types/index.js";

const DAILY_GENERATE_CAP = Number(process.env.DAILY_GENERATE_CAP ?? 100);

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

  // Kill switch: kuota harian global. Dicek SEBELUM membuat job/task
  // supaya tidak ada biaya Gemini saat kuota habis.
  try {
    const allowed = await claimDailyQuota(DAILY_GENERATE_CAP);
    if (!allowed) {
      return tooManyRequests("Kuota generate harian sudah habis, coba lagi besok");
    }
  } catch (err) {
    console.error("Gagal cek kuota harian", err);
    return serverError("Gagal memeriksa kuota");
  }

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

  const message: CloudTaskJobMessage = {
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
