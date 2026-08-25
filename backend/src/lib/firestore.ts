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

export async function savePartialJobResult(
  jobId: string,
  result: GenerationResult,
  progress: number,
  assetErrors?: AssetErrors
): Promise<void> {
  await col().doc(jobId).update({
    status: "processing" as JobStatus,
    progress,
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

// ─── Daily Quota (kill switch global anti-abuse) ──────────────────────────────

/**
 * Klaim 1 slot kuota generate untuk hari ini (UTC). Atomik via transaksi.
 * Return false kalau kuota harian global sudah habis — ini pembatas
 * pengeluaran terakhir yang berlaku lintas instance & lintas user.
 */
export async function claimDailyQuota(limit: number): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const ref = db.collection("kawan-counters").doc(`generate-${today}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = (snap.data()?.count as number | undefined) ?? 0;
    if (count >= limit) return false;
    tx.set(ref, { count: count + 1 }, { merge: true });
    return true;
  });
}
