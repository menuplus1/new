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
  metadataBase: new URL("https://menuplus.rest"),
  title: "منيو بلس (MenuPlus) — منيو QR وطلبات وحجوزات للمطاعم والمقاهي",
  description:
    "حوّل قائمة مطعمك إلى منيو رقمي أنيق: QR على كل طاولة، بلونك وشعارك ونطاقك الخاص، مع طلبات (صالة · دلفري · سفري)، حجز طاولات، ولوحة إدارة لكل مطعم — بدون تطبيق.",
  openGraph: {
    type: "website",
    locale: "ar_IQ",
    siteName: "منيو بلس",
    url: "https://menuplus.rest",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
