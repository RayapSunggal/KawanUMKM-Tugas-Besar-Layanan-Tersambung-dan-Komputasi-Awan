import { Firestore } from "@google-cloud/firestore";
import { Job, JobStatus, GenerationResult, AssetErrors } from "../types/index.js";

const db = new Firestore({
  projectId: process.env.GCP_PROJECT_ID,
  ignoreUndefinedProperties: true,
});

const COLLECTION = process.env.FIRESTORE_COLLECTION ?? "kawan-jobs";

const col = () => db.collection(COLLECTION);

// ─── Write ────────────────────────────────────────────────────────────────────

export async function putJob(job: Job): Promise<void> {
  await col().doc(job.jobId).set(job);
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getJob(jobId: string): Promise<Job | null> {
  const snap = await col().doc(jobId).get();
  if (!snap.exists) return null;
  return snap.data() as Job;
}

// ─── Update Status & Progress ─────────────────────────────────────────────────

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  progress: number
): Promise<void> {
  await col().doc(jobId).update({
    status,
    progress,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Save Generation Result ───────────────────────────────────────────────────

export async function saveJobResult(
  jobId: string,
  result: GenerationResult,
  assetErrors?: AssetErrors
): Promise<void> {
  await col().doc(jobId).update({
    status: "completed" as JobStatus,
    progress: 100,
    result,
    assetErrors: assetErrors ?? {},
    updatedAt: new Date().toISOString(),
  });
}

// ─── Mark Failed ─────────────────────────────────────────────────────────────

export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  await col().doc(jobId).update({
    status: "failed" as JobStatus,
    errorMessage,
    updatedAt: new Date().toISOString(),
  });
}

// ─── List by Session (History) ────────────────────────────────────────────────

export async function listJobsBySession(sessionId: string): Promise<Job[]> {
  const snap = await col()
    .where("sessionId", "==", sessionId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => d.data() as Job);
}
