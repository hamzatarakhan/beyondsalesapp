import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addMonths, format, subDays } from "date-fns";
import { ArrowDown, ArrowLeft, Banknote, Check, ChevronRight, Info, Search, SlidersHorizontal, User, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// Prototype-only: every figure below is demo data copied from the Commission Report designs.
// One page serves both roles — ?view=dealer shows the dealer's own report, ?view=manager adds
// the Overview tab (team commission, dealers list) in front of the same "My Commission" tab.
// Drill-down screens are a local stack so Back always steps up one level, then leaves.

type BreakdownKind = "scheme2prepaid" | "scheme2postpaid" | "pli" | "hbb" | "fr" | "clawbacks" | "hbbClawbacks";
type Screen = "plans" | "scheme1" | BreakdownKind | "activities" | "members";

const GAUGE = "hsl(var(--kpi-gauge))";
const GAUGE_BRIGHT = "hsl(var(--kpi-gauge-bright))";
const GAUGE_TRACK = "hsl(var(--kpi-gauge-track))";

const POS = "text-emerald-600 dark:text-emerald-400";

// Amount with riyal symbol. `sign` prefixes +/- and colours green/red; without it the number stays neutral.
const Money = ({ v, sign, className }: { v: number | string; sign?: boolean; className?: string }) => {
  const n = typeof v === "number" ? v : null;
  const prefix = n !== null && sign ? (n < 0 ? "-" : "+") : "";
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", n !== null && sign && (n < 0 ? "text-rose-600" : POS), className)}>
      <RiyalSymbol /> {prefix}{n !== null ? Math.abs(n).toLocaleString() : v}
    </span>
  );
};

// Progress bar with an optional black target tick, as in the KPI designs.
const Gauge = ({ pct, tick, danger, thick }: { pct: number; tick?: number; danger?: boolean; thick?: boolean }) => (
  <div className={cn("relative rounded-full", thick ? "h-2" : "h-1.5")} style={{ background: GAUGE_TRACK }}>
    <div className={cn("h-full rounded-full", danger && "bg-primary")} style={{ width: `${Math.min(100, pct)}%`, background: danger ? undefined : GAUGE }} />
    {tick !== undefined && <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-foreground" style={{ insetInlineStart: `${tick}%` }} />}
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-2xl bg-card shadow-sm p-4", className)}>{children}</div>
);

const Heading = ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-semibold text-foreground px-1 pt-1">{children}</h3>;

const Pill = ({ children, tone = "good" }: { children: React.ReactNode; tone?: "good" | "bad" | "wait" }) => (
  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border-[0.5px] inline-flex items-center gap-1 whitespace-nowrap",
    tone === "good" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
      : tone === "wait" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
      : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30")}>{children}</span>
);

const IconBox = ({ tone = "good", children }: { tone?: "good" | "bad" | "none"; children: React.ReactNode }) => (
  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", tone === "good" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20" : tone === "none" ? "bg-muted text-muted-foreground" : "bg-rose-100 text-rose-600 dark:bg-rose-500/20")}>{children}</div>
);

const Banner = ({ label, value, tone = "good", badge, note }: { label: string; value: number; tone?: "good" | "bad" | "none"; badge?: string; note?: string }) => (
  <div className={cn("rounded-2xl px-4 py-3 border", tone === "good" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : tone === "none" ? "bg-card border-border" : "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30")}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <IconBox tone={tone}><Banknote className="w-4 h-4" /></IconBox>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      {badge && <Pill>{badge}</Pill>}
    </div>
    <p className={cn("text-2xl font-bold mt-2", tone === "bad" ? "text-rose-600" : tone === "none" ? "text-muted-foreground" : POS)}><Money v={value} /></p>
    {note && <p className={cn("text-xs mt-1", tone === "none" ? "text-muted-foreground" : "text-rose-600")}>{note}</p>}
  </div>
);

const Chev = () => <ChevronRight className="w-4 h-4 text-primary shrink-0 rtl:rotate-180" />;

const WeightChip = () => <span className="mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-700 border-[0.5px] border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30">Weight 100%</span>;

// One plan line. `plain` = white card (My Plans list); default = grey inner card (My Plan card).
const PlanRow = ({ title, sub, weight, value, onClick, danger, plain, missed }: { title: string; sub?: string; weight?: boolean; value: number; onClick?: () => void; danger?: boolean; plain?: boolean; missed?: boolean }) => (
  <button type="button" onClick={onClick} disabled={!onClick}
    className={cn("w-full text-start flex items-center gap-3 rounded-xl px-3 py-3 disabled:cursor-default", plain ? "bg-card shadow-sm" : "bg-muted/50 border border-border/50")}>
    {danger && <IconBox tone="bad"><ArrowDown className="w-4 h-4" /></IconBox>}
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-foreground truncate">{title}</p>
      {sub && <p className={cn("text-[11px] truncate mt-0.5", missed ? "text-rose-600" : "text-muted-foreground")}>{sub}</p>}
      {weight && <WeightChip />}
    </div>
    <span className="text-xs font-semibold">{missed ? <Money v={0} className="text-rose-600" /> : value === 0 ? <Money v={0} className="text-muted-foreground" /> : <Money v={value} sign />}</span>
    {onClick && <Chev />}
  </button>
);

