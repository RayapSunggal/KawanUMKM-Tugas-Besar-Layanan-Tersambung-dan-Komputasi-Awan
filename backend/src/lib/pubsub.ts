import { PubSub } from "@google-cloud/pubsub";
import { SqsJobMessage } from "../types/index.js";

const pubsub = new PubSub({ projectId: process.env.GCP_PROJECT_ID });

const TOPIC = process.env.PUBSUB_TOPIC ?? "kawan-jobs";

// ─── Enqueue (publish ke topic) ───────────────────────────────────────────────

export async function enqueueJob(message: SqsJobMessage): Promise<void> {
  const data = Buffer.from(JSON.stringify(message));
  await pubsub.topic(TOPIC).publishMessage({ data });
}

// ─── Delete Message ───────────────────────────────────────────────────────────
// Di Pub/Sub push delivery via Cloud Functions, acknowledgement dilakukan
// dengan message.ack() langsung di worker — fungsi ini sebagai alias eksplisit.

export async function deleteMessage(_ackId: string): Promise<void> {
  // Dalam model push (Cloud Functions trigger), Pub/Sub auto-ack bila function
  // selesai tanpa error. Fungsi ini tetap ada agar signature worker tidak berubah.
}
