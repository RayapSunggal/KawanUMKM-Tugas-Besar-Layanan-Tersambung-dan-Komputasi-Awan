import * as z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const productFormSchema = z.object({
  photo: z
    .any()
    .refine((files) => files && files?.length > 0, "Foto produk wajib diunggah")
    .refine(
      (files) => !files || files?.length === 0 || files[0]?.size <= MAX_FILE_SIZE,
      "Ukuran maksimal foto adalah 5MB."
    )
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      "Hanya format .jpg, .jpeg, dan .png yang didukung."
    ),
  name: z
    .string()
    .min(1, "Nama produk wajib diisi")
    .max(50, "Nama produk maksimal 50 karakter"),
  description: z
    .string()
    .min(10, "Deskripsi minimal 10 karakter")
    .max(500, "Deskripsi maksimal 500 karakter"),
    
  category: z.enum(["kuliner", "fashion", "kerajinan", "jasa", "lainnya"], {
    message: "Kategori wajib dipilih",
  }),
  vibe: z.enum(["Modern", "Tradisional"], {
    message: "Vibe marketing wajib dipilih",
  }),
  
  price: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;