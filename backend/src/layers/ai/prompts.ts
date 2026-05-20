import type {
  GenerateMarketingImageInput,
  GenerateMarketingTextInput,
} from "./types.js";

export function buildMarketingTextPrompt(
  input: GenerateMarketingTextInput
): string {
  return [
    "Anda adalah copywriter pemasaran untuk UMKM Indonesia.",
    "Buat output marketing Instagram dalam Bahasa Indonesia.",
    "Jawab dengan valid JSON only. Jangan gunakan markdown atau teks di luar JSON.",
    "",
    "Data produk:",
    `- Nama produk: ${input.productName}`,
    `- Deskripsi produk: ${input.productDescription}`,
    `- Kategori: ${input.category}`,
    `- Vibe/style: ${input.vibe}`,
    `- Harga: ${formatOptional(input.price)}`,
    "",
    "Ketentuan:",
    "- Buat 3 caption: short, medium, long.",
    "- Buat tepat 15 hashtag berisi gabungan hashtag luas dan niche.",
    "- Sertakan postingSchedule dengan day, time, reason.",
    "- Sertakan contentIdeas dengan story, carousel, reels.",
    "",
    "Schema JSON:",
    `{
  "captions": { "short": "string", "medium": "string", "long": "string" },
  "hashtags": ["exactly 15 strings"],
  "postingSchedule": { "day": "string", "time": "string", "reason": "string" },
  "contentIdeas": { "story": "string", "carousel": "string", "reels": "string" }
}`,
  ].join("\n");
}

export function buildMarketingImagePrompt(
  input: GenerateMarketingImageInput
): string {
  return [
    "Square 1:1 social media marketing banner background for an Indonesian UMKM product.",
    `Product category: ${input.category}.`,
    `Product name context: ${input.productName}.`,
    `Product description context: ${input.productDescription}.`,
    `Marketing vibe: ${input.vibe}.`,
    `Price context only: ${formatOptional(input.price)}.`,
    input.tagline
      ? `Tagline context: ${input.tagline}. Do not render readable text.`
      : "No readable text.",
    "Leave clean empty space for later compositing of product photo, tagline, price, and call-to-action.",
    "Do not include copyrighted brand references, recognizable logos, fake labels, or watermarks.",
    "The image must work as a 1080x1080-compatible banner asset.",
  ].join(" ");
}

function formatOptional(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "tidak dicantumkan";
  }
  return String(value);
}
