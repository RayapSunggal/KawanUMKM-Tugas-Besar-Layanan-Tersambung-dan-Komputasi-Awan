// ─── Job Status ──────────────────────────────────────────────────────────────

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  jobId: string;
  sessionId: string;
  status: JobStatus;
  progress: number; // 0–100
  createdAt: string; // ISO 8601
  updatedAt: string;

  // Input
  productName: string;
  description: string;
  category: ProductCategory;
  vibe: ProductVibe;
  price?: string;
  photoKey: string; // S3 object key

  // Output (populated setelah completed)
  result?: GenerationResult;

  // Error info (populated bila status = failed)
  errorMessage?: string;
  assetErrors?: AssetErrors;
}

export interface AssetErrors {
  captionFailed?: boolean;
  bannerFailed?: boolean;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export type ProductCategory = "kuliner" | "fashion" | "kerajinan" | "jasa" | "lainnya";
export type ProductVibe = "Modern" | "Tradisional";

export interface SubmitJobInput {
  sessionId: string;
  productName: string;
  description: string;
  category: ProductCategory;
  vibe: ProductVibe;
  price?: string;
  photoKey: string;
}

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface GenerationResult {
  captions: CaptionVariant[];
  hashtags: string[];
  schedule: ScheduleSuggestion;
  contentIdeas: string[];
  bannerUrl?: string; // S3 presigned URL atau CloudFront URL
}

export interface CaptionVariant {
  length: "panjang" | "sedang" | "pendek";
  text: string;
}

export interface ScheduleSuggestion {
  day: string;
  time: string;
  reason: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface SubmitResponse {
  jobId: string;
  status: "queued";
}

export interface StatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
}

export interface HistoryItem {
  jobId: string;
  productName: string;
  createdAt: string;
  status: JobStatus;
}

export interface HistoryResponse {
  jobs: HistoryItem[];
}

export interface ResultResponse {
  jobId: string;
  status: JobStatus;
  progress: number;
  captions: CaptionVariant[];
  hashtags: string[];
  schedule: ScheduleSuggestion;
  contentIdeas: string[];
  bannerUrl?: string;
  assetErrors?: AssetErrors;
}

// ─── Lambda Helpers ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  statusCode: number;
  headers: Record<string, string>;
  body: string; // JSON.stringify(T)
}

export interface ErrorBody {
  error: string;
  details?: unknown;
}

// ─── SQS Message ─────────────────────────────────────────────────────────────

export interface SqsJobMessage {
  jobId: string;
  sessionId: string;
  productName: string;
  description: string;
  category: ProductCategory;
  vibe: ProductVibe;
  price?: string;
  photoKey: string;
}
