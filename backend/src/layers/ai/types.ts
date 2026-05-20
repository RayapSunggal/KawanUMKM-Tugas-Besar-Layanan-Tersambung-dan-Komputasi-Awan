export const AI_PROVIDER = "google-cloud-vertex-ai" as const;

export type MarketingVibe = "Modern" | "Tradisional";
export type MarketingCategory =
  | "kuliner"
  | "fashion"
  | "kerajinan"
  | "jasa"
  | "lainnya";

export type GenerateMarketingTextInput = {
  productName: string;
  productDescription: string;
  category: MarketingCategory;
  vibe: MarketingVibe;
  price?: string | number | null;
};

export type CaptionVariants = {
  short: string;
  medium: string;
  long: string;
};

export type MarketingTextResult = {
  captions: CaptionVariants;
  hashtags: string[];
  postingSchedule: {
    day: string;
    time: string;
    reason: string;
  };
  contentIdeas: {
    story: string;
    carousel: string;
    reels: string;
  };
  rawProvider?: {
    provider: typeof AI_PROVIDER;
    model: string;
  };
};

export type GenerateMarketingImageInput = {
  productName: string;
  productDescription: string;
  category: string;
  vibe: MarketingVibe;
  price?: string | number | null;
  tagline?: string;
  productImageBase64?: string;
  productImageMimeType?: string;
};

export type MarketingImageResult = {
  imageBase64: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  rawProvider?: {
    provider: typeof AI_PROVIDER;
    model: string;
  };
};

export type VertexImagePayload = {
  imageBase64?: string;
  mimeType?: string;
  raiFilteredReason?: string;
};

export type VertexAiClient = {
  generateTextContent(params: {
    model: string;
    prompt: string;
  }): Promise<string>;
  generateImage(params: {
    model: string;
    prompt: string;
    productImageBase64?: string;
    productImageMimeType?: string;
  }): Promise<VertexImagePayload>;
};
