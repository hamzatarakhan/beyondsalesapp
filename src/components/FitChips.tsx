import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const CHIP = "shrink-0 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 text-[11px] font-medium text-muted-foreground whitespace-nowrap";
const MORE = "shrink-0 px-2.5 py-0.5 rounded-full bg-muted/50 text-[11px] font-medium text-muted-foreground whitespace-nowrap";
const GAP = 6;

// One row of tag chips that shows as many as fit the available width and folds the rest into a
// "+N More" chip — so wider screens show more tags and narrow ones never clip a chip mid-word.
const FitChips = ({ chips, moreLabel }: { chips: { key: string; label: ReactNode }[]; moreLabel: (n: number) => string }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(chips.length);
  const sig = chips.map((c) => c.key).join("|");

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure) return;
    const calc = () => {
      const kids = Array.from(measure.children) as HTMLElement[];
      const moreW = kids[kids.length - 1].offsetWidth;
      const max = wrap.clientWidth;
      let used = 0;
      let n = 0;
      for (let i = 0; i < chips.length; i++) {
        const next = used + (n ? GAP : 0) + kids[i].offsetWidth;
        const reserve = i < chips.length - 1 ? GAP + moreW : 0;
        if (next + reserve > max) break;
        used = next;
        n++;
      }
      setVisible(Math.max(1, n));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const hidden = chips.length - visible;
  return (
    <div ref={wrapRef} className="relative flex items-center gap-1.5 overflow-hidden">
      {chips.slice(0, visible).map((c) => <span key={c.key} className={CHIP}>{c.label}</span>)}
      {hidden > 0 && <span className={MORE}>{moreLabel(hidden)}</span>}
      <div ref={measureRef} aria-hidden="true" className="absolute start-0 top-0 flex items-center gap-1.5 invisible pointer-events-none">
        {chips.map((c) => <span key={c.key} className={CHIP}>{c.label}</span>)}
        <span className={MORE}>{moreLabel(chips.length)}</span>
      </div>
    </div>
  );
};

export default FitChips;
