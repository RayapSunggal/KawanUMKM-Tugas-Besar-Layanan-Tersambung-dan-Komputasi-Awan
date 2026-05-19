import { Request, Response } from "express";
import { ApiResponse } from "../types/index.js";

/**
 * Membungkus handler internal (return ApiResponse) menjadi
 * Express route handler.
 *
 * Express sudah menangani path params (:jobId) secara native —
 * adapter ini cukup memetakan req ke GcpEvent dan mengirim response.
 */
export function httpAdapter(
  handler: (event: GcpEvent) => Promise<ApiResponse>
) {
  return async (req: Request, res: Response): Promise<void> => {
    const event = toGcpEvent(req);
    const result = await handler(event);
    res.status(result.statusCode).set(result.headers).send(result.body);
  };
}

// ─── Event internal yang dipakai semua handlers ───────────────────────────────

export interface GcpEvent {
  httpMethod: string;
  path: string;
  pathParameters: Record<string, string> | null;
  queryStringParameters: Record<string, string> | null;
  headers: Record<string, string>;
  body: string | null;
}

function toGcpEvent(req: Request): GcpEvent {
  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: (req.params as Record<string, string>) ?? null,
    queryStringParameters: (req.query as Record<string, string>) ?? null,
    headers: req.headers as Record<string, string>,
    body: req.body ? JSON.stringify(req.body) : null,
  };
}
