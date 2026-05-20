"use client";

import { useCallback, useEffect, useState } from "react";
import ProductForm from "@/components/form/ProductForm";
import ResultView from "@/components/result/ResultView";
import LoadingView from "@/components/shared/LoadingView";
import ErrorView from "@/components/shared/ErrorView";
import HistoryView from "@/components/history/HistoryView";
import Image from "next/image";
import { History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchCampaignHistory,
  fetchCampaignResult,
  generateCampaign,
  type CampaignHistoryItem,
  type CampaignResult,
} from "@/services/api";
import type { ProductFormValues } from "@/lib/validations/product";

type ViewState = "input" | "loading" | "result" | "error" | "history";

export default function Home() {
  const [view, setView] = useState<ViewState>("input");
  const [savedFormData, setSavedFormData] = useState<Partial<ProductFormValues>>(
    {}
  );
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(
    null
  );
  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await fetchCampaignHistory());
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleStartGenerate = async (data: ProductFormValues) => {
    setView("loading");
    setSavedFormData(data);
    setErrorMessage(undefined);

    try {
      const result = await generateCampaign(data);
      setCampaignResult(result);
      await loadHistory();
      setView("result");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal membuat paket marketing."
      );
      setView("error");
    }
  };

  const handleSelectHistory = async (item: CampaignHistoryItem) => {
    if (item.status === "queued") {
      setErrorMessage("Hasil untuk job ini belum mulai diproses.");
      setView("error");
      return;
    }

    if (item.status === "failed") {
      setErrorMessage("Job ini gagal diproses.");
      setView("error");
      return;
    }

    setView("loading");
    setErrorMessage(undefined);

    try {
      const result = await fetchCampaignResult(item.jobId);
      setCampaignResult(result);
      setView("result");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil hasil riwayat."
      );
      setView("error");
    }
  };

  const handleStartOver = () => {
    setSavedFormData({});
    setCampaignResult(null);
    setErrorMessage(undefined);
    setView("input");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="Logo KawanUMKM"
                fill
                className="object-contain"
                priority
                sizes="40px"
                unoptimized
              />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Kawan<span className="text-blue-600">UMKM</span>
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              void loadHistory();
              setView("history");
            }}
            className="rounded-full text-slate-500"
            aria-label="Buka riwayat promosi"
          >
            <HistoryIcon className="w-6 h-6" />
          </Button>
        </header>

        <div className="px-6 py-6 flex-1">
          {view === "input" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Buat Promosi
                </h2>
                <p className="text-sm text-slate-500">
                  Ubah foto produk menjadi promosi digital.
                </p>
              </div>
              <ProductForm
                onSuccess={handleStartGenerate}
                initialData={savedFormData}
              />
            </div>
          )}

          {view === "loading" && <LoadingView />}
          {view === "result" && campaignResult && (
            <ResultView onBack={handleStartOver} data={campaignResult} />
          )}
          {view === "error" && (
            <ErrorView
              message={errorMessage}
              onRetry={() => setView(savedFormData ? "input" : "history")}
            />
          )}

          {view === "history" && (
            <HistoryView
              history={history}
              onSelect={handleSelectHistory}
              onBack={() => setView("input")}
            />
          )}
        </div>
      </div>
    </main>
  );
}
