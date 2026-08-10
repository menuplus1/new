import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

// Single family across the whole platform — clean, modern, "system" feel.
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصّة المنيو الرقمي — منيو QR للمطاعم والمقاهي",
  description:
    "حوّل قائمة مطعمك إلى منيو رقمي أنيق: QR على كل طاولة، بلونك وشعارك ونطاقك الخاص، مع تحديث فوري للأسعار واستقبال الطلبات — بدون تطبيق.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