// `fill` makes the chips share the row equally instead of scrolling, so a short fixed set always fits.
// `clearable`: the first item means "no filter"; any other selected item shows as a red outline chip with ×, and tapping it
// clears back to the first item (Activities design).
const Chips = ({ items, value, onChange, fill, dotItem, clearable }: { items: string[]; value: string; onChange: (v: string) => void; fill?: boolean; dotItem?: string; clearable?: boolean }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar">
    {items.map((c) => {
      const on = value === c;
      const filterChip = clearable && on && c !== items[0];
      return (
        <button key={c} type="button" onClick={() => onChange(filterChip ? items[0] : c)} aria-pressed={on}
          className={cn("py-1.5 rounded-full text-xs font-medium whitespace-nowrap border inline-flex items-center justify-center gap-1", fill ? "flex-1 min-w-0 px-2" : "px-4 shrink-0",
            filterChip ? "bg-card border-primary text-primary" : on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>
          {c}{filterChip && <X className="w-3 h-3" />}{dotItem === c && <span className="ms-0.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle" />}
        </button>
      );
    })}
  </div>
);

const Tabs = ({ items, value, onChange }: { items: [string, string][]; value: string; onChange: (v: string) => void }) => (
  <div className="flex border-b border-border">
    {items.map(([k, label]) => (
      <button key={k} type="button" onClick={() => onChange(k)}
        className={cn("flex-1 py-2.5 text-xs font-semibold border-b-2 -mb-px", value === k ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
        {label}
      </button>
    ))}
  </div>
);

// Flip to true to empty every Commission Report list and preview the "No data found" states.
const DEMO_NO_DATA = false;

// One empty state for every Commission Report list, as designed: red user icon in a pink circle, bold title,
// grey hint. noData = nothing to show at all; match = search or filters matched nothing (filters clear from their chips).
type EmptyKind = "noData" | "match";
const EmptyState = ({ title, hint, compact }: { title: string; hint: string; compact?: boolean }) => (
  <div className={cn("flex flex-col items-center justify-center text-center gap-1.5 px-6", compact ? "py-6" : "min-h-[50vh] py-12")}>
    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center mb-1"><User className="w-4 h-4 text-primary" /></div>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground">{hint}</p>
  </div>
);
// Which empty state a list needs: none when it has rows, "noData" when there is nothing at all, else "match".
const emptyKind = (total: number, shown: number): EmptyKind | null => (shown > 0 ? null : total === 0 ? "noData" : "match");

const SearchBar = ({ value, onChange, placeholder, onFocus, onClear }: { value: string; onChange: (v: string) => void; placeholder: string; onFocus?: () => void; onClear?: () => void }) => (
  <div className="flex gap-2">
    <div className="relative flex-1">
      <Input value={value} onChange={(e) => onChange(e.target.value)} onFocus={onFocus} placeholder={placeholder} className="h-12 bg-card rounded-xl pe-10 border-0 shadow-sm" />
      {onClear && value ? (
        <button type="button" onClick={onClear} aria-label={placeholder} className="absolute end-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>
      ) : <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
    </div>
  </div>
);

// Demo "today" is Nov 2026. The running month is never shown (its calculation hasn't run), so Last month, Oct 2026, is the latest.
const LATEST_MONTH = new Date(2026, 9, 1);
// The three months that have their own chip: Last month, then the two before it (July, June).
const CHIP_MONTHS = [0, -1, -2].map((n) => addMonths(LATEST_MONTH, n));
// Custom sheet: the 12 completed months up to Last month (Nov 2025 – Oct 2026), each pill labelled with its year.
const YEAR_MONTHS = Array.from({ length: 12 }, (_, m) => new Date(2025, 10 + m, 1));

// "Filter" bottom sheet behind the Custom chip: the YEAR_MONTHS range as pills, opened on the month
// the home chips currently show. Apply commits; Clear Filter goes back to Last month.
const MonthFilterSheet = ({ open, onOpenChange, value, months, onApply, onClear }: { open: boolean; onOpenChange: (o: boolean) => void; value: Date; months: Date[]; onApply: (d: Date) => void; onClear: () => void }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[90vh]">
        <div className="relative flex items-center justify-center py-2">
          <DrawerTitle className="text-lg font-medium text-foreground">{t("commissionReport.filter")}</DrawerTitle>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t("settings.close")} className="absolute end-0 w-9 h-9 rounded-full border border-border flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <DrawerDescription className="text-sm text-foreground pt-3 pb-2">{t("commissionReport.selectCustomMonth")}</DrawerDescription>
        <div className="flex flex-wrap gap-2 pb-4">
          {months.map((d) => {
            const on = draft.getTime() === d.getTime();
            return (
              <button key={d.getMonth()} type="button" onClick={() => setDraft(d)} aria-pressed={on}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {format(d, "MMMM yyyy")}
              </button>
            );
          })}
        </div>
        <Button onClick={() => { onApply(draft); onOpenChange(false); }} className="w-full h-12 rounded-full text-base font-medium">
          {t("commissionReport.apply")}
        </Button>
        <button type="button" onClick={() => { onClear(); onOpenChange(false); }} className="w-full h-11 mt-1 text-sm font-medium text-primary">
          {t("commissionReport.clearFilter")}
        </button>
      </DrawerContent>
    </Drawer>
  );
};

// Month chips (Last month, July, June) plus a Custom chip that opens MonthFilterSheet. One selected month drives
// both: picking a chip month in the sheet lights that chip; any other month shows its name on the Custom chip.
const useCustomMonth = (first: string, { delayed, join }: { delayed: boolean; join: Date | null }) => {
  const since = (d: Date) => !join || d.getTime() >= join.getTime();
  const chipMonths = CHIP_MONTHS.filter(since);
  const sheetMonths = YEAR_MONTHS.filter(since);
  // A dealer who joined after Last month has no chips: the report opens on their first active month instead.
  const home = chipMonths.length ? LATEST_MONTH : sheetMonths[0];
  const { t } = useTranslation();
  const [month, setMonth] = useState(LATEST_MONTH);
  const [open, setOpen] = useState(false);
  // Picking another month "reloads" the data: the shared brand loader covers the page for a moment, then the month's numbers show.
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const pick = (d: Date) => {
    if (d.getTime() === month.getTime()) return;
    setMonth(d);
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), 1000);
  };
  // Join date moved past the month on screen: jump to the first month the dealer was active.
  useEffect(() => { if (!since(month)) pick(home); }, [join]);
  const chipLabels = chipMonths.map((d) => (d.getTime() === LATEST_MONTH.getTime() ? first : format(d, "MMMM")));
  const chip = chipMonths.findIndex((d) => d.getTime() === month.getTime());
  const customLabel = chip === -1 ? format(month, "MMM yyyy") : t("commissionReport.custom");
  return {
    month,
    loading,
    factor: monthFactor(month),
    monthName: format(month, "MMMM"),
    join,
    // Last month's calculation can be delayed; the chip gets a dot and the report shows a Pending state.
    pending: delayed && month.getTime() === LATEST_MONTH.getTime(),
    pendingChip: delayed ? first : undefined,
    items: [...chipLabels, customLabel],
    chipValue: chip === -1 ? customLabel : chipLabels[chip],
    onChipChange: (v: string) => (v === customLabel ? setOpen(true) : pick(chipMonths[chipLabels.indexOf(v)])),
    drawer: <MonthFilterSheet open={open} onOpenChange={setOpen} value={month} months={sheetMonths} onApply={pick} onClear={() => pick(home)} />,
  };
};

// One selected month for the whole report (both roles, every tab and drill-down). Every figure is scaled by that
// month's payout relative to the latest month, so the numbers change whichever screen the filter was used on.
const monthFactor = (d: Date) => (PAYOUT.find((p) => p.date.getTime() === d.getTime())?.v ?? PAYOUT[PAYOUT.length - 1].v) / PAYOUT[PAYOUT.length - 1].v;
const PeriodContext = createContext<ReturnType<typeof useCustomMonth> | null>(null);
const usePeriod = () => useContext(PeriodContext)!;
const useScale = () => { const { factor } = usePeriod(); return (v: number) => Math.round(v * factor); };
const scaleCount = (text: string, factor: number) => text.replace(/[\d,]+/, (n) => { const v = Number(n.replace(/,/g, "")); return (v === 0 ? 0 : Math.max(1, Math.round(v * factor))).toLocaleString(); });

// Scheme 1 KPIs. A killer KPI below its minimum sets the whole plan to 0.
const KPI_MIN = 70;
const KPI_MAX = 120;
type Kpi = { name: string; achieved: number; killer: boolean };
const missedKiller = (k: Kpi) => k.killer && k.achieved < KPI_MIN;
const kpiRows = (killerMissed: boolean): Kpi[] => [
  { name: "V FPE", achieved: killerMissed ? 80 : 88, killer: true }, { name: "F FPE", achieved: killerMissed ? 60 : 81, killer: true }, { name: "V IBR", achieved: 80, killer: false },
  { name: "F IBR", achieved: 80, killer: false }, { name: "F IBR", achieved: 80, killer: false },
];

// Demo only: lets a walkthrough show both outcomes. True = a killer KPI is below its minimum.
const KillerDemoContext = createContext(false);
const useScheme1 = () => {
  const killerMissed = useContext(KillerDemoContext);
  const rows = kpiRows(killerMissed);
  return { rows, missedKillers: rows.filter(missedKiller), missed: killerMissed };
};

const KillerDemoSwitch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-3 py-2">
    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Demo: Killer KPI</span>
    <div className="flex gap-1">
      {([[false, "Above min"], [true, "Below min"]] as const).map(([v, label]) => (
        <button key={label} type="button" onClick={() => onChange(v)} aria-pressed={value === v}
          className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium", value === v ? "bg-amber-600 text-white" : "text-amber-700 dark:text-amber-300")}>
          {label}
        </button>
      ))}
    </div>
  </div>
);

