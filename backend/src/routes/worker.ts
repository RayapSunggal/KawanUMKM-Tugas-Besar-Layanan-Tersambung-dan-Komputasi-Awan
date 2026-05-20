import { Request, Response } from "express";
import { processWorkerJob } from "../handlers/worker.js";
import { SqsJobMessage } from "../types/index.js";

export async function workerRoute(req: Request, res: Response): Promise<void> {
  const jobMsg = req.body as SqsJobMessage;

  if (!jobMsg?.jobId) {
    res.status(400).json({ error: "Payload tidak valid" });
    return;
  }

  try {
    await processWorkerJob(jobMsg);
    res.status(200).json({ jobId: jobMsg.jobId, status: "completed" });
  } catch (err) {
    console.error("Worker route gagal", { jobId: jobMsg.jobId, err });
    res.status(500).json({ error: "Worker gagal memproses job" });
  }
}
