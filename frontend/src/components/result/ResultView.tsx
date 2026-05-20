"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  ImageOff,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import type { CampaignResult, CaptionVariant } from "@/services/api";

interface ResultViewProps {
  onBack: () => void;
  data: CampaignResult;
}

const captionLabels: Record<CaptionVariant["length"], string> = {
  pendek: "Pendek",
  sedang: "Sedang",
  panjang: "Panjang",
};

export default function ResultView({ onBack, data }: ResultViewProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `${data.caption}\n\n${data.hashtagsText}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    toast.success("Teks berhasil disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500 pb-8">
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Kampanye Berhasil!</h2>
        <p className="text-sm text-slate-500">
          Hasil ini diambil dari job backend yang memanggil AI GCP.
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-500" /> Preview Banner
        </h3>

        {data.bannerUrl ? (
          <>
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <Image
                src={data.bannerUrl}
                alt="Banner Promosi"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <Button
              asChild
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 transition-colors font-semibold"
            >
              <a href={data.bannerUrl} target="_blank" rel="noreferrer">
                <Download className="w-4 h-4 mr-2" /> Buka Banner
              </a>
            </Button>
          </>
        ) : (
          <div className="h-64 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center px-6">
            <ImageOff className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              Banner belum tersedia
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Caption tetap berhasil dibuat walau gambar gagal diproses.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Caption Instagram
        </h3>

        <div className="space-y-3">
          {data.captions.map((caption) => (
            <div
              key={caption.length}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-1">
                {captionLabels[caption.length]}
              </p>
              <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                {caption.text}
              </p>
            </div>
          ))}
        </div>

        <p className="text-blue-600 text-sm mt-4 font-medium leading-relaxed">
          {data.hashtagsText}
        </p>

        <Button
          size="icon"
          variant="outline"
          className="absolute top-2 right-2 transition-opacity bg-white hover:bg-slate-100 shadow-sm rounded-lg"
          onClick={handleCopy}
          aria-label="Salin caption dan hashtag"
        >
          {isCopied ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4 text-slate-500" />
          )}
        </Button>
      </div>

      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
        <CalendarDays className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-blue-950 mb-1">
            Rekomendasi Posting
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed font-medium">
            {data.scheduleText}
          </p>
        </div>
      </div>

      {data.contentIdeas.length > 0 && (
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
          <h3 className="text-sm font-semibold text-emerald-950 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600" /> Ide Konten
            Lanjutan
          </h3>
          <div className="space-y-2">
            {data.contentIdeas.map((idea, index) => (
              <p key={`${index}-${idea}`} className="text-sm text-emerald-900">
                {index + 1}. {idea}
              </p>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={onBack}
        className="w-full rounded-xl h-12 text-md font-bold mt-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all"
      >
        Buat Promosi Lainnya
      </Button>
    </div>
  );
}
