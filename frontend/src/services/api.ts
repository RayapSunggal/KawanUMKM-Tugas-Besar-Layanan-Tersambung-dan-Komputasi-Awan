import { ProductFormValues } from "@/lib/validations/product";

// Mock Data
const MOCK_RESULT = {
  bannerUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1000&auto=format&fit=crop",
  caption: "Siapa bilang ngemil enak harus mahal? 🤤 Kenalin nih Keripik Pisang lumer yang bikin harimu makin manis! Cocok banget buat nemenin nugas atau drakoran. Yuk cobain sekarang sebelum kehabisan! ✨",
  hashtags: "#KeripikPisang #CemilanEnak #KulinerLokal #UMKMBisa #JajananKekinian",
  schedule: "Jumat, 19:00 WIB (Jam ramai audiens kuliner).",
};

export async function generateCampaign(data: ProductFormValues) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // MODE SIMULASI
  if (!apiUrl || apiUrl.includes("localhost:8000")) {
    console.log("Menjalankan API dalam Mode Simulasi...");
    return new Promise<typeof MOCK_RESULT>((resolve, reject) => {
      setTimeout(() => {
        if (data.name.toLowerCase().includes("error")) {
          reject(new Error("Simulasi Error Server"));
        } else {
          resolve(MOCK_RESULT);
        }
      }, 3000);
    });
  }

  // MODE PRODUKSI
  try {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category);
    formData.append("vibe", data.vibe);
    if (data.price) formData.append("price", data.price);
    
    if (data.photo && data.photo.length > 0) {
      formData.append("photo", data.photo[0]);
    }

    const response = await fetch(`${apiUrl}/generate`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json(); 
    return result;
  } catch (error) {
    console.error("Terjadi kesalahan saat memanggil API:", error);
    throw error;
  }
}