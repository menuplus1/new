import type { CSSProperties } from "react";

export type PreviewItem = {
  name: string;
  desc: string;
  price: string; // e.g. "3,500"
  emoji: string;
  tile: string; // css gradient for the food tile
};

export type PreviewData = {
  name: string;
  logo: string; // emoji
  status: string;
  cats: string[];
  items: PreviewItem[];
  cartLabel: string;
  cartTotal: string;
};

/**
 * Image-free device rendering a live mini-menu, fully recolored by `accent`
 * through a single --tenant CSS var (color-mix). Powers the hero phone, the
 * tenants band, the live theme-switcher and (wide) the tablet section.
 */
export function MenuPreview({
  accent,
  data,
  wide = false,
  className = "",
  style,
}: {
  accent: string;
  data: PreviewData;
  wide?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const vars = { "--tenant": accent } as CSSProperties;
  return (
    <div
      className={className}
      style={{ ...vars, width: wide ? "100%" : "min(300px, 82vw)", ...style }}
    >
      {/* device shell */}
      <div
        className={wide ? "relative rounded-[30px] p-3" : "relative rounded-[44px] p-3"}
        style={{
          background: "linear-gradient(160deg,#14201f,#080f0f)",
          border: "1px solid rgba(16,179,163,.28)",
          boxShadow:
            "0 40px 80px -22px rgba(0,0,0,.55), 0 0 0 1px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06)",
        }}
      >
        {!wide && (
          <div
            className="absolute left-1/2 top-4 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full"
            style={{ background: "rgba(255,255,255,.14)" }}
          />
        )}
        {/* screen */}
        <div
          className={wide ? "overflow-hidden rounded-[22px]" : "overflow-hidden rounded-[34px]"}
          style={{ background: "#fbf6ec" }}
        >
          {/* brand header (tenant-tinted) */}
          <div
            className={wide ? "px-6 pb-4 pt-6" : "px-5 pb-4 pt-7"}
            style={{
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--tenant) 22%, #fbf6ec), #fbf6ec)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg"
                style={{
                  background:
                    "linear-gradient(140deg, var(--tenant), color-mix(in srgb, var(--tenant) 55%, #000))",
                  color: "#fff",
                  boxShadow: "0 6px 16px -4px color-mix(in srgb, var(--tenant) 60%, transparent)",
                }}
              >
                {data.logo}
              </div>
              <div>
                <div className="text-[15px] font-bold" style={{ color: "#2a2017" }}>
                  {data.name}
                </div>
                <div
                  className="mt-0.5 inline-flex items-center gap-1 text-[11px]"
                  style={{ color: "#7a6a56" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#2aa87a" }} />
                  {data.status}
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-hidden">
              {data.cats.map((c, i) => (
                <span
                  key={c}
                  className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium"
                  style={
                    i === 0
                      ? { background: "var(--tenant)", color: "#fff" }
                      : { background: "#efe6d6", color: "#7a6a56" }
                  }
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* items */}
          <div className={`px-4 py-4 ${wide ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}`}>
            {data.items.map((it) => (
              <div
                key={it.name}
                className="flex items-center gap-3 rounded-2xl bg-white p-2.5"
                style={{ border: "1px solid #ece1cf", boxShadow: "0 1px 2px rgba(42,32,23,.04)" }}
              >
                <div
                  className="flex h-14 w-14 flex-none items-center justify-center rounded-xl text-2xl"
                  style={{ background: it.tile }}
                >
                  {it.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold" style={{ color: "#2a2017" }}>
                    {it.name}
                  </div>
                  <div className="truncate text-[11px]" style={{ color: "#9a8a74" }}>
                    {it.desc}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[13px] font-bold">
                    <span style={{ color: "color-mix(in srgb, var(--tenant) 72%, #0c2a29)" }}>{it.price}</span>
                    <span className="ms-0.5 text-[9px]" style={{ color: "#9aa8a5" }}>
                      د.ع
                    </span>
                  </span>
                  <button
                    aria-hidden
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[15px] leading-none text-white"
                    style={{ background: "var(--tenant)" }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* cart bar */}
          <div
            className="mx-4 mb-4 flex items-center justify-between rounded-2xl px-4 py-3 text-white"
            style={{
              background:
                "linear-gradient(140deg, var(--tenant), color-mix(in srgb, var(--tenant) 60%, #000))",
            }}
          >
            <span className="text-[12px]">{data.cartLabel}</span>
            <span className="text-[13px] font-bold">
              {data.cartTotal} · إرسال الطلب
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ————— demo datasets (real demo tenants) ————— */
export const DALLAH: PreviewData = {
  name: "قهوة الدلّة",
  logo: "☕",
  status: "مفتوح الآن · طاولة 7",
  cats: ["ساخنة", "باردة", "حلويات"],
  cartLabel: "سلّتك · صنفان",
  cartTotal: "7,500",
  items: [
    { name: "قهوة عربية بالهيل", desc: "دلّة نحاسية · تمر", price: "3,500", emoji: "☕", tile: "linear-gradient(135deg,#e9cfa8,#c58a4e)" },
    { name: "لاتيه بالزعفران", desc: "حليب مبخّر · زعفران", price: "4,000", emoji: "🥛", tile: "linear-gradient(135deg,#f0dcae,#d9a86a)" },
    { name: "كنافة نابلسية", desc: "جبن · قطر · فستق", price: "5,000", emoji: "🍮", tile: "linear-gradient(135deg,#f2c98a,#c77c3a)" },
  ],
};

export const SHAM: PreviewData = {
  name: "مطعم بيت الشام",
  logo: "🍽️",
  status: "مفتوح الآن · طاولة 3",
  cats: ["مقبلات", "مشاوي", "أطباق"],
  cartLabel: "سلّتك · 3 أصناف",
  cartTotal: "19,000",
  items: [
    { name: "حمص بيروتي", desc: "طحينة · زيت زيتون", price: "3,000", emoji: "🫓", tile: "linear-gradient(135deg,#d7e4b8,#8fae63)" },
    { name: "مشاوي مشكّلة", desc: "لحم · دجاج · كباب", price: "12,500", emoji: "🍢", tile: "linear-gradient(135deg,#e7b98f,#b56a3c)" },
    { name: "تبولة", desc: "بقدونس · برغل · ليمون", price: "3,500", emoji: "🥗", tile: "linear-gradient(135deg,#cfe6a8,#7fa554)" },
  ],
};
