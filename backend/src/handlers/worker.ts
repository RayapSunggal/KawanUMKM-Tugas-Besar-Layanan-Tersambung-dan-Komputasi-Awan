import { SQSEvent, SQSRecord, Context } from "aws-lambda";
import { updateJobStatus, saveJobResult, failJob } from "../lib/dynamodb.js";
import { deleteMessage } from "../lib/sqs.js";
import { SqsJobMessage, GenerationResult, AssetErrors } from "../types/index.js";

/**
 * SQS Worker
 *
 * Di-trigger oleh SQS. Untuk setiap pesan, Worker:
 *   1. Update status DynamoDB → "processing"
 *   2. Panggil AI Service (bedrock-text + bedrock-image) — dikerjakan AI Engineer
 *   3. Upload banner ke S3
 *   4. Update DynamoDB → "completed" + simpan result
 *   5. Delete SQS message
 *
 * UC-09, UC-10 | FR-08–FR-12, FR-19 | NFR-19
 *
 * Skeleton ini siap diisi oleh AI Engineer di Fase 2.
 * Retry logic (exponential backoff) ditangani oleh SQS redrive policy (DLQ).
 */
export async function handler(event: SQSEvent, _context: Context): Promise<void> {
  for (const record of event.Records) {
    await processRecord(record);
  }
}

async function processRecord(record: SQSRecord): Promise<void> {
  let message: SqsJobMessage;

  try {
    message = JSON.parse(record.body) as SqsJobMessage;
  } catch {
    console.error("Gagal parse SQS message body", { body: record.body });
    // Biarkan SQS retry / kirim ke DLQ
    throw new Error("Invalid SQS message format");
  }

  const { jobId } = message;
  console.log("Worker memproses job", { jobId });

  // ── Step 1: Tandai status processing ─────────────────────────────────────
  await updateJobStatus(jobId, "processing", 10);

  const assetErrors: AssetErrors = {};

  try {
    // ── Step 2: Generate teks via Bedrock (dikerjakan AI Engineer) ───────────
    // TODO (Fase 2): import & panggil generateText() dari services/bedrock-text.ts
    // Contoh return yang diharapkan:
    // const textResult = await generateText(message);
    // captions = textResult.captions
    // hashtags = textResult.hashtags
    // schedule = textResult.schedule
    // contentIdeas = textResult.contentIdeas

    await updateJobStatus(jobId, "processing", 40);

    // ── Step 3: Generate banner via Bedrock + Sharp (dikerjakan AI Engineer) ─
    // TODO (Fase 2): import & panggil generateBanner() dari services/bedrock-image.ts
    // + compositing dari lib/compose-banner.ts
    // const bannerKey = await generateBanner(message);

    await updateJobStatus(jobId, "processing", 80);

    // ── Step 4: Simpan hasil ──────────────────────────────────────────────────
    // Placeholder result — akan diisi AI Engineer
    const result: GenerationResult = {
      captions: [],
      hashtags: [],
      schedule: { day: "", time: "", reason: "" },
      contentIdeas: [],
      // bannerUrl: bannerKey,  // uncomment setelah AI Engineer implementasi banner
    };

    await saveJobResult(jobId, result, assetErrors);
    console.log("Job selesai diproses", { jobId });

    // ── Step 5: Hapus message dari SQS ───────────────────────────────────────
    await deleteMessage(record.receiptHandle);
  } catch (err) {
    console.error("Worker gagal memproses job", { jobId, err });

    // Graceful degradation: tandai job failed agar frontend tidak stuck
    await failJob(
      jobId,
      err instanceof Error ? err.message : "Unknown worker error"
    ).catch((dbErr) => {
      // Jangan throw lagi — biarkan SQS redrive policy handle retry
      console.error("Gagal update status failed di DynamoDB", { jobId, dbErr });
    });

    // Re-throw agar SQS menandai message sebagai gagal → masuk DLQ setelah maxReceiveCount
    throw err;
  }
}
