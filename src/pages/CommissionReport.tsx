import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addMonths, format, subDays } from "date-fns";
import { ArrowDown, ArrowLeft, Banknote, Check, ChevronRight, Info, Search, User, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// Prototype-only: every figure below is demo data copied from the Commission Report designs.
// One page serves both roles — ?view=dealer shows the dealer's own report, ?view=manager adds
// the Overview tab (team commission, dealers list) in front of the same "My Commission" tab.
// Drill-down screens are a local stack so Back always steps up one level, then leaves.

type BreakdownKind = "scheme2prepaid" | "scheme2postpaid" | "pli" | "hbb" | "fr" | "clawbacks" | "hbbClawbacks";
type Screen = "plans" | "scheme1" | "kpi" | BreakdownKind | "activities";

const GAUGE = "hsl(var(--kpi-gauge))";
const GAUGE_BRIGHT = "hsl(var(--kpi-gauge-bright))";
const GAUGE_TRACK = "hsl(var(--kpi-gauge-track))";

const POS = "text-emerald-600 dark:text-emerald-400";

// Amount with riyal symbol. `sign` prefixes +/- and colours green/red; without it the number stays neutral.
const Money = ({ v, sign, className }: { v: number | string; sign?: boolean; className?: string }) => {
  const n = typeof v === "number" ? v : null;
  const prefix = n !== null && sign ? (n < 0 ? "-" : "+") : "";
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", n !== null && sign && (n < 0 ? "text-primary" : POS), className)}>
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

const Pill = ({ children, tone = "good" }: { children: React.ReactNode; tone?: "good" | "bad" }) => (
  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium border-[0.5px] inline-flex items-center gap-1 whitespace-nowrap",
    tone === "good" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
      : "bg-rose-50 text-primary border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30")}>{children}</span>
);

const IconBox = ({ tone = "good", children }: { tone?: "good" | "bad"; children: React.ReactNode }) => (
  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", tone === "good" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20" : "bg-rose-100 text-primary dark:bg-rose-500/20")}>{children}</div>
);