const DemoRow = ({ label, options, value, onChange }: { label: string; options: string[]; value: number; onChange: (i: number) => void }) => (
  <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-3 py-2">
    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0">{label}</span>
    <div className="flex gap-1 overflow-x-auto no-scrollbar">
      {options.map((o, i) => (
        <button key={o} type="button" onClick={() => onChange(i)} aria-pressed={value === i}
          className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap", value === i ? "bg-amber-600 text-white" : "text-amber-700 dark:text-amber-300")}>
          {o}
        </button>
      ))}
    </div>
  </div>
);
// Demo: when the dealer joined. Months before that month are hidden from the chips, the filter sheet and the payout chart.
const JOIN_DEMO: [string, Date | null][] = [["Full year", null], ["Mar 2026", new Date(2026, 2, 1)], ["Sep 2026", new Date(2026, 8, 1)]];

const MissedBanner = () => {
  const { missedKillers } = useScheme1();
  const note = missedKillers.length === 1
    ? `${missedKillers[0].name} is a killer KPI and missed its ${KPI_MIN}% minimum.`
    : `${missedKillers.map((k) => k.name).join(" and ")} are killer KPIs and missed their ${KPI_MIN}% minimum.`;
  return <Banner label="No commission" value={0} tone="bad" note={note} />;
};
const Scheme1Row = ({ plain, go }: { plain?: boolean; go: (s: Screen) => void }) => {
  const { missed } = useScheme1();
  const sc = useScale();
  return <PlanRow plain={plain} title="Scheme 1 Commission" weight value={sc(6550)} missed={missed} sub={missed ? "Killer KPI missed" : undefined} onClick={() => go("scheme1")} />;
};

// ---------------------------------------------------------------- "My Commission" (also the per-member view)

// Payouts Nov 2025 – Oct 2027: the year up to Last month, plus a year after it (demo values).
const PAYOUT = [7400, 8900, 9600, 12100, 7800, 9100, 8200, 11400, 10200, 13200, 13800, 14200,
  14600, 15100, 13900, 16200, 12800, 13500, 14900, 15800, 15200, 16700, 17300, 17900]
  .map((v, i) => ({ date: addMonths(LATEST_MONTH, i - 11), v }));
