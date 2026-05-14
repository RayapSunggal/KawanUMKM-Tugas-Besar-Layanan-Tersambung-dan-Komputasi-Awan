"use client";

import { useState } from "react";
import ProductForm from "@/components/form/ProductForm";
import ResultView from "@/components/result/ResultView";
import LoadingView from "@/components/shared/LoadingView";
import Image from "next/image";

export default function Home() {
  const [view, setView] = useState<'input' | 'loading' | 'result'>('input');

  const handleStartGenerate = () => {
    setView('loading');
    setTimeout(() => {
      setView('result');
    }, 3000);
  };

  const handleReset = () => {
    setView('input');
  };

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image src="/logo.png" alt="Logo KawanUMKM" fill className="object-contain" priority />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kawan<span className="text-blue-600">UMKM</span>
          </h1>
        </header>

        {/* Konten Utama */}
        <div className="px-6 py-6 flex-1">
          {view === 'input' && (
            <>
              <div className="mb-6 animate-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Buat Promosi</h2>
                <p className="text-sm text-slate-500">Ubah foto produk biasa menjadi bahan promosi digital.</p>
              </div>
              <ProductForm onSuccess={handleStartGenerate} />
            </>
          )}

          {view === 'loading' && <LoadingView />}

          {view === 'result' && <ResultView onBack={handleReset} />}
        </div>
        
      </div>
    </main>
  );
}