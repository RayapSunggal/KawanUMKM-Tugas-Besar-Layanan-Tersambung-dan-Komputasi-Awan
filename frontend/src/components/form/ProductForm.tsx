"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";

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

export default function ProductForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
    },
  });

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast.success("Berhasil disubmit!", {
      description: "Data sedang diproses...",
    });
    
    setIsSubmitting(false);
  }

  function onError() {
    toast.error("Formulir belum lengkap", {
      description: "Mohon periksa kembali isian yang berwarna merah.",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-5">
        
        <FormField
          control={form.control}
          name="photo"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Foto Produk</FormLabel>
              <FormControl>
                <div className="border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 hover:bg-blue-50 transition-colors cursor-pointer">
                  <Input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => onChange(e.target.files)}
                    {...rest}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-blue-500 mb-2" />
                    <p className="font-medium text-blue-600 text-sm">Klik untuk upload</p>
                    <p className="text-xs text-slate-400 mt-1">(Maks: 5MB)</p>
                  </label>
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
                  <SelectContent className="bg-white">
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
                  <SelectContent className="bg-white">
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
                <Input 
                  type="number" 
                  placeholder="Contoh: 25000" 
                  className="rounded-xl h-11 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  {...field} 
                />
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