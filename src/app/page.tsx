import Link from "next/link";
import { listRestaurants } from "@/lib/menu-data";

export const dynamic = "force-dynamic";

const FEATURES = [
  ["منيو رقمي بالصور", "أقسام وصور وأسعار — يتصفّحه الزبون من هاتفه بلا تطبيق"],
  ["طلب من الطاولة", "QR أو NFC لكل طاولة → المنيو يفتح برقم الطاولة والطلب يصل المطبخ"],
  ["بعلامتك التجارية", "شعارك وألوانك ولغتك — كل مطعم مستقل تماماً"],
  ["لوحة إدارة", "عدّل المنيو والأسعار والعروض لحظياً، وتابع الطلبات"],
];

export default async function Landing() {
  const tenants = await listRestaurants();
  return (
    <main dir="rtl" className="min-h-dvh bg-[#0f0f11] text-neutral-100">
      <div className="mx-auto max-w-4xl px-6">
        {/* hero */}
        <header className="py-20 text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-amber-400">منصّة المنيو الرقمي</p>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            منيو رقمي وطلب من الطاولة
            <br />
            <span className="text-amber-400">لكل مقهى ومطعم</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">
            منصّة واحدة تمنح كل مطعم منيوه الرقمي الخاص — بعلامته وطاولاته وطلباته — جاهز خلال يوم.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {tenants.map((t) => (
              <Link key={t.slug} href={`/${t.slug}`} className="rounded-xl px-5 py-3 font-bold text-neutral-900 transition hover:opacity-90" style={{ background: t.color }}>
                جرّب: {t.name}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">مطاعم تجريبية — كل واحد بلونه ومنيوه المستقل</p>
        </header>

        {/* features */}
        <section className="grid gap-4 pb-16 sm:grid-cols-2">
          {FEATURES.map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-bold text-amber-400">{title}</h3>
              <p className="mt-2 text-neutral-400">{desc}</p>
            </div>
          ))}
        </section>

        {/* how */}
        <section className="pb-24 text-center">
          <h2 className="text-2xl font-black">كيف يبدأ مطعمك؟</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {["نُهيّئ منيوك بعلامتك", "نولّد QR/NFC لطاولاتك", "الزبون يطلب → يصل مطبخك"].map((s, i) => (
              <div key={s} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="text-3xl font-black text-amber-400">{i + 1}</div>
                <p className="mt-2 font-semibold">{s}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-sm text-neutral-500">
          منصّة المنيو الرقمي — للمقاهي والمطاعم
        </footer>
      </div>
    </main>
  );
}
