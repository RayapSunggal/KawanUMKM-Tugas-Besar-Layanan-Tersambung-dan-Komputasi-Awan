import ProductForm from "@/components/form/ProductForm";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex justify-center">
      
      {/* Kontainer Aplikasi */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        
        {/* Sticky Header + Logo */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Logo KawanUMKM" 
              fill 
              className="object-contain" 
              priority
            />
          </div>
          {/* Nama Web */}
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Kawan<span className="text-blue-600">UMKM</span>
          </h1>
        </header>

        {/* Konten Utama */}
        <div className="px-6 py-6 flex-1">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Buat Promosi</h2>
            <p className="text-sm text-slate-500">
              Ubah foto produk biasa menjadi bahan promosi digital dengan bantuan AI.
            </p>
          </div>
          
          {/* Form Component */}
          <ProductForm />
        </div>
        
      </div>
    </main>
  );
}