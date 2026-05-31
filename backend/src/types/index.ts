export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  jobId: string;
  sessionId: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;

  productName: string;
  description: string;
  category: ProductCategory;
  vibe: ProductVibe;
  price?: string;
  photoKey: string;

  result?: GenerationResult;
  errorMessage?: string;
  assetErrors?: AssetErrors;
}

export interface AssetErrors {
  captionFailed?: boolean;
  bannerFailed?: boolean;
}

export type ProductCategory =
  | "kuliner"
  | "fashion"
  | "kerajinan"
  | "jasa"
  | "lainnya";

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

export interface GenerationResult {
  captions: CaptionVariant[];
  hashtags: string[];
  schedule: ScheduleSuggestion;
  contentIdeas: string[];
  bannerUrl?: string;
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

export interface ApiResponse<T = unknown> {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface ErrorBody {
  error: string;
  details?: unknown;
}

export interface CloudTaskJobMessage {
  jobId: string;
  sessionId: string;
  productName: string;
  description: string;
  category: ProductCategory;
  vibe: ProductVibe;
  price?: string;
  photoKey: string;
}
