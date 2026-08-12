"use client";

import { Marquee } from "@/components/ui/3d-testimonails";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { TESTIMONIALS, type Testimonial } from "@/lib/testimonials";
import { cn } from "@/lib/utils";

/** 4 أعمدة، كل عمود يأخذ ربع الآراء — أخف من تكرار القائمة كاملة بكل عمود */
const PER_COL = Math.ceil(TESTIMONIALS.length / 4);
const COLUMNS = [0, 1, 2, 3].map((i) => TESTIMONIALS.slice(i * PER_COL, (i + 1) * PER_COL));

function TestimonialCard({ name, handle, city, body, img }: Testimonial) {
  return (
    <Card className="w-64 rounded-2xl" style={{ boxShadow: "var(--shadow-md)" }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarImage src={img} alt="" />
            <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-xs font-bold">{name}</div>
            <div className="truncate text-xs" style={{ color: "var(--ink-soft)" }}>
              {city}
            </div>
            <div className="truncate text-xs" style={{ color: "var(--ink-soft)" }}>
              @{handle}
            </div>
          </div>
        </div>
        <blockquote className="mt-3 text-sm leading-relaxed">{body}</blockquote>
      </CardContent>
    </Card>
  );
}

export function TestimonialsWall({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden [perspective:300px]", className)}
    >
      <div
        className="flex size-full flex-row items-center justify-center gap-4"
        style={{
          transform:
            "translateX(-100px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
        }}
      >
        {COLUMNS.map((column, i) => (
          <Marquee
            key={i}
            vertical
            pauseOnHover
            repeat={3}
            reverse={i % 2 === 1}
            className="[--duration:40s]"
            ariaRole="presentation"
          >
            {column.map((t) => (
              <TestimonialCard key={t.handle} {...t} />
            ))}
          </Marquee>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-[var(--bg)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[var(--bg)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[var(--bg)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[var(--bg)]" />
    </div>
  );
}

export default TestimonialsWall;
