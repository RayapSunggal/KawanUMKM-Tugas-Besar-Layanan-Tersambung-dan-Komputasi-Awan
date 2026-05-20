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
  const productPhotoDirection = input.productImageBase64
    ? "Use the provided product photo as the main hero product. Keep the product recognizable, preserve real packaging details, and improve the surroundings with professional advertising lighting."
    : "Create a premium product-inspired hero visual that clearly matches the category and product description.";

  return [
    "Create a finished 16:9 social media marketing banner for an Indonesian UMKM product.",
    "Style: premium commercial advertising, polished marketplace banner, clean composition, high contrast, appetizing/aspirational lighting where appropriate.",
    productPhotoDirection,
    `Product category: ${input.category}.`,
    `Product name context: ${input.productName}.`,
    `Product description context: ${input.productDescription}.`,
    `Marketing vibe: ${input.vibe}.`,
    `Price context only: ${formatOptional(input.price)}.`,
    input.tagline
      ? `Use this short Indonesian marketing line if readable text is included: "${input.tagline}".`
      : "If readable text is included, keep it short and accurate.",
    "Use at most two readable text elements: product name and one short tagline or price. Avoid tiny text, fake labels, misspelled words, extra logos, watermarks, and copyrighted brand references.",
    "Leave enough clean copy space so the banner still works if the UI overlays text later.",
    "The output must be a 16:9 banner suitable for Instagram, WhatsApp, and ecommerce promotion.",
  ].join(" ");
}

function formatOptional(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "tidak dicantumkan";
  }
  return String(value);
}
