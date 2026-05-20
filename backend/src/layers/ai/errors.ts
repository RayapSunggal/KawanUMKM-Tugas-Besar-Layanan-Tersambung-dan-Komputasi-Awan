import { AI_PROVIDER } from "./types.js";

export type AIServiceErrorCode =
  | "AI_THROTTLED"
  | "MODEL_UNAVAILABLE"
  | "BAD_RESPONSE"
  | "SAFETY_BLOCKED"
  | "AUTH_ERROR"
  | "UNKNOWN_AI_ERROR";

export class AIServiceError extends Error {
  readonly code: AIServiceErrorCode;
  readonly retryable: boolean;
  readonly provider = AI_PROVIDER;
  override cause?: unknown;

  constructor(
    code: AIServiceErrorCode,
    message: string,
    options: { retryable?: boolean; cause?: unknown } = {}
  ) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.retryable =
      options.retryable ?? (code === "AI_THROTTLED" || code === "MODEL_UNAVAILABLE");
    this.cause = options.cause;
  }
}

export function toAIServiceError(error: unknown): AIServiceError {
  if (error instanceof AIServiceError) return error;

  const status = getStatus(error);
  const message = getMessage(error).toLowerCase();

  if (status === 429 || message.includes("quota") || message.includes("rate")) {
    return new AIServiceError("AI_THROTTLED", "AI provider throttled the request", {
      retryable: true,
      cause: error,
    });
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes("credential") ||
    message.includes("permission") ||
    message.includes("authentication")
  ) {
    return new AIServiceError("AUTH_ERROR", "AI provider authentication failed", {
      retryable: false,
      cause: error,
    });
  }

  if (
    status === 404 ||
    status === 503 ||
    message.includes("not found") ||
    message.includes("unavailable")
  ) {
    return new AIServiceError("MODEL_UNAVAILABLE", "AI model is unavailable", {
      retryable: status === 503,
      cause: error,
    });
  }

  if (
    message.includes("safety") ||
    message.includes("blocked") ||
    message.includes("prohibited")
  ) {
    return new AIServiceError("SAFETY_BLOCKED", "AI provider blocked the content", {
      retryable: false,
      cause: error,
    });
  }

  return new AIServiceError("UNKNOWN_AI_ERROR", "AI provider request failed", {
    retryable: false,
    cause: error,
  });
}

function getStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const raw = (error as { status?: unknown; code?: unknown }).status ??
    (error as { code?: unknown }).code;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}
