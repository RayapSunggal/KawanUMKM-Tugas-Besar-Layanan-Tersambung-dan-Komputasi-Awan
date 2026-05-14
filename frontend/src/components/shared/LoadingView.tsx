"use client";

import { Loader2 } from "lucide-react";

export default function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-in fade-in duration-500">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">Sedang Meracik Strategi...</h3>
        <p className="text-sm text-slate-500">AI kami sedang membuatkan konten terbaik untuk UMKM-mu.</p>
      </div>
    </div>
  );
}