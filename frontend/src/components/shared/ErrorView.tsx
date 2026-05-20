"use client";

import { Button } from "@/components/ui/button";
import { ServerCrash, RefreshCcw } from "lucide-react";

export default function ErrorView({
  onRetry,
  message,
}: {
  onRetry: () => void;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
      
      {/* Ikon Error */}
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100 mb-2 shadow-inner">
        <ServerCrash className="w-12 h-12 text-red-500" />
      </div>
      
      {/* Pesan Error */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Oops! Koneksi Terganggu</h2>
        <p className="text-sm text-slate-500 max-w-[250px] mx-auto leading-relaxed">
          {message ??
            "Server AI KawanUMKM sedang sibuk atau koneksi internetmu terputus. Jangan khawatir, data formulirmu tetap aman."}
        </p>
      </div>

      {/* Tombol Coba Lagi */}
      <Button 
        onClick={onRetry}
        className="rounded-xl h-12 px-8 text-md font-bold mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Kembali & Coba Lagi
      </Button>

    </div>
  );
}
