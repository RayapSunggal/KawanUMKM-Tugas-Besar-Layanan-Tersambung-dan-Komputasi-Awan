"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCircle2, Sparkles, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

// Mock Data
const MOCK_RESULT = {
  bannerUrl: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1000&auto=format&fit=crop", // Gambar contoh
  caption: "Siapa bilang ngemil enak harus mahal? 🤤 Kenalin nih Keripik Pisang lumer yang bikin harimu makin manis! Cocok banget buat nemenin nugas atau drakoran. Yuk cobain sekarang sebelum kehabisan! ✨",
  hashtags: "#KeripikPisang #CemilanEnak #KulinerLokal #UMKMBisa #JajananKekinian",
  schedule: "Jumat, 19:00 WIB (Jam ramai audiens kuliner).",
};

export default function ResultView({ onBack }: { onBack: () => void }) {
  const [isCopied, setIsCopied] = useState(false);

  // Copy to Clipboard
  const handleCopy = () => {
    const textToCopy = `${MOCK_RESULT.caption}\n\n${MOCK_RESULT.hashtags}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success("Teks berhasil disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-8">
      
      {/* Header Sukses */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Kampanye Berhasil!</h2>
        <p className="text-sm text-slate-500">AI KawanUMKM telah menyusun paket promosi untukmu.</p>
      </div>

      {/* Preview Banner */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" /> Preview Banner
        </h3>
        <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <Image 
            src={MOCK_RESULT.bannerUrl} 
            alt="Banner Promosi" 
            fill 
            className="object-cover"
          />
        </div>
        <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 transition-colors font-semibold">
          <Download className="w-4 h-4 mr-2" /> Unduh Banner
        </Button>
      </div>

      {/* Caption & Tag */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Caption & Tag</h3>
        <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
          {MOCK_RESULT.caption}
        </p>
        <p className="text-blue-600 text-sm mt-4 font-medium">
          {MOCK_RESULT.hashtags}
        </p>
        
        {/* Tombol Copy */}
        <Button 
          size="icon" 
          variant="outline" 
          className="absolute top-2 right-2 transition-opacity bg-white hover:bg-slate-100 shadow-sm rounded-lg"
          onClick={handleCopy}
        >
          {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
        </Button>
      </div>
        
      {/* Jadwal Posting */}
      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-blue-950 mb-1">Rekomendasi Posting</h3>
          <p className="text-sm text-blue-800 leading-relaxed font-medium">
            {MOCK_RESULT.schedule}
          </p>
        </div>
      </div>

      {/* Tombol Buat Baru */}
      <Button 
        onClick={onBack}
        className="w-full rounded-xl h-12 text-md font-bold mt-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all"
      >
        Buat Promosi Lainnya
      </Button>

    </div>
  );
}