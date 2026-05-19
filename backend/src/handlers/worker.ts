import { Message } from "@google-cloud/pubsub";
import { updateJobStatus, saveJobResult, failJob } from "../lib/firestore.js";
import { deleteMessage } from "../lib/pubsub.js";
import { SqsJobMessage, GenerationResult, AssetErrors } from "../types/index.js";

/**
 * Pub/Sub Worker
 *
 * Di-trigger oleh Pub/Sub push subscription via Cloud Functions.
 * Untuk setiap pesan, Worker:
 *   1. Update status Firestore → "processing"
 *   2. Panggil AI Service (gemini-text + vertex-image) — dikerjakan AI Engineer
 *   3. Upload banner ke Cloud Storage
 *   4. Update Firestore → "completed" + simpan result
 *   5. Acknowledge pesan Pub/Sub
 *
 * UC-09, UC-10 | FR-08–FR-12, FR-19 | NFR-19
 *
 * Skeleton ini siap diisi oleh AI Engineer di Fase 2.
 */
export async function handler(message: Message): Promise<void> {
  await processMessage(message);
}

async function processMessage(message: Message): Promise<void> {
  let jobMsg: SqsJobMessage;

  try {
    jobMsg = JSON.parse(message.data.toString()) as SqsJobMessage;
  } catch {
    console.error("Gagal parse Pub/Sub message", { data: message.data.toString() });
    message.ack(); // ack agar tidak retry pesan rusak → masuk dead letter topic
    return;
  }

  const { jobId } = jobMsg;
  console.log("Worker memproses job", { jobId });

  await updateJobStatus(jobId, "processing", 10);

  const assetErrors: AssetErrors = {};

  try {
    // ── Step 2: Generate teks via Gemini (dikerjakan AI Engineer) ────────────
    // TODO (Fase 2): import & panggil generateText() dari services/gemini-text.ts
    // const textResult = await generateText(jobMsg);

    await updateJobStatus(jobId, "processing", 40);

    // ── Step 3: Generate banner via Vertex AI + Sharp (dikerjakan AI Engineer) ─
    // TODO (Fase 2): import & panggil generateBanner() dari services/vertex-image.ts
    // const bannerKey = await generateBanner(jobMsg);

    await updateJobStatus(jobId, "processing", 80);

    // ── Step 4: Simpan hasil ──────────────────────────────────────────────────
    const result: GenerationResult = {
      captions: [],
      hashtags: [],
      schedule: { day: "", time: "", reason: "" },
      contentIdeas: [],
      // bannerUrl: bannerKey,
    };

    await saveJobResult(jobId, result, assetErrors);
    console.log("Job selesai diproses", { jobId });

    // ── Step 5: Acknowledge pesan ─────────────────────────────────────────────
    message.ack();
  } catch (err) {
    console.error("Worker gagal memproses job", { jobId, err });

    await failJob(
      jobId,
      err instanceof Error ? err.message : "Unknown worker error"
    ).catch((dbErr) => {
      console.error("Gagal update status failed di Firestore", { jobId, dbErr });
    });

    // nack → Pub/Sub akan retry, setelah maxDeliveryAttempts masuk dead letter topic
    message.nack();
  }
}
