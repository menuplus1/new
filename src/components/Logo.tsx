/** الشعار الرسمي لمنيو بلس.
 *
 *  الأصل صورة بلونين (حبر + أزرق). حوّلناها إلى قناعَي شفافية (public/logo-ink.png
 *  و logo-accent.png) ونلوّنهما بالـCSS: الحبر يأخذ var(--ink) ولون العلامة يأخذ
 *  var(--brand) — فيتبدّل الشعار مع الثيم المختار تلقائياً، وعلى الخلفيات الداكنة
 *  يصير الحبر أبيض (tone="light"). نفس الشيء للعلامة المربّعة (mark-*.png). */

type Tone = "auto" | "light";

/** نسب الصور المقصوصة — تحافظ على القياس بلا قفزات تخطيط */
const FULL_RATIO = 1235 / 728;
const MARK_RATIO = 192 / 191;

const layer = (src: string, color: string): React.CSSProperties => ({
  background: color,
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskPosition: "center",
  maskPosition: "center",
});

const inkColor = (t: Tone) => (t === "light" ? "#ffffff" : "var(--ink, #10141b)");

/** العلامة المربّعة (الحرف + الشوكة) — للأيقونات والمساحات الضيقة */
export function LogoMark({ size = 36, tone = "auto", className = "" }: { size?: number; tone?: Tone; className?: string }) {
  const h = size;
  const w = Math.round(size * MARK_RATIO);
  return (
    <span className={`relative inline-block shrink-0 ${className}`} style={{ width: w, height: h }} aria-hidden>
      <span className="absolute inset-0" style={layer("/mark-ink.png", inkColor(tone))} />
      <span className="absolute inset-0" style={layer("/mark-accent.png", "var(--brand, #35c1f1)")} />
    </span>
  );
}

/** الشعار الكامل: «منيو بلس» + menuplus.rest — يتلوّن بالثيم */
export function Logo({
  height = 34,
  tone = "auto",
  className = "",
  title = "منيو بلس",
}: {
  height?: number;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  const w = Math.round(height * FULL_RATIO);
  return (
    <span className={`relative inline-block shrink-0 align-middle ${className}`} style={{ width: w, height }} role="img" aria-label={title}>
      <span className="absolute inset-0" style={layer("/logo-ink.png", inkColor(tone))} />
      <span className="absolute inset-0" style={layer("/logo-accent.png", "var(--brand, #35c1f1)")} />
    </span>
  );
}
