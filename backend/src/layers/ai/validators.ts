import { z } from "zod";

export const marketingTextPayloadSchema = z.object({
  captions: z.object({
    short: z.string().trim().min(1),
    medium: z.string().trim().min(1),
    long: z.string().trim().min(1),
  }),
  hashtags: z.array(z.string().trim().min(1)).length(15),
  postingSchedule: z.object({
    day: z.string().trim().min(1),
    time: z.string().trim().min(1),
    reason: z.string().trim().min(1),
  }),
  contentIdeas: z.object({
    story: z.string().trim().min(1),
    carousel: z.string().trim().min(1),
    reels: z.string().trim().min(1),
  }),
});

export const marketingImagePayloadSchema = z.object({
  imageBase64: z.string().trim().min(1),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});
