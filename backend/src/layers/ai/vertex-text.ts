import { AI_PROVIDER, type VertexAiClient } from "./types.js";
import { AIServiceError, toAIServiceError } from "./errors.js";
import { buildMarketingTextPrompt } from "./prompts.js";
import { marketingTextPayloadSchema } from "./validators.js";
import type {
  GenerateMarketingTextInput,
  MarketingTextResult,
} from "./types.js";
import { getDefaultVertexAiClient } from "./vertex-client.js";

export function getTextModelId(): string {
  return process.env.GCP_VERTEX_TEXT_MODEL ?? "gemini-2.5-flash";
}

export async function generateMarketingText(
  input: GenerateMarketingTextInput,
  client: VertexAiClient = getDefaultVertexAiClient()
): Promise<MarketingTextResult> {
  const model = getTextModelId();
  const prompt = buildMarketingTextPrompt(input);

  try {
    const responseText = await client.generateTextContent({ model, prompt });
    const parsed = parseMarketingTextResponse(responseText);
    return {
      ...parsed,
      rawProvider: { provider: AI_PROVIDER, model },
    };
  } catch (error) {
    throw toAIServiceError(error);
  }
}

export function parseMarketingTextResponse(text: string): MarketingTextResult {
  const parsedJson = parseJsonObject(text);
  const result = marketingTextPayloadSchema.safeParse(parsedJson);

  if (!result.success) {
    throw new AIServiceError(
      "BAD_RESPONSE",
      "AI text response did not match the expected schema",
      { retryable: false, cause: result.error }
    );
  }

  return result.data;
}

function parseJsonObject(text: string): unknown {
  for (const candidate of buildJsonCandidates(text)) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next extraction.
    }
  }
  throw new AIServiceError("BAD_RESPONSE", "AI text response was not JSON", {
    retryable: false,
  });
}

function buildJsonCandidates(text: string): string[] {
  const trimmed = text.trim();
  const candidates = new Set<string>([trimmed]);
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;

  for (const match of trimmed.matchAll(fencePattern)) {
    if (match[1]?.trim()) candidates.add(match[1].trim());
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    candidates.add(trimmed.slice(start, end + 1));
  }

  return [...candidates].filter(Boolean);
}

export const generateTextContent = generateMarketingText;
export const generateCaption = generateMarketingText;
export const generateHashtags = generateMarketingText;
export const bedrockTextGenerate = generateMarketingText;
