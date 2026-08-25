import { CloudTasksClient } from "@google-cloud/tasks";
import { CloudTaskJobMessage } from "../types/index.js";

const client = new CloudTasksClient();

const PROJECT = process.env.GCP_PROJECT_ID ?? "";
const REGION = process.env.GCP_REGION ?? "asia-southeast2";
const QUEUE = process.env.CLOUD_TASKS_QUEUE ?? "kawan-jobs";
const WORKER_URL = process.env.WORKER_URL ?? "";
const TASKS_CALLER_EMAIL = process.env.TASKS_CALLER_EMAIL ?? "";

export async function enqueueJob(message: CloudTaskJobMessage): Promise<void> {
  const parent = client.queuePath(PROJECT, REGION, QUEUE);

  await client.createTask({
    parent,
    task: {
      httpRequest: {
        httpMethod: "POST",
        url: `${WORKER_URL}/worker`,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify(message)).toString("base64"),
        // Token OIDC diverifikasi di /worker — tanpa ini endpoint worker terbuka publik
        oidcToken: {
          serviceAccountEmail: TASKS_CALLER_EMAIL,
          audience: WORKER_URL,
        },
      },
    },
  });
}
