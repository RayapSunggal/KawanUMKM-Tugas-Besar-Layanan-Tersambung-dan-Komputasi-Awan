"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { UploadCloud, Image as ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Image from "next/image";

export default function ProductForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess: (data: ProductFormValues) => void;
  initialData?: Partial<ProductFormValues>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || "",
      ...(initialData?.category && { category: initialData.category }),
      ...(initialData?.vibe && { vibe: initialData.vibe }),
    },
  });

  const watchedPhoto = form.watch("photo");

    useEffect(() => {
    if (initialData?.photo && initialData.photo.length > 0) {
        form.setValue("photo", initialData.photo);
    }
    }, [initialData, form]);

    useEffect(() => {
    if (watchedPhoto && watchedPhoto.length > 0) {
        const file = watchedPhoto[0];
        const newPreviewUrl = URL.createObjectURL(file);
        setPhotoPreview(newPreviewUrl);
        return () => URL.revokeObjectURL(newPreviewUrl);
    } else {
        setPhotoPreview(null);
    }
    }, [watchedPhoto]);

  const handleRemovePhoto = () => {
    form.setValue("photo", undefined as any);
  };

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    onSuccess(data); 
    setIsSubmitting(false);
  }

  function onError() {
    toast.error("Formulir belum lengkap", {
      description: "Mohon periksa kembali isian yang berwarna merah.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-5 pb-8">
        
        <FormField
          control={form.control}
          name="photo"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Foto Produk</FormLabel>
              <FormControl>
                <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-6 transition-all">
                  
                  {!photoPreview && (
                    <div className="flex flex-col items-center justify-center text-slate-500 min-h-[160px]">
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => onChange(e.target.files)}
                        name={rest.name}
                        onBlur={rest.onBlur}
                        ref={rest.ref}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center py-4">
                        <UploadCloud className="w-12 h-12 text-blue-500 mb-2 animate-bounce-short" />
                        <p className="font-medium text-blue-600 text-sm">Klik untuk upload foto</p>
                        <p className="text-xs text-slate-400 mt-1">(Maks: 5MB, format .png/.jpg)</p>
                      </label>
                    </div>
                  )}

                  {photoPreview && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-2 animate-in fade-in duration-300">
                      <div className="relative w-full h-40 rounded-xl overflow-hidden shadow-md border-2 border-white">
                        <Image 
                          src={photoPreview} 
                          alt="Preview Foto UMKM" 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-blue-900 bg-blue-100 p-2 rounded-lg flex items-center gap-1.5 font-medium shadow-inner">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          Foto berhasil dipilih
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleRemovePhoto}
                          className="h-8 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 p-2 gap-1"
                        >
                          <X className="w-4 h-4" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Nama Produk</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Keripik Pisang" className="rounded-xl h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Deskripsi Singkat</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ceritakan keunggulan produkmu..." 
                  className="resize-none rounded-xl" 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-slate-700 font-semibold">Kategori</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Pilih..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl">
                    <SelectItem value="kuliner">Kuliner</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="kerajinan">Kerajinan</SelectItem>
                    <SelectItem value="jasa">Jasa</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vibe"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-slate-700 font-semibold">Vibe</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue placeholder="Pilih..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl">
                    <SelectItem value="Modern">Modern</SelectItem>
                    <SelectItem value="Tradisional">Tradisional</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Harga (Opsional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Contoh: 25000" className="rounded-xl h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full rounded-xl h-12 text-md font-bold mt-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 transition-all" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Memproses Data..." : "Generate Paket Marketing"}
        </Button>
      </form>
    </Form>
  );
}