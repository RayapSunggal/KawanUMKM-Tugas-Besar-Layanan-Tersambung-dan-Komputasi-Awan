import { Request, Response } from "express";
import { updateJobStatus, saveJobResult, failJob } from "../lib/firestore.js";
import { SqsJobMessage, GenerationResult, AssetErrors } from "../types/index.js";

/**
 * POST /worker
 *
 * Di-trigger oleh Cloud Tasks via HTTP POST.
 * Cloud Tasks mengirim body JSON berisi SqsJobMessage.
 * Return HTTP 2xx → Cloud Tasks anggap sukses dan hapus task.
 * Return HTTP 5xx → Cloud Tasks retry sesuai queue config (max 3x → dead-letter).
 *
 * UC-09, UC-10 | FR-08–FR-12, FR-19 | NFR-19
 */
export async function workerRoute(req: Request, res: Response): Promise<void> {
  const jobMsg = req.body as SqsJobMessage;

  if (!jobMsg?.jobId) {
    res.status(400).json({ error: "Payload tidak valid" });
    return;
  }

  const { jobId } = jobMsg;
  console.log("Worker memproses job", { jobId });

  await updateJobStatus(jobId, "processing", 10);

  const assetErrors: AssetErrors = {};

  try {
    // ── Step 2: Generate teks via Gemini (dikerjakan AI Engineer) ────────────
    // TODO (Fase 2): import & panggil generateText() dari services/vertex-text.ts
    // const textResult = await generateText(jobMsg);

    await updateJobStatus(jobId, "processing", 40);

    // ── Step 3: Generate banner via Imagen + Sharp (dikerjakan AI Engineer) ──
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

    // HTTP 200 → Cloud Tasks hapus task otomatis
    res.status(200).json({ jobId, status: "completed" });
  } catch (err) {
    console.error("Worker gagal memproses job", { jobId, err });

    await failJob(
      jobId,
      err instanceof Error ? err.message : "Unknown worker error"
    ).catch((dbErr) => {
      console.error("Gagal update status failed di Firestore", { jobId, dbErr });
    });

    // HTTP 500 → Cloud Tasks akan retry
    res.status(500).json({ error: "Worker gagal memproses job" });
  }
}
