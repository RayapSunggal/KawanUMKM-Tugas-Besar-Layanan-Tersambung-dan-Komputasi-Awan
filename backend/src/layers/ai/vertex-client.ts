import { GoogleGenAI } from "@google/genai";
import { AIServiceError, toAIServiceError } from "./errors.js";
import type { VertexAiClient } from "./types.js";

let cachedClient: VertexAiClient | null = null;

export function getDefaultVertexAiClient(): VertexAiClient {
  cachedClient ??= createVertexAiClient();
  return cachedClient;
}

export function createVertexAiClient(): VertexAiClient {
  const project =
    process.env.GCP_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT ?? "";
  const location =
    process.env.GCP_LOCATION ?? process.env.GOOGLE_CLOUD_LOCATION ?? "global";

  if (!project.trim()) {
    throw new AIServiceError(
      "AUTH_ERROR",
      "GCP_PROJECT_ID is required to use Vertex AI",
      { retryable: false }
    );
  }

  const ai = new GoogleGenAI({ vertexai: true, project, location });

  return {
    async generateTextContent({ model, prompt }) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });

        const finishReason = response.candidates?.[0]?.finishReason;
        if (
          typeof finishReason === "string" &&
          ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST"].includes(finishReason)
        ) {
          throw new AIServiceError(
            "SAFETY_BLOCKED",
            "Gemini blocked the text generation request",
            { retryable: false }
          );
        }

        if (!response.text?.trim()) {
          throw new AIServiceError("BAD_RESPONSE", "Gemini returned no text", {
            retryable: false,
          });
        }

        return response.text;
      } catch (error) {
        throw toAIServiceError(error);
      }
    },

    async generateImage({ model, prompt }) {
      try {
        const response = await ai.models.generateImages({
          model,
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "1:1",
            outputMimeType: "image/png",
            imageSize: "1K",
            includeRaiReason: true,
            enhancePrompt: true,
          },
        });

        const generated = response.generatedImages?.[0];
        return {
          imageBase64: generated?.image?.imageBytes,
          mimeType: generated?.image?.mimeType,
          raiFilteredReason: generated?.raiFilteredReason,
        };
      } catch (error) {
        throw toAIServiceError(error);
      }
    },
  };
}
