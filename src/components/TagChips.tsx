import type { ReactNode } from "react";

const CHIP = "min-w-0 truncate px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 text-[11px] font-medium text-muted-foreground whitespace-nowrap";
const MORE = "shrink-0 px-2.5 py-0.5 rounded-full bg-muted/50 text-[11px] font-medium text-muted-foreground whitespace-nowrap";

// Order-card tag row: the first `max` chips (2 by default), then a "+N More" chip. A long chip
// truncates with an ellipsis instead of pushing the "+N More" chip out of the card.
const TagChips = ({ chips, moreLabel, max = 2 }: { chips: { key: string; label: ReactNode }[]; moreLabel: (n: number) => string; max?: number }) => (
  <div className="flex items-center gap-1.5 overflow-hidden">
    {chips.slice(0, max).map((c) => <span key={c.key} className={CHIP}>{c.label}</span>)}
    {chips.length > max && <span className={MORE}>{moreLabel(chips.length - max)}</span>}
  </div>
);

export default TagChips;
