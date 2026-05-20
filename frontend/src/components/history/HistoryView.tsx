"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Clock, Trash2 } from "lucide-react";
import type { CampaignHistoryItem } from "@/services/api";

interface HistoryViewProps {
  history: CampaignHistoryItem[];
  onSelect: (item: CampaignHistoryItem) => void;
  onClear?: () => void;
  onBack: () => void;
}

const statusLabel: Record<CampaignHistoryItem["status"], string> = {
  queued: "Antre",
  processing: "Diproses",
  completed: "Selesai",
  failed: "Gagal",
};

export default function HistoryView({
  history,
  onSelect,
  onClear,
  onBack,
}: HistoryViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-slate-900">Riwayat Promosi</h2>
        </div>
        {history.length > 0 && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" /> Hapus Semua
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
          <Clock className="w-12 h-12 mb-4 text-slate-300" />
          <p className="text-slate-500 italic">Belum ada riwayat promosi.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => {
            const isReady = item.status === "completed";
            return (
              <button
                key={item.jobId}
                type="button"
                onClick={() => onSelect(item)}
                className="group bg-white p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4 text-left disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="w-16 h-16 rounded-xl flex-shrink-0 border border-slate-100 bg-blue-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">
                    {item.productName}
                  </h4>
                  <p className="text-xs text-slate-500">{item.timestamp}</p>
                  <span
                    className={
                      isReady
                        ? "inline-flex mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full"
                        : "inline-flex mt-2 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-full"
                    }
                  >
                    {statusLabel[item.status]}
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
