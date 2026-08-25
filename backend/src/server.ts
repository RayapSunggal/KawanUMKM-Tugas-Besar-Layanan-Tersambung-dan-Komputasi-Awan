import express from "express";
import rateLimit from "express-rate-limit";
import { handler as submitHandler } from "./handlers/submit.js";
import { handler as statusHandler } from "./handlers/status.js";
import { handler as historyHandler } from "./handlers/history.js";
import { handler as resultHandler } from "./handlers/result.js";
import { handler as uploadUrlHandler } from "./handlers/uploadUrl.js";
import { workerRoute } from "./routes/worker.js";
import { httpAdapter } from "./lib/adapter.js";

const app = express();

// Cloud Run: 1 hop proxy (GFE) — entry terakhir X-Forwarded-For = IP klien asli
app.set("trust proxy", 1);

app.use(express.json());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});
app.options("*", (_req, res) => res.sendStatus(204));

// ─── Rate limiting (per-instance; longgar bila scale ke N instance) ──────────
// ponytail: in-memory store, per-instance. Cukup untuk sekarang — upgrade ke
// Firestore/Redis store kalau max-instances dinaikkan atau limit diserang.
const RATE_LIMIT_MSG = { error: "Terlalu banyak permintaan, coba lagi nanti" };

const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_GENERATE_PER_HOUR ?? 5),
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMIT_MSG,
});

const uploadUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_UPLOAD_PER_HOUR ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: RATE_LIMIT_MSG,
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.post("/generate",          generateLimiter, httpAdapter(submitHandler));
app.get("/status/:jobId",      httpAdapter(statusHandler));
app.get("/history",            httpAdapter(historyHandler));
app.get("/result/:jobId",      httpAdapter(resultHandler));
app.get("/upload-url",         uploadUrlLimiter, httpAdapter(uploadUrlHandler));

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
