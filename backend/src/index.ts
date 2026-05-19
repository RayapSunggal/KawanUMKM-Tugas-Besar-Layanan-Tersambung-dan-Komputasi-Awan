import * as ff from "@google-cloud/functions-framework";
import { Request, Response } from "express";
import { CloudEvent } from "@google-cloud/functions-framework";
import { httpAdapter } from "./lib/adapter.js";
import { handler as submitHandler } from "./handlers/submit.js";
import { handler as statusHandler } from "./handlers/status.js";
import { handler as historyHandler } from "./handlers/history.js";
import { handler as resultHandler } from "./handlers/result.js";
import { handler as uploadUrlHandler } from "./handlers/uploadUrl.js";
import { handler as workerHandler } from "./handlers/worker.js";

// ─── HTTP Functions ───────────────────────────────────────────────────────────

ff.http("submit", httpAdapter(submitHandler));
ff.http("history", httpAdapter(historyHandler));
ff.http("uploadUrl", httpAdapter(uploadUrlHandler));

// status dan result butuh path param — diterima via query string
// GET /status?jobId=xxx  →  pathParameters.jobId
ff.http("status", (req: Request, res: Response) => {
  if (!req.query.jobId) {
    res.status(400).json({ error: "jobId wajib disertakan sebagai query string" });
    return;
  }
  (req as unknown as Record<string, unknown>).params = { jobId: req.query.jobId as string };
  httpAdapter(statusHandler)(req, res);
});

ff.http("result", (req: Request, res: Response) => {
  if (!req.query.jobId) {
    res.status(400).json({ error: "jobId wajib disertakan sebagai query string" });
    return;
  }
  (req as unknown as Record<string, unknown>).params = { jobId: req.query.jobId as string };
  httpAdapter(resultHandler)(req, res);
});

// ─── Pub/Sub Worker ───────────────────────────────────────────────────────────

interface PubSubMessage {
  message: {
    data: string;
  };
}

ff.cloudEvent("worker", async (event: CloudEvent<PubSubMessage>) => {
  const pubsubData = event.data?.message;
  if (!pubsubData) return;

  const fakeMessage = {
    data: Buffer.from(pubsubData.data, "base64"),
    ack: () => { /* acknowledged */ },
    nack: () => { /* not acknowledged */ },
  };
  await workerHandler(fakeMessage as never);
});
