import * as z from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export const productFormSchema = z.object({
  photo: z
    .any()
    .refine((files) => files !== undefined && files !== null, "Foto produk wajib diunggah")
    .refine((files) => {
      if (typeof files === "string" && files.startsWith("blob:")) return true;
      
      if (files && typeof files === "object" && files.length > 0) {
         if (files[0].size > MAX_FILE_SIZE) return false;
         if (!ACCEPTED_IMAGE_TYPES.includes(files[0].type)) return false;
      }
      return true;
    }, "File tidak valid, ukuran maks 5MB, format .jpg/.png")
    .refine((files) => {
      if (typeof files === "string") return true;
      if (files && typeof files === "object" && files.length === 0) return false;
      return true;
    }, "Foto produk wajib diunggah")
    .optional(),

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