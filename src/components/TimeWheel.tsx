import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Scroll-wheel time picker (hour : minute AM/PM). Value is minutes since midnight (0–1439).
// Three rows show at once; the middle one is the selection.
const ROW = 40;
const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad(i));
const PERIODS = ["AM", "PM"];

export const minutesLabel = (v: number) => {
  const h = Math.floor(v / 60);
  return `${h % 12 || 12}:${pad(v % 60)} ${h < 12 ? "AM" : "PM"}`;
};

function Column({ items, index, onChange, label }: { items: string[]; index: number; onChange: (i: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number>();

  // Keep the scroll position in step when the value changes from outside.
  useEffect(() => {
    const el = ref.current;
    if (el && Math.round(el.scrollTop / ROW) !== index) el.scrollTo({ top: index * ROW });
  }, [index]);

  return (
    <div
      ref={ref}
      aria-label={label}
      onScroll={(e) => {
        const el = e.currentTarget;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)));
          if (i !== index) onChange(i);
        }, 90);
      }}
      className="relative z-10 h-[120px] overflow-y-auto snap-y snap-mandatory overscroll-contain scrollbar-hide"
    >
      <div style={{ height: ROW }} />
      {items.map((it, i) => (
        <button
          type="button"
          key={it}
          onClick={() => { ref.current?.scrollTo({ top: i * ROW, behavior: "smooth" }); onChange(i); }}
          className={cn(
            "h-10 w-full snap-center flex items-center justify-center tabular-nums transition-colors",
            i === index ? "text-primary text-xl font-semibold" : "text-muted-foreground text-sm",
          )}
        >
          {it}
        </button>
      ))}
      <div style={{ height: ROW }} />
    </div>
  );
}

const TimeWheel = ({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: { hour: string; minute: string; period: string } }) => {
  // Columns can settle in the same tick (e.g. two flicked at once), so each change builds on the
  // latest value rather than the one from the last render.
  const latest = useRef(value);
  latest.current = value;
  const parts = (v: number) => ({ h12: Math.floor(v / 60) % 12 || 12, min: v % 60, pm: v >= 720 });
  const { h12, min, pm } = parts(value);
  const update = (patch: Partial<ReturnType<typeof parts>>) => {
    const p = { ...parts(latest.current), ...patch };
    const next = ((p.h12 % 12) + (p.pm ? 12 : 0)) * 60 + p.min;
    latest.current = next;
    onChange(next);
  };

  return (
    <div dir="ltr" className="relative grid grid-cols-[1fr_auto_1fr_1fr] items-center rounded-xl border border-border/60 bg-card px-2">
      <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 h-10 rounded-lg bg-primary/5" />
      <Column label={labels.hour} items={HOURS} index={h12 - 1} onChange={(i) => update({ h12: i + 1 })} />
      <span className="relative z-10 px-1 text-primary text-xl font-semibold">:</span>
      <Column label={labels.minute} items={MINUTES} index={min} onChange={(i) => update({ min: i })} />
      <Column label={labels.period} items={PERIODS} index={pm ? 1 : 0} onChange={(i) => update({ pm: i === 1 })} />
    </div>
  );
};

export default TimeWheel;
