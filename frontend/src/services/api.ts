import { ProductFormValues } from "@/lib/validations/product";

type JobStatus = "queued" | "processing" | "completed" | "failed";
type CaptionLength = "pendek" | "sedang" | "panjang";

export type CaptionVariant = {
  length: CaptionLength;
  text: string;
};

export type ScheduleSuggestion = {
  day: string;
  time: string;
  reason: string;
};

export type CampaignResult = {
  jobId: string;
  status: JobStatus;
  progress: number;
  bannerUrl?: string;
  caption: string;
  captions: CaptionVariant[];
  hashtags: string[];
  hashtagsText: string;
  schedule: ScheduleSuggestion;
  scheduleText: string;
  contentIdeas: string[];
  assetErrors?: {
    captionFailed?: boolean;
    bannerFailed?: boolean;
  };
};

export type CampaignHistoryItem = {
  jobId: string;
  productName: string;
  createdAt: string;
  timestamp: string;
  status: JobStatus;
};

type UploadUrlResponse = {
  uploadUrl: string;
  photoKey: string;
};

type SubmitJobResponse = {
  jobId: string;
  status: "queued";
};

type StatusResponse = {
  jobId: string;
  status: JobStatus;
  progress: number;
};

type ResultResponse = {
  jobId: string;
  status: JobStatus;
  progress: number;
  captions: CaptionVariant[];
  hashtags: string[];
  schedule: ScheduleSuggestion;
  contentIdeas: string[];
  bannerUrl?: string;
  assetErrors?: {
    captionFailed?: boolean;
    bannerFailed?: boolean;
  };
};

type HistoryResponse = {
  jobs: Array<{
    jobId: string;
    productName: string;
    createdAt: string;
    status: JobStatus;
  }>;
};

const POLL_INTERVAL_MS = 2000;
const MAX_TEXT_POLL_ATTEMPTS = 90;

export function getSessionId(): string {
  if (typeof window === "undefined") {
    return "default-session-id";
  }

  let sessionId = localStorage.getItem("kawan_session_id");
  if (!sessionId) {
    sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem("kawan_session_id", sessionId);
  }
  return sessionId;
}

export async function generateCampaign(
  data: ProductFormValues
): Promise<CampaignResult> {
  const apiUrl = getApiBaseUrl();
  const file = data.photo && data.photo.length > 0 ? data.photo[0] : null;
  if (!file) {
    throw new Error("Foto produk wajib diunggah");
  }

  const sessionId = getSessionId();
  const { uploadUrl, photoKey } = await requestUploadUrl(apiUrl, file);
  await uploadProductPhoto(uploadUrl, file);

  const { jobId } = await submitGenerationJob(apiUrl, {
    sessionId,
    productName: data.name,
    description: data.description,
    category: data.category,
    vibe: data.vibe,
    price: data.price || undefined,
    photoKey,
  });

  return waitForTextResult(apiUrl, jobId);
}

export async function fetchCampaignResult(
  jobId: string
): Promise<CampaignResult> {
  const apiUrl = getApiBaseUrl();
  const result = await fetchCampaignResultFromApi(apiUrl, jobId);
  return mapResultResponse(result);
}

export async function fetchCampaignStatus(jobId: string): Promise<StatusResponse> {
  const apiUrl = getApiBaseUrl();
  return fetchJson<StatusResponse>(`${apiUrl}/status/${jobId}`);
}

export async function fetchCampaignHistory(): Promise<CampaignHistoryItem[]> {
  const apiUrl = getApiBaseUrl();
  const sessionId = getSessionId();
  const params = new URLSearchParams({ sessionId });
  const response = await fetchJson<HistoryResponse>(`${apiUrl}/history?${params}`);

  return response.jobs.map((job) => ({
    ...job,
    timestamp: formatTimestamp(job.createdAt),
  }));
}

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL belum diset. Frontend membutuhkan backend Cloud Run untuk menjalankan AI GCP."
    );
  }
  return apiUrl.replace(/\/$/, "");
}

async function requestUploadUrl(
  apiUrl: string,
  file: File
): Promise<UploadUrlResponse> {
  const params = new URLSearchParams({
    fileName: file.name,
    contentType: file.type,
    fileSizeBytes: file.size.toString(),
  });

  return fetchJson<UploadUrlResponse>(`${apiUrl}/upload-url?${params}`);
}

async function uploadProductPhoto(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Gagal mengunggah foto produk ke Cloud Storage");
  }
}

async function submitGenerationJob(
  apiUrl: string,
  payload: {
    sessionId: string;
    productName: string;
    description: string;
    category: ProductFormValues["category"];
    vibe: ProductFormValues["vibe"];
    price?: string;
    photoKey: string;
  }
): Promise<SubmitJobResponse> {
  return fetchJson<SubmitJobResponse>(`${apiUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function waitForTextResult(
  apiUrl: string,
  jobId: string
): Promise<CampaignResult> {
  for (let attempt = 0; attempt < MAX_TEXT_POLL_ATTEMPTS; attempt += 1) {
    await delay(POLL_INTERVAL_MS);

    try {
      const result = await fetchCampaignResultFromApi(apiUrl, jobId);
      if (result.captions.length > 0 || result.status === "completed") {
        return mapResultResponse(result);
      }
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error;
      }
    }

    const status = await fetchJson<StatusResponse>(`${apiUrl}/status/${jobId}`);
    if (status.status === "failed") {
      throw new Error("Proses AI gagal diproses oleh worker");
    }
  }

  throw new Error("Waktu tunggu teks AI habis. Coba cek status job beberapa saat lagi.");
}

async function fetchCampaignResultFromApi(
  apiUrl: string,
  jobId: string
): Promise<ResultResponse> {
  return fetchJson<ResultResponse>(`${apiUrl}/result/${jobId}`);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(
      message || `Request gagal (${response.status})`,
      response.status
    );
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "";
  } catch {
    return "";
  }
}

function mapResultResponse(result: ResultResponse): CampaignResult {
  const caption =
    result.captions.find((item) => item.length === "sedang")?.text ??
    result.captions[0]?.text ??
    "";

  return {
    jobId: result.jobId,
    status: result.status,
    progress: result.progress,
    bannerUrl: result.bannerUrl || undefined,
    caption,
    captions: result.captions,
    hashtags: result.hashtags,
    hashtagsText: result.hashtags.join(" "),
    schedule: result.schedule,
    scheduleText: formatSchedule(result.schedule),
    contentIdeas: result.contentIdeas,
    assetErrors: result.assetErrors,
  };
}

function formatSchedule(schedule: ScheduleSuggestion): string {
  if (!schedule.day && !schedule.time && !schedule.reason) {
    return "Jadwal belum tersedia.";
  }

  const dayTime = [schedule.day, schedule.time].filter(Boolean).join(", ");
  return schedule.reason ? `${dayTime} (${schedule.reason}).` : dayTime;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}
