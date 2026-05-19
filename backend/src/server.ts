import express from "express";
import { handler as submitHandler } from "./handlers/submit.js";
import { handler as statusHandler } from "./handlers/status.js";
import { handler as historyHandler } from "./handlers/history.js";
import { handler as resultHandler } from "./handlers/result.js";
import { handler as uploadUrlHandler } from "./handlers/uploadUrl.js";
import { workerRoute } from "./routes/worker.js";
import { httpAdapter } from "./lib/adapter.js";

const app = express();

app.use(express.json());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});
app.options("*", (_req, res) => res.sendStatus(204));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.post("/generate",          httpAdapter(submitHandler));
app.get("/status/:jobId",      httpAdapter(statusHandler));
app.get("/history",            httpAdapter(historyHandler));
app.get("/result/:jobId",      httpAdapter(resultHandler));
app.get("/upload-url",         httpAdapter(uploadUrlHandler));

// Worker dipanggil oleh Cloud Tasks via HTTP POST
app.post("/worker",            workerRoute);

// ─── Health check (dipakai Cloud Run untuk readiness probe) ───────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, () => {
  console.log(`KawanUMKM backend listening on port ${PORT}`);
});

export default app;
