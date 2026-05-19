import { CloudTasksClient } from "@google-cloud/tasks";
import { SqsJobMessage } from "../types/index.js";

const client = new CloudTasksClient();

const PROJECT  = process.env.GCP_PROJECT_ID ?? "";
const REGION   = process.env.GCP_REGION ?? "asia-southeast2";
const QUEUE    = process.env.CLOUD_TASKS_QUEUE ?? "kawan-jobs";

// URL endpoint worker Cloud Run — diset saat deploy
const WORKER_URL = process.env.WORKER_URL ?? "";

// ─── Enqueue (buat task baru di Cloud Tasks) ──────────────────────────────────

export async function enqueueJob(message: SqsJobMessage): Promise<void> {
  const parent = client.queuePath(PROJECT, REGION, QUEUE);

  await client.createTask({
    parent,
    task: {
      httpRequest: {
        httpMethod: "POST",
        url: `${WORKER_URL}/worker`,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify(message)).toString("base64"),
      },
      // Retry config diatur di level queue (setup-gcp.sh)
    },
  });
}

// ─── deleteMessage tidak diperlukan di Cloud Tasks ────────────────────────────
// Cloud Tasks otomatis menghapus task setelah handler return HTTP 2xx.
// Fungsi ini tetap ada agar worker.ts tidak perlu diubah.
export async function deleteMessage(_taskName: string): Promise<void> {
  // no-op
}
