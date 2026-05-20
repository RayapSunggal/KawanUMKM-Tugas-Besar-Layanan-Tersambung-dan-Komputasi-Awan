import { AI_PROVIDER, type VertexAiClient } from "./types.js";
import { AIServiceError, toAIServiceError } from "./errors.js";
import { buildMarketingImagePrompt } from "./prompts.js";
import { marketingImagePayloadSchema } from "./validators.js";
import type {
  GenerateMarketingImageInput,
  MarketingImageResult,
} from "./types.js";
import { getDefaultVertexAiClient } from "./vertex-client.js";

export function getImageModelId(): string {
  return process.env.GCP_VERTEX_IMAGE_MODEL ?? "imagen-4.0-generate-001";
}

export async function generateMarketingImage(
  input: GenerateMarketingImageInput,
  client: VertexAiClient = getDefaultVertexAiClient()
): Promise<MarketingImageResult> {
  const model = getImageModelId();
  const prompt = buildMarketingImagePrompt(input);

  try {
    const response = await client.generateImage({ model, prompt });

    if (!response.imageBase64) {
      throw new AIServiceError(
        response.raiFilteredReason ? "SAFETY_BLOCKED" : "BAD_RESPONSE",
        response.raiFilteredReason
          ? "AI image response was blocked by safety filters"
          : "AI image response did not contain image bytes",
        { retryable: false }
      );
    }

    const parsed = marketingImagePayloadSchema.safeParse({
      imageBase64: response.imageBase64,
      mimeType: response.mimeType ?? "image/png",
    });

    if (!parsed.success) {
      throw new AIServiceError(
        "BAD_RESPONSE",
        "AI image response did not match the expected schema",
        { retryable: false, cause: parsed.error }
      );
    }

    return {
      ...parsed.data,
      rawProvider: { provider: AI_PROVIDER, model },
    };
  } catch (error) {
    throw toAIServiceError(error);
  }
}

export const generateBannerImage = generateMarketingImage;
export const bedrockImageGenerate = generateMarketingImage;
