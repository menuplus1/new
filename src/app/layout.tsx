import type { Metadata } from "next";
import { Amiri, Cairo, Rubik, Tajawal } from "next/font/google";
import "./globals.css";

// Platform default — clean, modern, "system" feel.
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

// Menu templates pick their own personality from these (see src/components/menu).
const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "600", "700", "900"], variable: "--font-cairo", display: "swap" });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", display: "swap" });
const rubik = Rubik({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "900"], variable: "--font-rubik", display: "swap" });

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
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${cairo.variable} ${amiri.variable} ${rubik.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
