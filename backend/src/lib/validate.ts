import { z } from "zod";

export const submitJobSchema = z.object({
  productName: z
    .string()
    .min(1, "Nama produk wajib diisi")
    .max(50, "Nama produk maksimal 50 karakter"),
  description: z
    .string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(500, "Deskripsi maksimal 500 karakter"),
  category: z.enum(["kuliner", "fashion", "kerajinan", "jasa", "lainnya"], {
    errorMap: () => ({ message: "Kategori tidak valid" }),
  }),
  vibe: z.enum(["Modern", "Tradisional"], {
    errorMap: () => ({ message: "Vibe tidak valid" }),
  }),
  price: z.string().optional(),
  photoKey: z.string().min(1, "photoKey wajib diisi"),
  sessionId: z.string().min(1, "sessionId wajib diisi"),
});

export type SubmitJobInput = z.infer<typeof submitJobSchema>;

export const signedUrlSchema = z.object({
  fileName: z.string().min(1, "fileName wajib diisi"),
  contentType: z.enum(["image/jpeg", "image/jpg", "image/png"], {
    errorMap: () => ({ message: "Format file harus PNG, JPG, atau JPEG" }),
  }),
  fileSizeBytes: z
    .number()
    .max(5 * 1024 * 1024, "Ukuran file maksimal 5MB"),
});

export type SignedUrlInput = z.infer<typeof signedUrlSchema>;
