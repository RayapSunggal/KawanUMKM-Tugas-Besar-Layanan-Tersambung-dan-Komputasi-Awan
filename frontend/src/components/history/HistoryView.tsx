"use client";

import { Button } from "@/components/ui/button";
import { Clock, ChevronRight, Trash2, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface HistoryItem {
  id: string;
  timestamp: string;
  productName: string;
  result: {
    bannerUrl: string;
    caption: string;
    hashtags: string;
    schedule: string;
  };
}

interface HistoryViewProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onBack: () => void;
}

export default function HistoryView({ history, onSelect, onClear, onBack }: HistoryViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-8">
      {/* Header Riwayat */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-slate-900">Riwayat Promosi</h2>
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-red-500 hover:text-red-600 hover:bg-red-50">
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
          {history.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelect(item)}
              className="group bg-white p-3 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4"
            >
              {/* Mini Preview Image */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                <Image 
                  src={item.result.bannerUrl} 
                  alt={item.productName} 
                  fill 
                  className="object-cover" 
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{item.productName}</h4>
                <p className="text-xs text-slate-500">{item.timestamp}</p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}