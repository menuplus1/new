import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Amiri } from "next/font/google";
import "./globals.css";

// Body / UI — modern, crisp Arabic sans.
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

// Display — calligraphic Naskh serif for headlines (the "فخم" register).
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصّة المنيو الرقمي — منيو QR فاخر للمطاعم والمقاهي",
  description:
    "حوّل قائمة مطعمك إلى سُفرة رقمية أنيقة: منيو QR على كل طاولة، بلونك وشعارك ونطاقك الخاص، مع تحديث فوري للأسعار واستقبال الطلبات — بدون تطبيق.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plex.variable} ${amiri.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
