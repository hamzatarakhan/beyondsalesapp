import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const CHIP = "px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 text-[11px] font-medium text-muted-foreground";
const MORE = "px-2.5 py-0.5 rounded-full bg-muted/50 text-[11px] font-medium text-muted-foreground";
const GAP = 6; // gap-1.5

// Order-card tag row, always a single line: shows as many chips as fit the card's current
// width, then a "+N More" chip for the rest. Chip and "+N More" widths are measured from an
// invisible copy of the row and re-fitted whenever the card resizes, so nothing is a fixed
// count. If even one chip can't fit beside "+N More", that chip truncates with an ellipsis.
// Pages pass their own chip/more classes to keep their existing chip look.
const TagChips = ({ chips, moreLabel, chipClassName = CHIP, moreClassName = MORE }: {
  chips: { key: string; label: ReactNode }[];
  moreLabel: (n: number) => string;
  chipClassName?: string;
  moreClassName?: string;
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(chips.length);
  const chipsKey = chips.map((c) => c.key).join("|");

  useLayoutEffect(() => {
    const row = rowRef.current;
    const measure = measureRef.current;
    if (!row || !measure) return;
    const fit = () => {
      const available = row.clientWidth;
      const nodes = Array.from(measure.children) as HTMLElement[];
      const chipW = nodes.slice(0, chips.length).map((n) => n.offsetWidth);
      // moreW[h] = width of the "+h More" chip (index 0 unused).
      const moreW = [0, ...nodes.slice(chips.length).map((n) => n.offsetWidth)];
      let used = 0;
      let best = 0;
      for (let k = 1; k <= chips.length; k++) {
        used += chipW[k - 1] + (k > 1 ? GAP : 0);
        const hidden = chips.length - k;
        if (used + (hidden ? GAP + moreW[hidden] : 0) <= available) best = k;
      }
      setVisible(Math.max(best, Math.min(1, chips.length)));
    };
    fit();
    // Watch the hidden copy too, so a late web-font swap that widens the chips re-fits.
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [chipsKey, chips.length, moreLabel]);

  const hidden = chips.length - visible;
  return (
    <div ref={rowRef} className="relative flex items-center gap-1.5 overflow-hidden">
      {chips.slice(0, visible).map((c) => (
        <span key={c.key} className={cn(chipClassName, "min-w-0 truncate whitespace-nowrap", visible > 1 && "shrink-0")}>{c.label}</span>
      ))}
      {hidden > 0 && <span className={cn(moreClassName, "shrink-0 whitespace-nowrap")}>{moreLabel(hidden)}</span>}

      <div ref={measureRef} aria-hidden className="absolute start-0 top-0 flex invisible pointer-events-none">
        {chips.map((c) => <span key={c.key} className={cn(chipClassName, "shrink-0 whitespace-nowrap")}>{c.label}</span>)}
        {chips.slice(1).map((c, i) => <span key={c.key} className={cn(moreClassName, "shrink-0 whitespace-nowrap")}>{moreLabel(i + 1)}</span>)}
      </div>
    </div>
  );
};

export default TagChips;
