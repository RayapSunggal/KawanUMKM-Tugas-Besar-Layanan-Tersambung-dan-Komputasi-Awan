import {
  failJob,
  saveJobResult,
  savePartialJobResult,
  updateJobStatus,
} from "../lib/firestore.js";
import { buildBannerKey, downloadBuffer, uploadBuffer } from "../lib/storage.js";
import {
  AIServiceError,
  generateMarketingImage,
  generateMarketingText,
  type GenerateMarketingImageInput,
  type GenerateMarketingTextInput,
  type MarketingTextResult,
} from "../layers/ai/index.js";
import type {
  AssetErrors,
  CaptionVariant,
  CloudTaskJobMessage,
  GenerationResult,
} from "../types/index.js";

export async function processWorkerJob(
  jobMsg: CloudTaskJobMessage
): Promise<void> {
  const { jobId } = jobMsg;
  const assetErrors: AssetErrors = {};
  let textResult: MarketingTextResult | null = null;
  let bannerKey: string | undefined;

  await updateJobStatus(jobId, "processing", 10);

  try {
    textResult = await tryGenerateText(jobMsg, assetErrors);
    if (textResult) {
      await savePartialJobResult(
        jobId,
        buildGenerationResult(textResult),
        55,
        assetErrors
      );
    } else {
      await updateJobStatus(jobId, "processing", 40);
    }

    bannerKey = await tryGenerateBanner(jobMsg, assetErrors, textResult);
    await updateJobStatus(jobId, "processing", 80);

    if (!textResult && !bannerKey) {
      throw new Error("All AI assets failed to generate");
    }

    await saveJobResult(jobId, buildGenerationResult(textResult, bannerKey), assetErrors);
  } catch (err) {
    await failJob(jobId, getSafeFailureMessage(err)).catch((dbErr) => {
      console.error("Gagal update status failed di Firestore", { jobId, dbErr });
    });
    throw err;
  }
}

async function tryGenerateText(
  jobMsg: CloudTaskJobMessage,
  assetErrors: AssetErrors
): Promise<MarketingTextResult | null> {
  const input: GenerateMarketingTextInput = {
    productName: jobMsg.productName,
    productDescription: jobMsg.description,
    category: jobMsg.category,
    vibe: jobMsg.vibe,
    price: jobMsg.price ?? null,
  };

  try {
    return await generateMarketingText(input);
  } catch (err) {
    assetErrors.captionFailed = true;
    console.warn("AI text generation failed", {
      jobId: jobMsg.jobId,
      error: getSafeFailureMessage(err),
    });
    return null;
  }
}

async function tryGenerateBanner(
  jobMsg: CloudTaskJobMessage,
  assetErrors: AssetErrors,
  textResult: MarketingTextResult | null
): Promise<string | undefined> {
  const productImage = await tryReadProductImage(jobMsg);
  const input: GenerateMarketingImageInput = {
    productName: jobMsg.productName,
    productDescription: jobMsg.description,
    category: jobMsg.category,
    vibe: jobMsg.vibe,
    price: jobMsg.price ?? null,
    tagline: textResult?.captions.short,
    productImageBase64: productImage?.base64,
    productImageMimeType: productImage?.mimeType,
  };

  try {
    const image = await generateMarketingImage(input);
    const extension = getImageExtension(image.mimeType);
    const bannerKey = buildBannerKey(jobMsg.jobId, extension);
    await uploadBuffer(
      bannerKey,
      Buffer.from(image.imageBase64, "base64"),
      image.mimeType
    );
    return bannerKey;
  } catch (err) {
    assetErrors.bannerFailed = true;
    console.warn("AI image generation or upload failed", {
      jobId: jobMsg.jobId,
      error: getSafeFailureMessage(err),
    });
    return undefined;
  }
}

async function tryReadProductImage(
  jobMsg: CloudTaskJobMessage
): Promise<{ base64: string; mimeType: string } | undefined> {
  try {
    const image = await downloadBuffer(jobMsg.photoKey);
    return {
      base64: image.buffer.toString("base64"),
      mimeType: normalizeImageMimeType(image.contentType),
    };
  } catch (err) {
    console.warn("Product photo could not be read for banner generation", {
      jobId: jobMsg.jobId,
      error: getSafeFailureMessage(err),
    });
    return undefined;
  }
}

function getImageExtension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function normalizeImageMimeType(mimeType: string): string {
  return mimeType === "image/jpg" ? "image/jpeg" : mimeType;
}

function buildGenerationResult(
  textResult: MarketingTextResult | null,
  bannerKey?: string
): GenerationResult {
  return {
    captions: textResult ? toCaptionVariants(textResult) : [],
    hashtags: textResult?.hashtags ?? [],
    schedule: textResult?.postingSchedule ?? { day: "", time: "", reason: "" },
    contentIdeas: textResult
      ? [
          textResult.contentIdeas.story,
          textResult.contentIdeas.carousel,
          textResult.contentIdeas.reels,
        ]
      : [],
    bannerUrl: bannerKey,
  };
}

function toCaptionVariants(result: MarketingTextResult): CaptionVariant[] {
  return [
    { length: "pendek", text: result.captions.short },
    { length: "sedang", text: result.captions.medium },
    { length: "panjang", text: result.captions.long },
  ];
}

function getSafeFailureMessage(err: unknown): string {
  if (err instanceof AIServiceError) {
    return `AI service error: ${err.code}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unknown worker error";
}