// Bar labels must stay within ~4-5 characters: 14.2k, then 123k (no decimal once it reaches six digits), then 1.2M.
const compact = (v: number) => v >= 999500 ? `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M` : v >= 1e5 ? `${Math.round(v / 1000)}k` : `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
// Flip to true to show the "Demo: amounts" switch above the payout chart.
const SHOW_PAYOUT_DEMO = false;
// Prototype-only payout sizes for the chart: the real data, ten times, a hundred times, and one of every label length.
const MIXED = [450, 7400, 14200, 99949, 122660, 456000, 999500, 1226600, 3400000, 12500000, 7400, 14200];
const PAYOUT_DEMO = {
  normal: (v: number) => v,
  hundredK: (v: number) => v * 10,
  millions: (v: number) => v * 100,
  mixed: (_: number, i: number) => MIXED[i % MIXED.length],
};
const PAYOUT_DEMO_LABEL = { normal: "Thousands", hundredK: "100k+", millions: "Millions", mixed: "Mixed" };
const RANGES = [["3", "last3"], ["6", "last6"], ["12", "last12"]] as const;
const MONTH_EARNED: Record<string, number> = { August: 74000, July: 68500, June: 61200 };

// Dealer's own report shows 11,230 (5,100 without Scheme 1); a manager viewing a member sees that member's month figures (74,000 for August).
const MyCommission = ({ go, member }: { go: (s: Screen) => void; member?: boolean }) => {
  const { t } = useTranslation();
  const period = usePeriod();
  const sc = useScale();
  const { missed } = useScheme1();
  // Payout window: the 3, 6 or 12 months ending at the selected month, which is the highlighted last bar.
  const [range, setRange] = useState<(typeof RANGES)[number][0]>("6");
  // Demo only: shows how the bar labels cope with bigger payouts (hundreds of thousands, millions, or a mix).
  const [size, setSize] = useState<keyof typeof PAYOUT_DEMO>("normal");
  const end = PAYOUT.findIndex((p) => p.date.getTime() === period.month.getTime());
  const payout = DEMO_NO_DATA ? [] : PAYOUT.map((p, i) => ({ ...p, v: PAYOUT_DEMO[size](p.v, i) })).slice(0, (end === -1 ? 11 : end) + 1).filter((p) => !period.join || p.date.getTime() >= period.join.getTime()).slice(-Number(range));
  const rangeTitle = t(`commissionReport.${RANGES.find(([k]) => k === range)![1]}`);
  const pending = period.pending;
  const max = Math.max(...payout.filter((p) => !(pending && p.date.getTime() === period.month.getTime())).map((p) => p.v));
  // 12 months don't fit side by side on small phones (320px leaves ~18px per bar), so they scroll sideways at the same
  // bar size as the 6-month chart, opening on the latest month; a fade on the left shows there is more.
  const scroll = payout.length > 6;
  const scroller = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !scroll) return;
    el.scrollLeft = el.scrollWidth;
    setAtStart(el.scrollLeft < 4);
  }, [scroll, size, end]);
  const month = period.monthName;
  const lit = period.month.getTime();
  // Last month's calculation delayed (not calculated yet): only the month chips and the No Commissions screen.
  if (pending) return (
    <div className="space-y-4">
      <Chips items={period.items} value={period.chipValue} onChange={period.onChipChange} dotItem={period.pendingChip} />
      {period.drawer}
      <EmptyState title={t("commissionReport.noCommissionsTitle")} hint={t("commissionReport.noCommissionsHint")} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Chips items={period.items} value={period.chipValue} onChange={period.onChipChange} dotItem={period.pendingChip} />
      {period.drawer}
      <>
      <Banner label={t("commissionReport.earnedIn", { month })} value={member ? MONTH_EARNED[month] ?? 52300 : sc(missed ? 0 : 5980)} badge={t("commissionReport.approved")} />
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">{t("commissionReport.myPlan")}</h3>
          <button type="button" onClick={() => go("plans")} className="text-sm font-medium text-blue-600 dark:text-blue-400 [[data-brand=friendi]_&]:text-primary dark:[[data-brand=friendi]_&]:text-primary flex items-center gap-0.5">{t("commissionReport.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></button>
        </div>
        {DEMO_NO_DATA ? <EmptyState title={t("commissionReport.noPlansTitle")} hint={t("commissionReport.noPlansHint")} compact /> : (
        <div className="space-y-3">
          <Scheme1Row go={go} />
          <PlanRow title="Scheme 2 Prepaid KPI" weight value={0} sub={ZERO_PLAN_REASON} onClick={() => go("scheme2prepaid")} />
          <PlanRow title="Postpaid Claw backs" sub="6 Lines stopped before 3rd bill" value={sc(-150)} danger onClick={() => go("clawbacks")} />
        </div>
        )}
      </Card>
      <Heading>{t("commissionReport.payout")}</Heading>
      {SHOW_PAYOUT_DEMO && <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 px-3 py-2">
        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 shrink-0">Demo: amounts</span>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {(Object.keys(PAYOUT_DEMO) as (keyof typeof PAYOUT_DEMO)[]).map((k) => (
            <button key={k} type="button" onClick={() => setSize(k)} aria-pressed={size === k}
              className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap", size === k ? "bg-amber-600 text-white" : "text-amber-700 dark:text-amber-300")}>
              {PAYOUT_DEMO_LABEL[k]}
            </button>
          ))}
        </div>
      </div>}
      {/* Same pill chips as the month row at the top, per design. */}
      <Chips fill items={RANGES.map(([, label]) => t(`commissionReport.${label}`))} value={rangeTitle}
        onChange={(v) => setRange(RANGES.find(([, label]) => t(`commissionReport.${label}`) === v)![0])} />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{rangeTitle}</h3>
          <span className="text-[11px] text-muted-foreground">SAR, Approved Runs</span>
        </div>
        {payout.length === 0 && <EmptyState title={t("commissionReport.noPayoutTitle")} hint={t("commissionReport.noPayoutHint")} compact />}
        {payout.length > 0 && <div ref={scroller} onScroll={(e) => setAtStart(e.currentTarget.scrollLeft < 4)}
          className={cn("flex items-end h-56", scroll ? "gap-2 overflow-x-auto no-scrollbar snap-x" : "justify-center gap-3", scroll && !atStart && "[mask-image:linear-gradient(to_right,transparent,black_28px)]")}>
          {payout.map(({ date, v }) => {
            const last = date.getTime() === lit;
            const m = format(date, "MMM");
            const wait = last && pending;
            return (
              <div key={m} className={cn("flex flex-col items-center gap-1.5 h-full justify-end", scroll ? "w-11 shrink-0 snap-start" : "flex-1 min-w-0 max-w-16")}>
                <span className={cn("tabular-nums whitespace-nowrap text-[11px]", last ? "font-semibold" : "text-muted-foreground")} style={last ? { color: GAUGE } : undefined}>{wait ? "—" : v >= (scroll ? 1e5 : 999500) ? compact(v) : v.toLocaleString()}</span>
                <div className={cn("w-full rounded-md", wait && "border border-dashed border-muted-foreground/40")} style={wait ? { height: "12%" } : { height: `${(v / max) * 82}%`, background: last ? GAUGE : `${GAUGE_BRIGHT.slice(0, -1)} / 0.2)` }} />
                <span className="text-muted-foreground text-[11px]">{m}</span>
              </div>
            );
          })}
        </div>}
        {scroll && payout.length > 0 && <p className="mt-3 text-center text-[11px] text-muted-foreground">{t("commissionReport.swipeHint")}</p>}
      </Card>
      </>
    </div>
  );
};

// ---------------------------------------------------------------- drill-down screens

const PlansScreen = ({ go }: { go: (s: Screen) => void }) => {
  const sc = useScale();
  const { t } = useTranslation();
  if (DEMO_NO_DATA) return <EmptyState title={t("commissionReport.noPlansTitle")} hint={t("commissionReport.noPlansHint")} />;
  return (
  <div className="space-y-3">
    <Heading>Scheme 1</Heading>
    <Scheme1Row plain go={go} />
    <Heading>Scheme 2</Heading>
    <PlanRow plain title="Scheme 2 Prepaid" weight value={0} sub={ZERO_PLAN_REASON} onClick={() => go("scheme2prepaid")} />
    <PlanRow plain title="Scheme 2 Postpaid" weight value={sc(5250)} onClick={() => go("scheme2postpaid")} />
    <Heading>Partner Level Incentive</Heading>
    <PlanRow plain title="Partner Level Incentive" value={sc(5250)} onClick={() => go("pli")} />
    <Heading>Change Requests</Heading>
    <PlanRow plain title="HBB/ V-Net Commission" value={sc(10500)} onClick={() => go("hbb")} />
    <PlanRow plain title="FR Promotional Packages" value={sc(1200)} onClick={() => go("fr")} />
    <Heading>Clawbacks</Heading>
    <PlanRow plain danger title="Postpaid Claw backs" sub="6 Lines stopped before 3rd bill" value={sc(-150)} onClick={() => go("clawbacks")} />
    <PlanRow plain danger title="HBB/V-Net Claw backs" sub="3 Lines early disconnect" value={sc(-150)} onClick={() => go("hbbClawbacks")} />
  </div>
  );
};


// Scheme 1 Breakdown: result banner, then the KPI list.
const Scheme1Screen = () => {
  const { missed } = useScheme1();
  const { monthName } = usePeriod();
  const sc = useScale();
  return (
  <div className="space-y-4">
    {missed ? <MissedBanner /> : <Banner label={`Earned in ${monthName}`} value={sc(74000)} badge="Approved" />}
    <KpiBreakdown />
  </div>
  );
};

// Bars share one 0–120% scale, so the tick sits exactly on the 70% minimum. Once a killer KPI is missed it moves
// to the top in red, and the other KPIs dim with their share crossed out because nothing is paid.
const KpiBreakdown = () => {
  const { rows, missedKillers, missed: planMissed } = useScheme1();
  return (
  <div className="space-y-3">
    <Heading>KPI breakdown</Heading>
    {[...missedKillers, ...rows.filter((k) => !missedKiller(k))].map((k, i) => {
      const missed = missedKiller(k);
      const share = `+${(k.achieved * 0.2).toFixed(1)}%`;
      return (
        <Card key={k.name + i} className={cn("p-3.5", missed && "border border-primary/40", planMissed && !missed && "opacity-60")}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{k.name}</span>
              {k.killer && <Pill tone="bad">Killer</Pill>}
            </div>
            <Pill tone={missed ? "bad" : "good"}>Achieved {k.achieved}%</Pill>
          </div>
          <Gauge pct={(k.achieved / KPI_MAX) * 100} tick={(KPI_MIN / KPI_MAX) * 100} danger={missed} thick />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
            <span>Min {KPI_MIN}% · Max {KPI_MAX}%</span>
            {missed ? <b className="text-rose-600">{KPI_MIN - k.achieved}% below minimum</b>
              : planMissed ? <span>Weight 20% · <s>{share}</s> not paid</span>
              : <span>Weight 20% · <b className={POS}>{share}</b></span>}
          </div>
        </Card>
      );
    })}
  </div>
  );
};

type Section = { title: string; amount: string | number; rows: [string, string][] };
type ActivityRow = { phone: string; kind: string; detail: string; amount: number };
type Breakdown = { banner: string; value: number; bad?: boolean; note?: string; activities: string; head: string; sections: Section[]; conditions?: boolean; lines?: ActivityRow[] };
// Demo: Scheme 2 Prepaid calculated to 0 this period. The reason shows on its plan row and in its breakdown.
const ZERO_PLAN_REASON = "No qualifying activations";
const BREAKDOWNS: Record<BreakdownKind, Breakdown> = {
  scheme2prepaid: { banner: "Total Earned", value: 0, note: "No activations qualified this period.", activities: "0 Line", head: "Earnings breakdown", sections: [
    { title: "Prepaid Activations", amount: 0, rows: [["Any", "0%"]] }, { title: "IBR", amount: 0, rows: [["Any", "40%"]] },
    { title: "First Recharge", amount: 0, rows: [["Any", "20%"]] }, { title: "Second Recharge", amount: 0, rows: [["Any", "20%"]] } ] },
  scheme2postpaid: { banner: "Total Earned", value: 9800, activities: "83 Line", head: "Earnings breakdown", sections: [
    { title: "Postpaid Activations", amount: "0.0", rows: [["Any", "0%"]] },
    { title: "Acquisition", amount: 5850, rows: [["Below 200 . 22 Line", "50%"], ["Above 200 . 42 Line", "100 SAR"]] },
    { title: "3rd Bill Issued, Line Active", amount: 1750, rows: [["Below 200 . 22 Line", "50%"], ["Above 200 . 42 Line", "100 SAR"]] } ] },
  pli: { banner: "Total Earned", value: 5250, activities: "42 Line", head: "Earnings breakdown", sections: [
    { title: "Partner Level Target", amount: 3750, rows: [["Silver level . 30 Line", "75%"]] },
    { title: "Level Bonus", amount: 1500, rows: [["Any", "Fixed Amount"]] } ] },
  hbb: { banner: "Total Earned", value: 9800, activities: "105 Line", head: "Earnings breakdown", conditions: true, sections: [
    { title: "Activated Units", amount: 5250, rows: [["Any", "50% Fixed Amount"]] }, { title: "Activated Units(Incentive)", amount: 5250, rows: [["Any", "50% Fixed Amount"]] } ] },
  fr: { banner: "Total Earned", value: 1200, activities: "24 Line", head: "Earnings breakdown", sections: [
    { title: "FR Promotional Packages", amount: 1200, rows: [["Any . 24 Line", "50 SAR"]] } ] },
  clawbacks: { banner: "Taken Back", value: -550, bad: true, activities: "6 Lines", head: "Deduction reasons", sections: [
    { title: "Acquisition received", amount: -550, rows: [["Below 200 . 3 Lines", "-50%"], ["Below 200 . 3 Lines", "-50%"]] } ],
    // Placeholder lines in the HBB design's format: stopped before the 3rd bill, so 1 or 2 bills issued.
    lines: [
      { phone: "+966500653226", kind: "Postpaid 150 · stopped 3 Sep · 2 bills issued", detail: "", amount: -5 },
      { phone: "+966570902726", kind: "Postpaid 200 · stopped 8 Sep · 1 bill issued", detail: "", amount: -5 },
      { phone: "+966584235976", kind: "Postpaid 150 · stopped 12 Sep · 2 bills issued", detail: "", amount: -5 },
      { phone: "+966562843451", kind: "Postpaid 300 · stopped 15 Sep · 1 bill issued", detail: "", amount: -5 },
      { phone: "+966592643132", kind: "Postpaid 200 · stopped 21 Sep · 2 bills issued", detail: "", amount: -5 },
      { phone: "+966504396022", kind: "Postpaid 150 · stopped 26 Sep · 1 bill issued", detail: "", amount: -5 },
    ] },
  hbbClawbacks: { banner: "Taken Back", value: -150, bad: true, activities: "3 Lines", head: "Deduction reasons", sections: [
    { title: "Early disconnect", amount: -150, rows: [["Any . 3 Lines", "-50 SAR"]] } ],
    // From the HBB / V-Net early-disconnect design; the 150 is paid on the total, shown here as 50 per line.
    lines: [
      { phone: "+966500002210", kind: "HBB unlimited · stopped 20 Sep · 1 bill issued", detail: "", amount: -50 },
      { phone: "+966500002214", kind: "V-Net 200 · stopped 22 Sep · 2 bills issued", detail: "", amount: -50 },
      { phone: "+966500002231", kind: "HBB unlimited · stopped 27 Sep · 1 bill issued", detail: "", amount: -50 },
    ] },
};

const BreakdownScreen = ({ kind, go }: { kind: keyof typeof BREAKDOWNS; go: (s: Screen) => void }) => {
  const b = BREAKDOWNS[kind];
  const { factor } = usePeriod();
  const sc = useScale();
  return (
    <div className="space-y-4">
      <Banner label={b.banner} value={sc(b.value)} tone={b.bad ? "bad" : b.value === 0 ? "none" : "good"} note={b.note} />
      <button type="button" onClick={() => go("activities")} className="w-full text-start flex items-center justify-between rounded-2xl bg-card shadow-sm px-4 py-3">
        <div><p className="text-sm font-semibold text-foreground">Activities</p><p className="text-xs text-muted-foreground">{scaleCount(b.activities, factor)}</p></div>
        <Chev />
      </button>
      {b.conditions && (
        <Card>
          <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-semibold text-foreground">Conditions</h3><Pill><Check className="w-3 h-3" /> All Met</Pill></div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="shrink-0">Unites Achievement</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"><span>Min 100%</span><div className="flex-1"><Gauge pct={70} tick={62} /></div><b className={POS}>105%</b></div>
        </Card>
      )}
      <Heading>{b.head}</Heading>
      {b.sections.map((s) => {
        const neg = typeof s.amount === "number" && s.amount < 0;
        const zero = s.amount === 0;
        return (
          <Card key={s.title} className="p-3.5">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-sm font-semibold text-foreground">{s.title}</span>
              <span className="text-xs font-semibold text-muted-foreground">{zero ? <Money v={0} /> : typeof s.amount === "number" ? <Money v={sc(s.amount)} sign /> : <span className="inline-flex items-center gap-1"><RiyalSymbol /> {s.amount}</span>}</span>
            </div>
            <div className="space-y-2">
              {s.rows.map(([l, v], i) => (
                <div key={i} className={cn("flex justify-between text-sm rounded-lg px-3 py-2.5 border-[0.5px]",
                  neg ? "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20" : zero ? "bg-muted/50 border-border" : "bg-teal-50 border-teal-100 dark:bg-teal-500/10 dark:border-teal-500/20")}>
                  <span className="text-foreground">{l}</span>
                  <span className={cn("font-semibold", neg ? "text-rose-600" : zero ? "text-muted-foreground" : "text-teal-600 dark:text-teal-400")}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const PHONES = ["+966500653226", "+966570902726", "+966584235976", "+966562843451", "+966592643132", "+966504396022", "+966505006971"];
const DAYS_AGO = [0, 2, 5, 9, 15, 25, 40];
// Demo rows: the seven designed numbers first, then generated ones so the list can match any line count.
const demoRows = (count: number, amount: number): ActivityRow[] => Array.from({ length: count }, (_, i) => ({
  phone: PHONES[i] ?? `+9665${String(10000000 + ((i * 7919) % 90000000)).padStart(8, "0")}`,
  kind: i % 3 === 0 ? "Acquisition" : "3rd Bill",
  detail: `${format(subDays(new Date(), DAYS_AGO[i] ?? 40 + (i % 50)), "d, MMM, yyyy")} - 1:00 AM`,
  amount,
}));
// A breakdown's own lines when it has them, else demo rows matching its Activities count ("6 Lines", "3,000 Line").
const activityRows = (kind: BreakdownKind, factor: number) => {
  const b = BREAKDOWNS[kind];
  return b.lines ?? demoRows(Number(scaleCount(b.activities, factor).replace(/[^\d]/g, "")), b.bad ? -5 : 5);
};

// Same cards for every breakdown. Earnings lists filter by type chips (taken from the rows);
// clawback lists have no chips, only the MSISDN search.
const ActivitiesScreen = ({ kind }: { kind: BreakdownKind }) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const { factor } = usePeriod();
  const all = useMemo(() => (DEMO_NO_DATA ? [] : activityRows(kind, factor)), [kind, factor]);
  // Plus Activation, which has no lines in the demo data, so picking it shows "No Matching Activities".
  const kinds = useMemo(() => ["All", ...new Set([...all.map((r) => r.kind), "Activation"])], [all]);
  const showChips = !BREAKDOWNS[kind].bad;
  const rows = all.filter((r) => (f === "All" || r.kind === f) && (!q || r.phone.includes(q)));
  const empty = emptyKind(all.length, rows.length);
  if (empty === "noData") return <EmptyState title={t("commissionReport.noActivitiesTitle")} hint={t("commissionReport.noActivitiesHint")} />;
  return (
    <div className="space-y-3">
      <SearchBar value={q} onChange={setQ} placeholder={t("commissionReport.searchMsisdn")} onClear={() => setQ("")} />
      {showChips && <Chips clearable items={kinds} value={f} onChange={setF} />}
      {empty && <EmptyState title={t("commissionReport.noMatchActivities")} hint={t("commissionReport.noMatchHint")} />}
      {rows.map((r) => (
        <Card key={r.phone} className="py-3 flex items-center justify-between">
          <div><p className="text-sm font-semibold text-foreground">{r.phone}</p><p className="text-xs text-muted-foreground">{r.kind}</p>{r.detail && <p className="text-xs text-muted-foreground">{r.detail}</p>}</div>
          {/* Colour the wrapper too, so the ".00" matches the signed amount. */}
          <span className={cn("text-xs font-semibold", r.amount < 0 ? "text-rose-600" : POS)}><Money v={r.amount} sign />.00</span>
        </Card>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- manager "Overview"

// Whole team ranked by commission, highest first. Top / Lowest show 5 rows and scroll for the rest.
// Each row also carries the member's role (Search Dealers design: "Sales Manager | MBR-784291").
const DEALERS: [string, string, number, string][] = [
  ["Fahad Alotaibi", "30 Plans", 145, "Sales Manager"], ["Noura Alqahtani", "27 Plans", 132, "Supervisor"], ["Saad Alghamdi", "22 Plans", 98, "Dealer"],
  ["Reem Aldosari", "18 Plans", 76.2, "Sales Agent"], ["Omar Alharbi", "14 Plans", 54, "Dealer"], ["Lama Alshehri", "12 Plans", 47.5, "Sales Agent"],
  ["Turki Almutairi", "11 Plans", 41, "Supervisor"], ["Hessa Alzahrani", "9 Plans", 33.8, "Sales Agent"], ["Majed Alsubaie", "8 Plans", 27, "Dealer"],
  ["Abeer Alanazi", "6 Plans", 19.5, "Sales Agent"], ["Yousef Alqarni", "4 Plans", 12, "Dealer"], ["Sara Alrashid", "2 Plans", 6.4, "Sales Agent"],
];
// "Role | detail" line under a member's name, with a thin divider as in the design.
const RoleLine = ({ role, detail, className }: { role: string; detail: string; className?: string }) => (
  <p className={cn("flex items-center gap-2 text-muted-foreground whitespace-nowrap min-w-0", className)}><span className="truncate">{role}</span><span className="w-px h-3 bg-border shrink-0" aria-hidden="true" /><span className="shrink-0">{detail}</span></p>
);
const ALL_DEALERS = [["Abdullah Al-Qahtani", "MBR-784291", "Sales Manager"], ["Faisal Al-Otaibi", "MBR-356108", "Dealer"], ["Mohammed Al-Dosari", "MBR-921674", "Supervisor"], ["Khalid Al-Ghamdi", "MBR-468235", "Sales Agent"], ["Nasser Al-Harbi", "MBR-613852", "Administrator"]];

const Overview = ({ go }: { go: (s: Screen) => void }) => {
  const { t } = useTranslation();
  // Same month chips and Custom month Filter sheet as the dealer report.
  const period = usePeriod();
  const [top, setTop] = useState("top");
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState("");
  const [member, setMember] = useState<string>();
  const team = DEMO_NO_DATA ? [] : DEALERS;
  const list = (top === "top" ? team : [...team].reverse()).slice(0, 5);
  const allPeople = DEMO_NO_DATA ? [] : ALL_DEALERS;
  const people = allPeople.filter(([n, c, r]) => !q || (n + c + r).toLowerCase().includes(q.toLowerCase()));
  const peopleEmpty = emptyKind(allPeople.length, people.length);

  const sheetEl = (
    <Drawer open={sheet} onOpenChange={setSheet}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[85vh]">
        <div className="flex items-center justify-between pb-4">
          <button type="button" onClick={() => setSheet(false)} aria-label={t("commissionReport.back")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center"><ArrowLeft className="w-4 h-4 rtl:rotate-180" /></button>
          <DrawerTitle className="text-lg font-semibold text-foreground">{t("commissionReport.searchDealers")}</DrawerTitle>
          <button type="button" onClick={() => setSheet(false)} aria-label={t("settings.close")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <DrawerDescription className="sr-only">{t("commissionReport.searchDealers")}</DrawerDescription>
        <div className="relative mb-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commissionReport.searchMember")} className="h-12 rounded-xl pe-10" />
          {q ? <button type="button" onClick={() => setQ("")} aria-label={t("commissionReport.searchMember")} className="absolute end-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>
            : <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        </div>
        {peopleEmpty && <EmptyState compact title={t(peopleEmpty === "noData" ? "commissionReport.noDealersTitle" : "commissionReport.noMatchDealers")} hint={t(peopleEmpty === "noData" ? "commissionReport.noDealersHint" : "commissionReport.noMatchHint")} />}
        <div className="space-y-2 overflow-y-auto">
          {people.map(([n, c, r]) => (
            <button key={c + n} type="button" onClick={() => { setMember(n); setQ(""); setSheet(false); }}
              className={cn("w-full text-start flex items-center gap-3 rounded-xl px-3 py-3 border", member === n ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30" : "bg-muted/40 border-border/60")}>
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-rose-600" /></div>
              <div className="min-w-0"><p className="text-sm font-semibold text-foreground truncate">{n}</p><RoleLine role={r} detail={c} className="text-xs mt-0.5" /></div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );

  // A member picked from Search Dealers swaps the team view for that member's own report.
  if (member) {
    return (
      <div className="space-y-4">
        <SearchBar value={member} onChange={() => {}} placeholder={t("commissionReport.searchMember")} onFocus={() => setSheet(true)} onClear={() => setMember(undefined)} />
        <MyCommission member go={go} />
        {sheetEl}
      </div>
    );
  }

  if (period.pending) return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} placeholder={t("commissionReport.searchMember")} onFocus={() => setSheet(true)} />
      <Chips items={period.items} value={period.chipValue} onChange={period.onChipChange} dotItem={period.pendingChip} />
      {period.drawer}
      <EmptyState title={t("commissionReport.noCommissionsTitle")} hint={t("commissionReport.noCommissionsHint")} />
      {sheetEl}
    </div>
  );
  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} placeholder={t("commissionReport.searchMember")} onFocus={() => setSheet(true)} />
      <Chips items={period.items} value={period.chipValue} onChange={period.onChipChange} dotItem={period.pendingChip} />
      {period.drawer}
      <>
      <div>
        <div className="rounded-2xl bg-sky-50 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30 p-3">
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 flex items-center justify-center shrink-0"><Banknote className="w-4 h-4" /></div><p className="text-xs font-semibold text-foreground leading-tight">{t("commissionReport.myCommission")}</p></div>
          <p className="text-xl font-bold mt-2 text-sky-600 dark:text-sky-400"><Money v={Math.round(11230 * period.factor)} /></p>
        </div>
      </div>
      <div className="rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 px-3 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0"><Info className="w-4 h-4 text-amber-600" /></div>
        <div><p className="text-xs font-semibold text-amber-600 dark:text-amber-300">{t("commissionReport.needsAttention")}</p><p className="text-xs text-foreground/80">{t("commissionReport.needsAttentionSub", { n: 6 })}</p></div>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-foreground">{t("commissionReport.dealersCommission")}</h3>
          <button type="button" onClick={() => go("members")} className="text-sm font-medium text-blue-600 dark:text-blue-400 [[data-brand=friendi]_&]:text-primary dark:[[data-brand=friendi]_&]:text-primary flex items-center gap-0.5">{t("commissionReport.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></button>
        </div>
        <Tabs items={[["top", t("commissionReport.top5")], ["low", t("commissionReport.lowest5")]]} value={top} onChange={setTop} />
        {list.length === 0 && <EmptyState title={t("commissionReport.noDealersTitle")} hint={t("commissionReport.noDealersHint")} compact />}
        <div className="mt-3 space-y-2.5">
          {list.map(([n, p, v, r], i) => (
            <div key={n} className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 px-3 py-3">
              <span className={cn("w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0", top === "top" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/15 text-rose-600")}>{top === "top" ? i + 1 : team.length - i}</span>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-foreground truncate">{n}</p><RoleLine role={r} detail={p} className="text-[11px] mt-0.5" /></div>
              <span className={cn("text-xs font-semibold inline-flex items-center gap-1 tabular-nums", top === "top" ? POS : "text-rose-600")}><RiyalSymbol /> {(v * period.factor).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Card>
      </>
      {sheetEl}
    </div>
  );
};

// ---------------------------------------------------------------- page

// ---------------------------------------------------------------- manager "See all" members

// Roles in the ranking, plus Administrator (in Search Dealers but not ranked), so picking it shows "No Matching Dealers".
const MEMBER_ROLES = [...new Set([...DEALERS.map((d) => d[3]), "Administrator"])];
type MemberFilter = { role: string; sort: "high" | "low" };
const NO_MEMBER_FILTER: MemberFilter = { role: "all", sort: "high" };

// Same bottom-sheet pattern as the Custom month Filter: pill groups, Apply commits, Clear Filter resets.
const MembersFilterSheet = ({ open, onOpenChange, value, onApply }: { open: boolean; onOpenChange: (o: boolean) => void; value: MemberFilter; onApply: (f: MemberFilter) => void }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  const pill = (on: boolean) => cn("px-3 py-1.5 rounded-full text-xs font-medium", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground");
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[90vh]">
        <div className="relative flex items-center justify-center py-2">
          <DrawerTitle className="text-lg font-medium text-foreground">{t("commissionReport.filters")}</DrawerTitle>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t("settings.close")} className="absolute end-0 w-9 h-9 rounded-full border border-border flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <DrawerDescription className="sr-only">{t("commissionReport.allMembers")}</DrawerDescription>
        <p className="text-sm text-foreground pt-3 pb-2">{t("commissionReport.role")}</p>
        <div className="flex flex-wrap gap-2">
          {["all", ...MEMBER_ROLES].map((r) => (
            <button key={r} type="button" aria-pressed={draft.role === r} onClick={() => setDraft((d) => ({ ...d, role: r }))} className={pill(draft.role === r)}>
              {r === "all" ? t("commissionReport.allRoles") : r}
            </button>
          ))}
        </div>
        <p className="text-sm text-foreground pt-4 pb-2">{t("commissionReport.sortBy")}</p>
        <div className="flex flex-wrap gap-2 pb-4">
          {(["high", "low"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={draft.sort === k} onClick={() => setDraft((d) => ({ ...d, sort: k }))} className={pill(draft.sort === k)}>
              {t(k === "high" ? "commissionReport.highestFirst" : "commissionReport.lowestFirst")}
            </button>
          ))}
        </div>
        <Button onClick={() => { onApply(draft); onOpenChange(false); }} className="w-full h-12 rounded-full text-base font-medium">{t("commissionReport.apply")}</Button>
        <button type="button" onClick={() => { onApply(NO_MEMBER_FILTER); onOpenChange(false); }} className="w-full h-11 mt-1 text-sm font-medium text-primary">{t("commissionReport.clearFilters")}</button>
      </DrawerContent>
    </Drawer>
  );
};

// Whole team with search and filters: plain rows, no rank numbers or colour coding.
const AllMembersScreen = () => {
  const { t } = useTranslation();
  const { factor } = usePeriod();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MemberFilter>(NO_MEMBER_FILTER);
  const [open, setOpen] = useState(false);
  const ranked = (DEMO_NO_DATA ? [] : DEALERS).map((d, i) => ({ d, rank: i + 1 }));
  const rows = (filter.sort === "high" ? ranked : [...ranked].reverse())
    .filter(({ d: [n, , , r] }) => (filter.role === "all" || r === filter.role) && (!q || (n + r).toLowerCase().includes(q.toLowerCase())));
  const active = filter.role !== NO_MEMBER_FILTER.role || filter.sort !== NO_MEMBER_FILTER.sort;
  // Sorting never hides anyone, so only the role filter can be why the list is empty.
  const empty = emptyKind(ranked.length, rows.length);
  if (empty === "noData") return <EmptyState title={t("commissionReport.noDealersTitle")} hint={t("commissionReport.noDealersHint")} />;
  // Applied filters show as removable red chips under the search, as in the design.
  const chips = [
    filter.role !== NO_MEMBER_FILTER.role && { label: filter.role, clear: () => setFilter((f) => ({ ...f, role: NO_MEMBER_FILTER.role })) },
    filter.sort !== NO_MEMBER_FILTER.sort && { label: t("commissionReport.lowestFirst"), clear: () => setFilter((f) => ({ ...f, sort: NO_MEMBER_FILTER.sort })) },
  ].filter(Boolean) as { label: string; clear: () => void }[];
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1"><SearchBar value={q} onChange={setQ} placeholder={t("commissionReport.searchMemberShort")} onClear={() => setQ("")} /></div>
        <button type="button" aria-label={t("commissionReport.filter")} onClick={() => setOpen(true)} className="relative w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          {active && <span className="absolute top-2.5 end-2.5 w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button key={c.label} type="button" onClick={c.clear} className="px-3 py-1 rounded-full text-xs font-medium border border-primary text-primary bg-card inline-flex items-center gap-1">
              {c.label} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
      {empty ? <EmptyState title={t("commissionReport.noMatchDealers")} hint={t("commissionReport.noMatchHint")} />
        : <p className="text-xs text-muted-foreground px-1">{t("commissionReport.membersCount", { n: rows.length })}</p>}
      {rows.map(({ d: [n, p, v, r] }) => {
        return (
          <div key={n} className="flex items-center gap-3 rounded-xl bg-card shadow-sm px-3 py-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-primary" /></div>
            <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-foreground truncate">{n}</p><RoleLine role={r} detail={p} className="text-[11px] mt-0.5" /></div>
            <span className="text-xs font-semibold inline-flex items-center gap-1 tabular-nums text-foreground"><RiyalSymbol /> {(v * factor).toFixed(2)}</span>
          </div>
        );
      })}
      <MembersFilterSheet open={open} onOpenChange={setOpen} value={filter} onApply={setFilter} />
    </div>
  );
};

const TITLES: Record<Screen, string> = {
  plans: "My Plans", scheme1: "Scheme 1 Breakdown", scheme2prepaid: "Scheme 2 Prepaid", scheme2postpaid: "Scheme 2 Postpaid",
  pli: "Partner Level Incentive", hbb: "HBB/ V-Net", fr: "FR Promotional Packages", clawbacks: "Postpaid Clawbacks", hbbClawbacks: "HBB/V-Net Clawbacks", activities: "Activities", members: "Dealers",
};

const CommissionReport = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const manager = params.get("view") === "manager";
  const [stack, setStack] = useState<Screen[]>([]);
  const [killerMissed, setKillerMissed] = useState(false);
  const [tab, setTab] = useState<"overview" | "mine">(manager ? "overview" : "mine");
  // Demo: Last month's calculation delayed, and when the dealer joined.
  const [delayed, setDelayed] = useState(0);
  const [joinIdx, setJoinIdx] = useState(0);
  const period = useCustomMonth(t("commissionReport.lastMonth"), { delayed: delayed === 1, join: JOIN_DEMO[joinIdx][1] });
  const screen = stack[stack.length - 1];
  const go = (s: Screen) => setStack((st) => [...st, s]);

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <BrandLoadingOverlay open={period.loading} />
      <AppHeader
        title={screen ? TITLES[screen] : t("commissionReport.title")}
        showBack
        onBackClick={() => (stack.length ? setStack((st) => st.slice(0, -1)) : navigate("/"))}
      />
      <div className="px-4">
        {!screen && manager && (
          <div className="mb-4">
            <Tabs items={[["overview", t("commissionReport.overview")], ["mine", t("commissionReport.myCommission")]]} value={tab} onChange={(k) => setTab(k as "overview" | "mine")} />
          </div>
        )}
        {!screen && (
          <>
            <DemoRow label="Demo: Last month" options={["Calculated", "Delayed"]} value={delayed} onChange={setDelayed} />
            <DemoRow label="Demo: Joined" options={JOIN_DEMO.map(([l]) => l)} value={joinIdx} onChange={setJoinIdx} />
          </>
        )}
        {(screen === "plans" || screen === "scheme1" || (!screen && !(tab === "overview" && manager))) && <KillerDemoSwitch value={killerMissed} onChange={setKillerMissed} />}
        <PeriodContext.Provider value={period}>
        <KillerDemoContext.Provider value={killerMissed}>
        {!screen && (tab === "overview" && manager ? <Overview go={go} /> : <MyCommission go={go} />)}
        {screen === "plans" && <PlansScreen go={go} />}
        {screen === "scheme1" && <Scheme1Screen />}
        {screen && screen in BREAKDOWNS && <BreakdownScreen kind={screen as BreakdownKind} go={go} />}
        {screen === "activities" && <ActivitiesScreen kind={stack[stack.length - 2] as BreakdownKind} />}
        {screen === "members" && <AllMembersScreen />}
        </KillerDemoContext.Provider>
        </PeriodContext.Provider>
      </div>
    </div>
  );
};

export default CommissionReport;
