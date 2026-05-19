import { Request, Response } from "express";
import { ApiResponse } from "../types/index.js";

/**
 * Mengubah handler internal (yang return ApiResponse) menjadi
 * Cloud Functions HTTP handler (Request/Response Express-style).
 *
 * Dengan adapter ini, semua handlers (submit, status, history, result, uploadUrl)
 * tidak perlu diubah sama sekali — cukup dibungkus di sini.
 */
export function httpAdapter(
  handler: (event: GcpEvent) => Promise<ApiResponse>
) {
  return async (req: Request, res: Response): Promise<void> => {
    const event = toGcpEvent(req);
    const result = await handler(event);
    res
      .status(result.statusCode)
      .set(result.headers)
      .send(result.body);
  };
}

// ─── Bentuk event internal yang dipakai handler ───────────────────────────────
// Menyerupai subset APIGatewayProxyEvent yang dipakai handlers kita

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
    // Cloud Functions via Cloud Run: path params dari express router
    pathParameters: (req.params as Record<string, string>) ?? null,
    queryStringParameters: (req.query as Record<string, string>) ?? null,
    headers: req.headers as Record<string, string>,
    body: req.body ? JSON.stringify(req.body) : null,
  };
}
