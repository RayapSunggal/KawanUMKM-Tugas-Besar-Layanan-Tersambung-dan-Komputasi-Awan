import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KawanUMKM | AI Marketing Factory",
  description: "Platform cerdas untuk membantu UMKM menyusun strategi promosi digital, caption, hashtag, dan banner secara otomatis dengan bantuan AI.",
  icons: {
    icon: "/logo.png", 
    apple: "/logo.png",
  },
  openGraph: {
    title: "KawanUMKM | AI Marketing Factory",
    description: "Ubah foto produk biasa menjadi kampanye digital profesional dengan kekuatan AI.",
    siteName: "KawanUMKM",
    locale: "id_ID",
    type: "website",
  },
  authors: [{ name: "Tim Fisika IMPACT 5.0" }],
  keywords: ["umkm", "marketing", "ai", "promosi", "bandung", "kampanye digital"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
