import { GoogleGenAI, Modality } from "@google/genai";
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

    async generateImage({
      model,
      prompt,
      productImageBase64,
      productImageMimeType,
    }) {
      try {
        if (isGeminiImageModel(model)) {
          const parts: Array<
            | { text: string }
            | { inlineData: { mimeType: string; data: string } }
          > = [{ text: prompt }];

          if (productImageBase64 && productImageMimeType) {
            parts.push({
              inlineData: {
                mimeType: productImageMimeType,
                data: productImageBase64,
              },
            });
          }

          const response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts }],
            config: {
              responseModalities: [Modality.IMAGE],
              temperature: 0.8,
            },
          });

          const finishReason = response.candidates?.[0]?.finishReason;
          const imagePart = response.candidates
            ?.flatMap((candidate) => candidate.content?.parts ?? [])
            .find((part) => part.inlineData?.data);

          return {
            imageBase64: imagePart?.inlineData?.data,
            mimeType: imagePart?.inlineData?.mimeType,
            raiFilteredReason: isSafetyFinishReason(finishReason)
              ? "Gemini blocked the image generation request"
              : undefined,
          };
        }

        const response = await ai.models.generateImages({
          model,
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: "16:9",
            outputMimeType: "image/png",
            imageSize: "2K",
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

function isGeminiImageModel(model: string): boolean {
  return model.toLowerCase().includes("gemini");
}

function isSafetyFinishReason(finishReason: unknown): boolean {
  return (
    typeof finishReason === "string" &&
    ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST"].includes(finishReason)
  );
}
