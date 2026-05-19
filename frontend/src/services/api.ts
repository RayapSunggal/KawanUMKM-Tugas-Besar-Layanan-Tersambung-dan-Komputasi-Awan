import { ProductFormValues } from "@/lib/validations/product";

// Mock Data
const MOCK_RESULT = {
  bannerUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1000&auto=format&fit=crop",
  caption: "Siapa bilang ngemil enak harus mahal? 🤤 Kenalin nih Keripik Pisang lumer yang bikin harimu makin manis! Cocok banget buat nemenin nugas atau drakoran. Yuk cobain sekarang sebelum kehabisan! ✨",
  hashtags: "#KeripikPisang #CemilanEnak #KulinerLokal #UMKMBisa #JajananKekinian",
  schedule: "Jumat, 19:00 WIB (Jam ramai audiens kuliner).",
};

// Helper untuk get/add Session ID
function getSessionId(): string {
  if (typeof window !== "undefined") {
    let sessionId = localStorage.getItem("kawan_session_id");
    if (!sessionId) {
      sessionId = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `sess-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("kawan_session_id", sessionId);
    }
    return sessionId;
  }
  return "default-session-id";
}

export async function generateCampaign(data: ProductFormValues) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  // MODE SIMULASI
  if (!apiUrl) {
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
    const file = data.photo && data.photo.length > 0 ? data.photo[0] : null;
    if (!file) throw new Error("Foto produk wajib diunggah");

    const sessionId = getSessionId();
    console.log("Mulai proses generasi untuk sesi:", sessionId);

    // Minta URL Upload
    console.log("1. Meminta Pre-signed URL...");
    const urlParams = new URLSearchParams({
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size.toString(),
    });
    
    const uploadUrlRes = await fetch(`${apiUrl}/upload-url?${urlParams}`);
    if (!uploadUrlRes.ok) throw new Error("Gagal mendapatkan link upload dari server");
    const { uploadUrl, photoKey } = await uploadUrlRes.json();

    // Upload Gambar ke S3/GCS
    console.log("2. Mengunggah gambar ke Cloud Storage...");
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
    if (!s3Res.ok) throw new Error("Gagal mengunggah gambar ke Cloud Storage");

    // Submit Job ke Backend
    console.log("3. Mengirim payload ke antrean (SQS/Tasks)...");
    const payload = {
      sessionId,
      productName: data.name,
      description: data.description,
      category: data.category,
      vibe: data.vibe,
      price: data.price || undefined,
      photoKey,
    };

    const generateRes = await fetch(`${apiUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!generateRes.ok) throw new Error("Gagal membuat antrean job");
    const { jobId } = await generateRes.json();

    // Polling Status (Nunggu AI selesai)
    console.log(`4. Memantau status Job [${jobId}]...`);
    let isComplete = false;
    while (!isComplete) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`${apiUrl}/status/${jobId}`);
      if (!statusRes.ok) throw new Error("Gagal mengecek status job");
      const statusData = await statusRes.json();

      console.log(`   Progress: ${statusData.progress}% (${statusData.status})`);

      if (statusData.status === "completed") {
        isComplete = true;
      } else if (statusData.status === "failed") {
        throw new Error("Proses AI gagal diproses oleh worker");
      }
    }

    // Ambil Hasil Akhir
    console.log("5. Mengambil hasil akhir...");
    const resultRes = await fetch(`${apiUrl}/result/${jobId}`);
    if (!resultRes.ok) throw new Error("Gagal mengambil data hasil AI");
    const resultData = await resultRes.json();

    // MAPPING
    const selectedCaption = resultData.captions?.find((c: any) => c.length === "sedang")?.text 
      || resultData.captions?.[0]?.text 
      || "Caption belum tersedia.";

    const joinedHashtags = resultData.hashtags?.join(" ") || "";

    const formattedSchedule = resultData.schedule 
      ? `${resultData.schedule.day}, ${resultData.schedule.time} (${resultData.schedule.reason}).`
      : "Jadwal belum tersedia.";

    return {
      bannerUrl: resultData.bannerUrl || "https://placehold.co/600x400.png?text=Banner+Sedang+Diproses",
      caption: selectedCaption,
      hashtags: joinedHashtags,
      schedule: formattedSchedule,
    };

  } catch (error) {
    console.error("Pipeline API Error:", error);
    throw error;
  }
}