const Banner = ({ label, value, tone = "good", badge }: { label: string; value: number; tone?: "good" | "bad"; badge?: string }) => (
  <div className={cn("rounded-2xl px-4 py-3 border", tone === "good" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30" : "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30")}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <IconBox tone={tone}><Banknote className="w-4 h-4" /></IconBox>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
      {badge && <Pill>{badge}</Pill>}
    </div>
    <p className={cn("text-2xl font-bold mt-2", tone === "bad" ? "text-primary" : POS)}><Money v={value} /></p>
  </div>
);

const Chev = () => <ChevronRight className="w-4 h-4 text-primary shrink-0 rtl:rotate-180" />;

const WeightChip = () => <span className="mt-1 inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-50 text-sky-700 border-[0.5px] border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30">Weight 100%</span>;

// One plan line. `plain` = white card (My Plans list); default = grey inner card (My Plan card).
const PlanRow = ({ title, sub, weight, value, onClick, danger, plain }: { title: string; sub?: string; weight?: boolean; value: number; onClick?: () => void; danger?: boolean; plain?: boolean }) => (
  <button type="button" onClick={onClick} disabled={!onClick}
    className={cn("w-full text-start flex items-center gap-3 rounded-xl px-3 py-3 disabled:cursor-default", plain ? "bg-card shadow-sm" : "bg-muted/50 border border-border/50")}>
    {danger && <IconBox tone="bad"><ArrowDown className="w-4 h-4" /></IconBox>}
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-medium text-foreground truncate">{title}</p>
      {sub && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{sub}</p>}
      {weight && <WeightChip />}
    </div>
    <span className="text-xs font-semibold"><Money v={value} sign /></span>
    {onClick && <Chev />}
  </button>
);

// `fill` makes the chips share the row equally instead of scrolling, so a short fixed set always fits.
const Chips = ({ items, value, onChange, fill }: { items: string[]; value: string; onChange: (v: string) => void; fill?: boolean }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar">
    {items.map((c) => (
      <button key={c} type="button" onClick={() => onChange(c)}
        className={cn("py-1.5 rounded-full text-xs font-medium whitespace-nowrap border", fill ? "flex-1 min-w-0 px-2" : "px-4 shrink-0",
          value === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground")}>
        {c}
      </button>
    ))}
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

// Demo "today" for the commission figures: Aug 2026 is the latest month with data.
const LATEST_MONTH = new Date(2026, 7, 1);
// The three months that have their own chip: Last month, then the two before it (July, June).
const CHIP_MONTHS = [0, -1, -2].map((n) => addMonths(LATEST_MONTH, n));
const YEAR_MONTHS = Array.from({ length: 12 }, (_, m) => new Date(LATEST_MONTH.getFullYear(), m, 1));

// "Filter" bottom sheet behind the Custom chip: every month of this year as pills, opened on the month
// the home chips currently show. Apply commits; Clear Filter goes back to Last month.
const MonthFilterSheet = ({ open, onOpenChange, value, onApply, onClear }: { open: boolean; onOpenChange: (o: boolean) => void; value: Date; onApply: (d: Date) => void; onClear: () => void }) => {
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
          {YEAR_MONTHS.map((d) => {
            const on = draft.getTime() === d.getTime();
            return (
              <button key={d.getMonth()} type="button" onClick={() => setDraft(d)} aria-pressed={on}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {format(d, "MMMM")}
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
const useCustomMonth = (first: string) => {
  const { t } = useTranslation();
  const [month, setMonth] = useState(LATEST_MONTH);
  const [open, setOpen] = useState(false);
  const chipLabels = [first, ...CHIP_MONTHS.slice(1).map((d) => format(d, "MMMM"))];
  const chip = CHIP_MONTHS.findIndex((d) => d.getTime() === month.getTime());
  const customLabel = chip === -1 ? format(month, "MMMM") : t("commissionReport.custom");
  return {
    month,
    monthName: format(month, "MMMM"),
    items: [...chipLabels, customLabel],
    chipValue: chip === -1 ? customLabel : chipLabels[chip],
    onChipChange: (v: string) => (v === customLabel ? setOpen(true) : setMonth(CHIP_MONTHS[chipLabels.indexOf(v)])),
    drawer: <MonthFilterSheet open={open} onOpenChange={setOpen} value={month} onApply={setMonth} onClear={() => setMonth(LATEST_MONTH)} />,
  };
};

// ---------------------------------------------------------------- "My Commission" (also the per-member view)

// Twelve months of payouts ending in LATEST_MONTH (Sep 2025 – Aug 2026).
const PAYOUT = [7400, 8900, 9600, 12100, 7800, 9100, 8200, 11400, 10200, 13200, 13800, 14200]
  .map((v, i) => ({ date: addMonths(LATEST_MONTH, i - 11), v }));
const compact = (v: number) => `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
const RANGES = [["3", "last3"], ["6", "last6"], ["12", "last12"]] as const;
const MONTH_EARNED: Record<string, number> = { August: 74000, July: 68500, June: 61200 };

// Dealer's own report shows 11,230; a manager viewing a member sees that member's month figures (74,000 for August).
const MyCommission = ({ go, member }: { go: (s: Screen) => void; member?: boolean }) => {
  const { t } = useTranslation();
  const first = t("commissionReport.lastMonth");
  const period = useCustomMonth(first);
  // Payout window: the trailing 3, 6 or 12 months.
  const [range, setRange] = useState<(typeof RANGES)[number][0]>("6");
  const payout = PAYOUT.slice(-Number(range));
  const rangeTitle = t(`commissionReport.${RANGES.find(([k]) => k === range)![1]}`);
  const max = Math.max(...payout.map((p) => p.v));
  const dense = payout.length > 6;
  const month = period.monthName;
  const lit = period.month.getTime();
  return (
    <div className="space-y-4">
      <Chips items={period.items} value={period.chipValue} onChange={period.onChipChange} />
      {period.drawer}
      <Banner label={t("commissionReport.earnedIn", { month })} value={member ? MONTH_EARNED[month] ?? 52300 : 11230} badge={t("commissionReport.approved")} />
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">{t("commissionReport.myPlan")}</h3>
          <button type="button" onClick={() => go("plans")} className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-0.5">{t("commissionReport.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" /></button>
        </div>
        <div className="space-y-3">
          <PlanRow title="Scheme 1 Commission" weight value={6550} onClick={() => go("scheme1")} />
          <PlanRow title="Scheme 2 Prepaid KPI" weight value={5250} onClick={() => go("scheme2prepaid")} />
          <PlanRow title="Postpaid Claw backs" sub="6 Lines stopped before 3rd bill" value={-150} danger onClick={() => go("clawbacks")} />
        </div>
      </Card>
      <Heading>{t("commissionReport.payout")}</Heading>
      {/* Same pill chips as the month row at the top, per design. */}
      <Chips fill items={RANGES.map(([, label]) => t(`commissionReport.${label}`))} value={rangeTitle}
        onChange={(v) => setRange(RANGES.find(([, label]) => t(`commissionReport.${label}`) === v)![0])} />
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{rangeTitle}</h3>
          <span className="text-[11px] text-muted-foreground">SAR, Approved Runs</span>
        </div>
        {/* 12 bars share ~340px: min-w-0 lets columns shrink below their labels, and labels drop to 9–10px to fit. */}
        <div className={cn("flex items-end justify-center h-56", dense ? "gap-1" : "gap-3")}>
          {payout.map(({ date, v }) => {
            const last = date.getTime() === lit;
            const m = format(date, "MMM");
            return (
              <div key={m} className="flex-1 min-w-0 max-w-16 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className={cn("tabular-nums whitespace-nowrap", dense ? "text-[9px] tracking-tighter" : "text-[11px]", last ? "font-semibold" : "text-muted-foreground")} style={last ? { color: GAUGE } : undefined}>{dense ? compact(v) : v.toLocaleString()}</span>
                <div className={cn("w-full", dense ? "rounded" : "rounded-md")} style={{ height: `${(v / max) * 82}%`, background: last ? GAUGE : `${GAUGE_BRIGHT.slice(0, -1)} / 0.2)` }} />
                <span className={cn("text-muted-foreground", dense ? "text-[10px]" : "text-[11px]")}>{m}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- drill-down screens

const PlansScreen = ({ go }: { go: (s: Screen) => void }) => (
  <div className="space-y-3">
    <Heading>Scheme 1</Heading>
    <PlanRow plain title="Scheme 1 Commission" weight value={6550} onClick={() => go("scheme1")} />
    <Heading>Scheme 2</Heading>
    <PlanRow plain title="Scheme 2 Prepaid" weight value={5250} onClick={() => go("scheme2prepaid")} />
    <PlanRow plain title="Scheme 2 Postpaid" weight value={5250} onClick={() => go("scheme2postpaid")} />
    <Heading>Partner Level Incentive</Heading>
    <PlanRow plain title="Partner Level Incentive" value={5250} onClick={() => go("pli")} />
    <Heading>Change Requests</Heading>
    <PlanRow plain title="HBB/ V-Net Commission" value={10500} onClick={() => go("hbb")} />
    <PlanRow plain title="FR Promotional Packages" value={1200} onClick={() => go("fr")} />
    <Heading>Clawbacks</Heading>
    <PlanRow plain danger title="Postpaid Claw backs" sub="6 Lines stopped before 3rd bill" value={-150} onClick={() => go("clawbacks")} />
    <PlanRow plain danger title="HBB/V-Net Claw backs" sub="3 Lines early disconnect" value={-150} onClick={() => go("hbbClawbacks")} />
  </div>
);

const ConditionBar = ({ label, pct, tick }: { label: string; pct: number; tick: number }) => (
  <div className="flex items-center gap-3 text-xs text-muted-foreground">
    <span className="w-24 shrink-0">{label}</span>
    <div className="flex-1"><Gauge pct={pct} tick={tick} /></div>
    <span className={cn("w-9 text-end font-semibold", POS)}>{pct}%</span>
  </div>
);

// Bands sit on a 0–140% scale; the bar is segmented per band and "You" marks the current score.
const BAR_SEGMENTS: [number, string][] = [[50, GAUGE_TRACK], [14, `${GAUGE_BRIGHT.slice(0, -1)} / 0.45)`], [7, `${GAUGE_BRIGHT.slice(0, -1)} / 0.8)`], [15, GAUGE], [14, "hsl(var(--kpi-gauge) / 0.85)"]];
const BAND_LABELS: [string, number][] = [["0", 0], ["70", 50], ["90", 64], ["100", 71], ["120%", 86]];

const BandRow = ({ label, value, on, accent }: { label: string; value: string; on?: boolean; accent?: boolean }) => (
  <div className={cn("flex justify-between text-sm px-3 py-2.5 rounded-lg", on ? "bg-teal-50 dark:bg-teal-500/10 font-medium" : "text-muted-foreground")}>
    <span className={cn(on && "text-foreground")}>{label}</span>
    <span className={cn("tabular-nums", (on || accent) && "text-teal-600 dark:text-teal-400 font-semibold", !on && !accent && "text-foreground font-medium")}>{value}</span>
  </div>
);

const Scheme1Screen = ({ go }: { go: (s: Screen) => void }) => (
  <div className="space-y-4 pb-20">
    <Banner label="Earned in August" value={74000} badge="Approved" />
    <Card>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">Conditions</h3>
        <Pill><Check className="w-3 h-3" /> All Met</Pill>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Must be met to earn enything from this scheme</p>
      <div className="space-y-2.5"><ConditionBar label="V FPE  Min70%" pct={88} tick={70} /><ConditionBar label="F FPE  Min70%" pct={81} tick={70} /></div>
    </Card>
    <Card>
      <h3 className="text-sm font-semibold text-foreground mb-8">KPI Score Payout</h3>
      <div className="relative">
        <div className="absolute -top-7 -translate-x-1/2 rtl:translate-x-1/2 px-2.5 py-1 rounded-lg bg-foreground text-background text-[11px] font-medium whitespace-nowrap" style={{ insetInlineStart: "66%" }}>You · 93%</div>
        <div className="flex h-3 rounded-sm overflow-hidden">{BAR_SEGMENTS.map(([w, bg], i) => <div key={i} style={{ width: `${w}%`, background: bg }} />)}</div>
        <div className="relative h-5 mt-1 text-[11px] text-muted-foreground">{BAND_LABELS.map(([l, p]) => <span key={l} className="absolute -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: `${p}%` }}>{l}</span>)}</div>
      </div>
      <div className="mt-3 space-y-0.5">
        <BandRow label="0-70%" value="Nothing" />
        <BandRow label="70-90%" value="3,300" />
        <BandRow on label="90-100% . your band" value="+5,400" />
        <BandRow label="100-120%" value="6,660" />
        <BandRow label="From 120%" value="7,900 max" />
        <BandRow label="From 120%" value="7,900 max" />
        <BandRow accent label="5,400 x 95%(fixed rate)" value="5,130" />
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border-[0.5px] border-amber-200 dark:border-amber-500/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <Info className="w-4 h-4 shrink-0" /> Reach 100% (7% more) to move to 6,600 band
      </div>
    </Card>
    <Card>
      <div className="flex justify-between items-center mb-2"><h3 className="text-sm font-semibold text-foreground">Incentive bonus</h3><span className="text-xs text-muted-foreground"><b className={POS}>93%</b> of Target</span></div>
      <BandRow on label="90-100% . your band" value="+1,000" />
      <BandRow label="From 100%" value="1,500" />
    </Card>
    <div className="fixed bottom-0 inset-x-0 mx-auto sm:max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
      <Button onClick={() => go("kpi")} className="w-full h-12 rounded-full text-base font-medium">See KPI Scorecard</Button>
    </div>
  </div>
);

const KPI_ROWS: [string, number, boolean, boolean][] = [
  ["V FPE", 80, true, false], ["F FPE", 60, true, true], ["V IBR", 80, false, false], ["F IBR", 80, false, false], ["F IBR", 80, false, false],
];

const KpiScreen = () => (
  <div className="space-y-3">
    <Heading>KPI breakdown</Heading>
    {KPI_ROWS.map(([l, p, killer, low], i) => (
      <Card key={i} className="p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{l}</span>
            {killer && <Pill tone="bad">Killer</Pill>}
          </div>
          <Pill tone={low ? "bad" : "good"}>Achieved {p}%</Pill>
        </div>
        <Gauge pct={low ? 62 : 85} tick={75} danger={low} thick />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
          <span>Min 70% · Max 120%</span>
          <span>Weight 20% · <b className={low ? "text-primary" : POS}>{low ? "+0.0%" : "+16.0%"}</b></span>
        </div>
      </Card>
    ))}
  </div>
);

type Section = { title: string; amount: string | number; rows: [string, string][] };
type ActivityRow = { phone: string; kind: string; detail: string; amount: number };
type Breakdown = { banner: string; value: number; bad?: boolean; activities: string; head: string; sections: Section[]; conditions?: boolean; lines?: ActivityRow[] };
const BREAKDOWNS: Record<BreakdownKind, Breakdown> = {
  scheme2prepaid: { banner: "Total Earned", value: 9800, activities: "3,000 Line", head: "Earnings breakdown", sections: [
    { title: "Prepaid Activations", amount: "00", rows: [["Any", "0%"]] }, { title: "IBR", amount: 10176, rows: [["Any", "40%"]] },
    { title: "First Recharge", amount: 6176, rows: [["Any", "20%"]] }, { title: "Second Recharge", amount: 6176, rows: [["Any", "20%"]] } ] },
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
    { title: "Acquisition received", amount: -550, rows: [["Below 200 . 3 Lines", "-50%"], ["Below 200 . 3 Lines", "-50%"]] } ] },
  hbbClawbacks: { banner: "Taken Back", value: -150, bad: true, activities: "3 Lines", head: "Deduction reasons", sections: [
    { title: "Early disconnect", amount: -150, rows: [["Any . 3 Lines", "-50 SAR"]] } ],
    // From the HBB / V-Net early-disconnect design; the 150 is paid on the total, shown here as 50 per line.
    lines: [
      { phone: "+966500002210", kind: "HBB unlimited", detail: "Stopped 20 Sep · 1 bill issued", amount: -50 },
      { phone: "+966500002214", kind: "V-Net 200", detail: "Stopped 22 Sep · 2 bills issued", amount: -50 },
      { phone: "+966500002231", kind: "HBB unlimited", detail: "Stopped 27 Sep · 1 bill issued", amount: -50 },
    ] },
};

const BreakdownScreen = ({ kind, go }: { kind: keyof typeof BREAKDOWNS; go: (s: Screen) => void }) => {
  const b = BREAKDOWNS[kind];
  return (
    <div className="space-y-4">
      <Banner label={b.banner} value={b.value} tone={b.bad ? "bad" : "good"} />
      <button type="button" onClick={() => go("activities")} className="w-full text-start flex items-center justify-between rounded-2xl bg-card shadow-sm px-4 py-3">
        <div><p className="text-sm font-semibold text-foreground">Activities</p><p className="text-xs text-muted-foreground">{b.activities}</p></div>
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
        return (
          <Card key={s.title} className="p-3.5">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-sm font-semibold text-foreground">{s.title}</span>
              <span className="text-xs font-semibold text-muted-foreground">{typeof s.amount === "number" ? <Money v={s.amount} sign /> : <span className="inline-flex items-center gap-1"><RiyalSymbol /> {s.amount}</span>}</span>
            </div>
            <div className="space-y-2">
              {s.rows.map(([l, v], i) => (
                <div key={i} className={cn("flex justify-between text-sm rounded-lg px-3 py-2.5 border-[0.5px]",
                  neg ? "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20" : "bg-teal-50 border-teal-100 dark:bg-teal-500/10 dark:border-teal-500/20")}>
                  <span className="text-foreground">{l}</span>
                  <span className={cn("font-semibold", neg ? "text-primary" : "text-teal-600 dark:text-teal-400")}>{v}</span>
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
const activityRows = (kind: BreakdownKind) => {
  const b = BREAKDOWNS[kind];
  return b.lines ?? demoRows(Number(b.activities.replace(/[^\d]/g, "")), b.bad ? -5 : 5);
};

// Same cards for every breakdown: search by MSISDN only, no type chips.
const ActivitiesScreen = ({ kind }: { kind: BreakdownKind }) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const all = useMemo(() => activityRows(kind), [kind]);
  const rows = all.filter((r) => !q || r.phone.includes(q));
  return (
    <div className="space-y-3">
      <SearchBar value={q} onChange={setQ} placeholder={t("commissionReport.searchMsisdn")} />
      {rows.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">{t("commissionReport.noResults")}</p>}
      {rows.map((r) => (
        <Card key={r.phone + r.detail} className="py-3 flex items-center justify-between">
          <div><p className="text-sm font-semibold text-foreground">{r.phone}</p><p className="text-xs text-muted-foreground">{r.kind}</p><p className="text-xs text-muted-foreground">{r.detail}</p></div>
          {/* Colour the wrapper too, so the ".00" matches the signed amount. */}
          <span className={cn("text-xs font-semibold", r.amount < 0 ? "text-primary" : POS)}><Money v={r.amount} sign />.00</span>
        </Card>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- manager "Overview"

const DEALERS: [string, string, number][] = [
  ["Fahad Alotaibi", "30 Plans", 145], ["Noura Alqahtani", "27 Plans", 132], ["Saad Alghamdi", "22 Plans", 98],
  ["Reem Aldosari", "18 Plans", 76.2], ["Omar Alharbi", "14 Plans", 54],
];
const ALL_DEALERS = [["Abdullah Al-Qahtani", "MBR-784291"], ["Member Name", "MBR-784291"], ["Mohammed Al-Dosari", "MBR-921674"], ["Khalid Al-Ghamdi", "MBR-468235"], ["Nasser Al-Harbi", "MBR-613852"]];

const Overview = ({ go }: { go: (s: Screen) => void }) => {
  const { t } = useTranslation();
  // Same month chips and Custom month Filter sheet as the dealer report.
  const period = useCustomMonth(t("commissionReport.lastMonth"));
  const [top, setTop] = useState("top");
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState("");
  const [member, setMember] = useState<string>();
  const list = top === "top" ? DEALERS : [...DEALERS].reverse();
  const people = ALL_DEALERS.filter(([n, c]) => !q || (n + c).toLowerCase().includes(q.toLowerCase()));

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
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-2 overflow-y-auto">
          {people.map(([n, c]) => (
            <button key={c + n} type="button" onClick={() => { setMember(n); setQ(""); setSheet(false); }}
              className={cn("w-full text-start flex items-center gap-3 rounded-xl px-3 py-3 border", member === n ? "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30" : "bg-muted/40 border-border/60")}>
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-primary" /></div>
              <div><p className="text-sm font-semibold text-foreground">{n}</p><p className="text-xs text-muted-foreground">{c}</p></div>
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

  return (
    <div className="space-y-4">
      <SearchBar value={q} onChange={setQ} placeholder={t("commissionReport.searchMember")} onFocus={() => setSheet(true)} />
      <Chips items={period.items} value={period.chipValue} onChange={period.onChipChange} />
      {period.drawer}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 p-3">
          <div className="flex items-center gap-2"><IconBox><Banknote className="w-4 h-4" /></IconBox><p className="text-xs font-semibold text-foreground leading-tight">{t("commissionReport.dealersCommission")}</p></div>
          <p className={cn("text-xl font-bold mt-2", POS)}>80%</p>
        </div>
        <div className="rounded-2xl bg-sky-50 border border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30 p-3">
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 flex items-center justify-center shrink-0"><Banknote className="w-4 h-4" /></div><p className="text-xs font-semibold text-foreground leading-tight">{t("commissionReport.myCommission")}</p></div>
          <p className="text-xl font-bold mt-2 text-sky-600 dark:text-sky-400">80%</p>
        </div>
      </div>
      <div className="rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 px-3 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0"><Info className="w-4 h-4 text-amber-600" /></div>
        <div><p className="text-xs font-semibold text-amber-600 dark:text-amber-300">{t("commissionReport.needsAttention")}</p><p className="text-xs text-foreground/80">{t("commissionReport.needsAttentionSub", { n: 6 })}</p></div>
      </div>
      <Card>
        <div className="mb-2">
          <h3 className="text-base font-semibold text-foreground">{t("commissionReport.dealersCommission")}</h3>
        </div>
        <Tabs items={[["top", t("commissionReport.top5")], ["low", t("commissionReport.lowest5")]]} value={top} onChange={setTop} />
        <div className="mt-3 space-y-2.5">
          {list.map(([n, p, v], i) => (
            <div key={n} className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border/50 px-3 py-3">
              <span className={cn("w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0", top === "top" ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600" : "bg-rose-50 dark:bg-rose-500/15 text-primary")}>{top === "top" ? i + 1 : 5 - i}</span>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-medium text-foreground truncate">{n}</p><p className="text-[11px] text-muted-foreground mt-0.5">{p}</p></div>
              <span className={cn("text-xs font-semibold inline-flex items-center gap-1 tabular-nums", top === "top" ? POS : "text-primary")}><RiyalSymbol /> {v.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Card>
      {sheetEl}
    </div>
  );
};

// ---------------------------------------------------------------- page

const TITLES: Record<Screen, string> = {
  plans: "My Plans", scheme1: "Scheme 1 Breakdown", kpi: "Scheme 1 Breakdown", scheme2prepaid: "Scheme 2 Prepaid", scheme2postpaid: "Scheme 2 Postpaid",
  pli: "Partner Level Incentive", hbb: "HBB/ V-Net", fr: "FR Promotional Packages", clawbacks: "Postpaid Clawbacks", hbbClawbacks: "HBB/V-Net Clawbacks", activities: "Activities",
};

const CommissionReport = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const manager = params.get("view") === "manager";
  const [stack, setStack] = useState<Screen[]>([]);
  const [tab, setTab] = useState<"overview" | "mine">(manager ? "overview" : "mine");
  const screen = stack[stack.length - 1];
  const go = (s: Screen) => setStack((st) => [...st, s]);

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
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
        {!screen && (tab === "overview" && manager ? <Overview go={go} /> : <MyCommission go={go} />)}
        {screen === "plans" && <PlansScreen go={go} />}
        {screen === "scheme1" && <Scheme1Screen go={go} />}
        {screen === "kpi" && <KpiScreen />}
        {screen && screen in BREAKDOWNS && <BreakdownScreen kind={screen as BreakdownKind} go={go} />}
        {screen === "activities" && <ActivitiesScreen kind={stack[stack.length - 2] as BreakdownKind} />}
      </div>
    </div>
  );
};

export default CommissionReport;
