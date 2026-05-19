"use client";

import { useState, useEffect } from "react";
import ProductForm from "@/components/form/ProductForm";
import ResultView from "@/components/result/ResultView";
import LoadingView from "@/components/shared/LoadingView";
import ErrorView from "@/components/shared/ErrorView";
import HistoryView from "@/components/history/HistoryView";
import Image from "next/image";
import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateCampaign } from "@/services/api";

export default function Home() {
  const [view, setView] = useState<'input' | 'loading' | 'result' | 'error' | 'history'>('input');
  const [savedFormData, setSavedFormData] = useState<any>({});
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("kawan_umkm_history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const handleStartGenerate = async (data: any) => {
    setView('loading');
    setSavedFormData(data); 

    try {
      const result = await generateCampaign(data);
      setCampaignResult(result);

      const newHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        productName: data.name,
        result: result
      };
      
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10); // Simpan maks 10 riwayat
      setHistory(updatedHistory);
      localStorage.setItem("kawan_umkm_history", JSON.stringify(updatedHistory));

      setView('result');
    } catch (error) {
      setView('error');
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("kawan_umkm_history");
  };

  const handleSelectHistory = (item: any) => {
    setCampaignResult(item.result);
    setView('result');
  };

  const handleStartOver = () => {
    setSavedFormData({});
    setCampaignResult(null); 
    setView('input');
  };

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="Logo KawanUMKM" fill className="object-contain" priority sizes="40px"/>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Kawan<span className="text-blue-600">UMKM</span>
            </h1>
          </div>
          
          {/* Tombol ke Riwayat */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setView('history')}
            className="rounded-full text-slate-500"
          >
            <HistoryIcon className="w-6 h-6" />
          </Button>
        </header>

        <div className="px-6 py-6 flex-1">
          {view === 'input' && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Buat Promosi</h2>
                <p className="text-sm text-slate-500">Ubah foto produk menjadi promosi digital.</p>
              </div>
              <ProductForm onSuccess={handleStartGenerate} initialData={savedFormData} />
            </div>
          )}

          {view === 'loading' && <LoadingView />}
          {view === 'result' && <ResultView onBack={handleStartOver} data={campaignResult} />}
          {view === 'error' && <ErrorView onRetry={() => setView('input')} />}
          
          {view === 'history' && (
            <HistoryView 
              history={history} 
              onSelect={handleSelectHistory} 
              onClear={handleClearHistory} 
              onBack={() => setView('input')}
            />
          )}
        </div>
      </div>
    </main>
  );
}