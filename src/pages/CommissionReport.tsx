import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { AlertTriangle, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import KpiDonut from "@/components/KpiDonut";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

// Prototype-only: every figure below is demo data copied from the Commission Report designs.
// One page serves both roles — ?view=dealer shows the dealer's own report, ?view=manager adds
// the Overview tab (team commission, dealers list) in front of the same "My Commission" tab.
// Drill-down screens are a local stack so Back always steps up one level, then leaves.

type Screen = "plans" | "scheme1" | "scheme2prepaid" | "scheme2postpaid" | "hbb" | "clawbacks" | "activities";

const GAUGE = "hsl(var(--kpi-gauge))";
const GAUGE_TRACK = "hsl(var(--kpi-gauge-track))";

const Money = ({ v, sign, className }: { v: number | string; sign?: boolean; className?: string }) => {
  const n = typeof v === "number" ? v : null;
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", n !== null && n < 0 ? "text-primary" : sign ? "text-emerald-600 dark:text-emerald-400" : "", className)}>
      {n !== null && sign ? (n < 0 ? "-" : "+") : ""}<RiyalSymbol /> {n !== null ? Math.abs(n).toLocaleString() : v}
    </span>
  );
};

const Bar = ({ pct, danger }: { pct: number; danger?: boolean }) => (
  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: GAUGE_TRACK }}>
    <div className={cn("h-full rounded-full", danger && "bg-primary")} style={{ width: `${Math.min(100, pct)}%`, background: danger ? undefined : GAUGE }} />
  </div>
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-2xl bg-card border border-border/60 shadow-sm p-4", className)}>{children}</div>
);

const Banner = ({ label, value, tone = "good", badge }: { label: string; value: number; tone?: "good" | "bad"; badge?: string }) => (
  <div className={cn("rounded-2xl px-4 py-3", tone === "good" ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10")}>
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {badge && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{badge}</span>}
    </div>
    <p className={cn("text-xl font-bold mt-0.5", tone === "bad" ? "text-primary" : "text-emerald-700 dark:text-emerald-300")}><Money v={value} /></p>
  </div>
);

const Row = ({ title, sub, value, onClick, danger }: { title: string; sub?: string; value: number; onClick?: () => void; danger?: boolean }) => (
  <button type="button" onClick={onClick} disabled={!onClick} className="w-full text-start flex items-center gap-2 py-2.5 border-b border-border/50 last:border-0 disabled:cursor-default">
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-foreground truncate">{title}</p>
      {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
    </div>
    <span className={cn("text-[13px] font-bold", danger && "text-primary")}><Money v={value} sign /></span>
    {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />}
  </button>
);

const Chips = ({ items, value, onChange }: { items: string[]; value: string; onChange: (v: string) => void }) => (
  <div className="flex gap-2 overflow-x-auto no-scrollbar">
    {items.map((c) => (
      <button key={c} type="button" onClick={() => onChange(c)}
        className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border-[0.5px] shrink-0",
          value === c ? "bg-primary/10 border-primary/20 text-primary" : "bg-card border-border text-muted-foreground")}>
        {c}
      </button>
    ))}
  </div>
);

const rangeLabel = (r?: DateRange) => (r?.from && r.to ? `${format(r.from, "MMM d")} – ${format(r.to, "MMM d")}` : undefined);

// Bottom sheet behind every "Custom" chip: pick a from/to range, Apply commits it, dismissing keeps the old one.
const CustomRangeDrawer = ({ open, onOpenChange, value, onApply }: { open: boolean; onOpenChange: (o: boolean) => void; value?: DateRange; onApply: (r: DateRange) => void }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[90vh]">
        <div className="flex items-center justify-between pb-1">
          <DrawerTitle className="text-lg font-bold text-foreground">{t("commissionReport.selectDates")}</DrawerTitle>
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t("settings.close")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <DrawerDescription className="text-xs text-muted-foreground">{rangeLabel(draft) ?? t("commissionReport.selectDatesHint")}</DrawerDescription>
        <div className="flex justify-center">
          <Calendar mode="range" selected={draft} onSelect={setDraft} defaultMonth={draft?.from} disabled={{ after: new Date() }} />
        </div>
        <Button disabled={!draft?.from || !draft?.to} onClick={() => { onApply(draft!); onOpenChange(false); }} className="w-full h-12 rounded-full text-base font-medium">
          {t("commissionReport.apply")}
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

// Chip list whose last item is "Custom": tapping it opens the calendar, and once a range is
// applied that chip shows the range instead of the word "Custom".
const useCustomRange = (initial: string) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initial);
  const [range, setRange] = useState<DateRange>();
  const [open, setOpen] = useState(false);
  const customLabel = rangeLabel(range) ?? t("commissionReport.custom");
  const isCustom = selected === "__custom";
  return {
    customLabel,
    label: isCustom ? customLabel : selected,
    chipValue: isCustom ? customLabel : selected,
    onChipChange: (v: string) => (v === customLabel ? setOpen(true) : setSelected(v)),
    drawer: <CustomRangeDrawer open={open} onOpenChange={setOpen} value={range} onApply={(r) => { setRange(r); setSelected("__custom"); }} />,
  };
};

// ---------------------------------------------------------------- dealer / "My Commission"

const PAYOUT = [["Mar", 8200], ["Apr", 11400], ["May", 10300], ["Jun", 13300], ["Jul", 13500], ["Aug", 14300]] as const;

const MyCommission = ({ go }: { go: (s: Screen) => void }) => {
  const { t } = useTranslation();
  const period = useCustomRange("Aug");
  const max = Math.max(...PAYOUT.map((p) => p[1]));
  return (
    <div className="space-y-4">
      <Chips items={["Aug", "Jul", "Jun", period.customLabel]} value={period.chipValue} onChange={period.onChipChange} />
      {period.drawer}
      <Banner label={t("commissionReport.earnedIn", { month: period.label })} value={period.label === "Aug" ? 11230 : 9870} badge={t("commissionReport.approved")} />
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">{t("commissionReport.myPlan")}</h3>
          <button type="button" onClick={() => go("plans")} className="text-xs font-semibold text-primary">{t("commissionReport.seeAll")} ›</button>
        </div>
        <Row title="Scheme 1 Commission" sub="Weight 100%" value={6550} onClick={() => go("scheme1")} />
        <Row title="Scheme 2 Prepaid KPI" sub="Weight 100%" value={5250} onClick={() => go("scheme2prepaid")} />
        <Row title="Postpaid Claw backs" sub="6 lines stopped before 3rd bill" value={-150} danger onClick={() => go("clawbacks")} />
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-foreground">{t("commissionReport.payout")}</h3>
        <p className="text-[11px] text-muted-foreground mb-3">{t("commissionReport.last6")}</p>
        <div className="flex items-end gap-2 h-32">
          {PAYOUT.map(([m, v], i) => (
            <div key={m} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[9px] text-muted-foreground tabular-nums">{v.toLocaleString()}</span>
              <div className="w-full rounded-md" style={{ height: `${(v / max) * 80}%`, background: i === PAYOUT.length - 1 ? GAUGE : "hsl(var(--kpi-gauge-bright) / 0.2)" }} />
              <span className="text-[10px] text-muted-foreground">{m}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- drill-down screens

const PlansScreen = ({ go }: { go: (s: Screen) => void }) => (
  <div className="space-y-4">
    <Card>
      <p className="text-xs font-semibold text-muted-foreground mb-1">Scheme 1</p>
      <Row title="Scheme 1 Commission" sub="Weight 100%" value={6550} onClick={() => go("scheme1")} />
      <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">Scheme 2</p>
      <Row title="Scheme 2 Prepaid" sub="Weight 100%" value={5250} onClick={() => go("scheme2prepaid")} />
      <Row title="Scheme 2 Postpaid" sub="Weight 100%" value={5250} onClick={() => go("scheme2postpaid")} />
      <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">Change Requests</p>
      <Row title="HBB / V-Net Commission" sub="Under 105% of target" value={10500} onClick={() => go("hbb")} />
      <Row title="FR Promotional Packages" sub="60 lines" value={1200} />
      <p className="text-xs font-semibold text-muted-foreground mt-3 mb-1">Clawbacks</p>
      <Row title="Postpaid Claw backs" sub="6 lines stopped before 3rd bill" value={-150} danger onClick={() => go("clawbacks")} />
      <Row title="HBB/V-Net Claw backs" sub="3 lines early disconnect" value={-150} danger onClick={() => go("clawbacks")} />
    </Card>
  </div>
);

const KPI_ROWS = [
  ["V FPE", 70, "Achieved 80%", false], ["F FPE", 40, "Achieved 60%", true], ["V IBR", 75, "Achieved 90%", false],
  ["F IBR", 72, "Achieved 85%", false], ["F IBR", 68, "Achieved 82%", false],
] as const;
const BANDS: [string, string, boolean?][] = [["0 – 70%", "Nothing"], ["70 – 90%", "3,300"], ["90 – 100% · your band", "5,400", true], ["100 – 120%", "6,600"], ["From 120%", "7,800 max"]];

const Scheme1Screen = () => (
  <div className="space-y-4">
    <Banner label="Earned in August" value={74000} badge="Approved" />
    <Card>
      <h3 className="text-sm font-semibold text-foreground mb-1">Conditions</h3>
      <p className="text-[11px] text-muted-foreground mb-3">Must be met to earn anything from this scheme</p>
      {[["V FPE · Min 70%", 100], ["F FPE · Min 70%", 100]].map(([l, p]) => (
        <div key={l as string} className="mb-2"><div className="flex justify-between text-[11px] text-muted-foreground mb-1"><span>{l}</span><span>{p}%</span></div><Bar pct={p as number} /></div>
      ))}
    </Card>
    <Card>
      <h3 className="text-sm font-semibold text-foreground mb-3">KPI breakdown</h3>
      <div className="space-y-3">
        {KPI_ROWS.map(([l, p, b, low], i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-foreground">{l}</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", low ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300")}>{b}</span>
            </div>
            <Bar pct={p} danger={low} />
            <p className="text-[10px] text-muted-foreground mt-1">Min 70% · Max 120% · Weight 20%</p>
          </div>
        ))}
      </div>
    </Card>
    <Card>
      <h3 className="text-sm font-semibold text-foreground mb-2">KPI Score Payout</h3>
      {BANDS.map(([l, v, on]) => (
        <div key={l} className={cn("flex justify-between text-xs px-2 py-2 rounded-lg", on && "bg-primary/10 text-primary font-semibold")}><span>{l}</span><span className="tabular-nums">{v}</span></div>
      ))}
    </Card>
    <Card>
      <div className="flex justify-between text-sm font-semibold mb-2"><span>Incentive bonus</span><span className="text-xs text-muted-foreground">93% of target</span></div>
      <div className="flex justify-between text-xs px-2 py-2 rounded-lg bg-primary/10 text-primary font-semibold"><span>90 – 100% · your band</span><span>+1,000</span></div>
    </Card>
  </div>
);

type Section = { title: string; amount: string | number; rows?: [string, string][] };
const BREAKDOWNS: Record<"scheme2prepaid" | "scheme2postpaid" | "hbb" | "clawbacks", { banner: string; value: number; bad?: boolean; activities: string; sections: Section[]; head?: string }> = {
  scheme2prepaid: { banner: "Total earned", value: 9800, activities: "1,000 lines", head: "Earnings breakdown", sections: [
    { title: "Prepaid Activations", amount: "0.00", rows: [["Any", "0%"]] }, { title: "IBR", amount: 10176, rows: [["Any", "40%"]] },
    { title: "First Recharge", amount: 6176, rows: [["Any", "20%"]] }, { title: "Second Recharge", amount: 6176, rows: [["Any", "20%"]] } ] },
  scheme2postpaid: { banner: "Total earned", value: 9800, activities: "99 lines", head: "Earnings breakdown", sections: [
    { title: "Postpaid Activations", amount: "0.00", rows: [["Any", "0%"]] },
    { title: "Acquisition", amount: 5850, rows: [["Below 200 · 22 lines", "50%"], ["Above 200 · 42 lines", "100% Fixed amount"]] },
    { title: "3rd Bill Issued, Line Active", amount: 1750, rows: [["Below 200 · 7 lines", "50%"], ["Above 200 · 12 lines", "100% Fixed amount"]] } ] },
  hbb: { banner: "Total earned", value: 9800, activities: "103 lines", head: "Earnings breakdown", sections: [
    { title: "Conditions", amount: "At risk" },
    { title: "Activated Units", amount: 5250, rows: [["Any", "50% Fixed amount"]] }, { title: "Activated Units (Incentive)", amount: 5250, rows: [["Any", "50% Fixed amount"]] } ] },
  clawbacks: { banner: "Taken back", value: -550, bad: true, activities: "6 lines", head: "Deduction reasons", sections: [
    { title: "Acquisition received", amount: -550, rows: [["Below 200 · 3 lines", "-50%"], ["Below 200 · 3 lines", "-50%"]] } ] },
};

const BreakdownScreen = ({ kind, go }: { kind: keyof typeof BREAKDOWNS; go: (s: Screen) => void }) => {
  const b = BREAKDOWNS[kind];
  return (
    <div className="space-y-4">
      <Banner label={b.banner} value={b.value} tone={b.bad ? "bad" : "good"} />
      <Card className="p-0"><button type="button" onClick={() => go("activities")} className="w-full text-start flex items-center justify-between px-4 py-3">
        <div><p className="text-sm font-semibold text-foreground">Activities</p><p className="text-[11px] text-muted-foreground">{b.activities}</p></div>
        <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
      </button></Card>
      <p className="text-xs font-semibold text-muted-foreground px-1">{b.head}</p>
      {b.sections.map((s) => (
        <Card key={s.title}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">{s.title}</span>
            <span className={cn("text-sm font-bold", typeof s.amount === "number" && s.amount < 0 && "text-primary")}>{typeof s.amount === "number" ? <Money v={s.amount} sign={false} /> : s.amount}</span>
          </div>
          {s.rows?.map(([l, v], i) => (
            <div key={i} className="mt-2 flex justify-between text-xs rounded-lg px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-muted-foreground"><span>{l}</span><span className="font-semibold text-foreground">{v}</span></div>
          ))}
        </Card>
      ))}
    </div>
  );
};

const ACTIVITY_ROWS = Array.from({ length: 8 }, (_, i) => ({ id: `ORD-2025-00${String(i + 1).padStart(4, "0")}`, kind: i % 3 === 0 ? "Acquisition" : "3rd Bill", date: `1${i}, Dec, 2025 · 1:00 AM` }));

const ActivitiesScreen = () => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const rows = ACTIVITY_ROWS.filter((r) => (f === "All" || r.kind === f) && (!q || r.id.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commissionReport.searchMsisdn")} className="h-11 bg-card rounded-xl ps-9" />
      </div>
      <Chips items={["All", "Acquisition", "3rd Bill"]} value={f} onChange={setF} />
      {rows.map((r) => (
        <Card key={r.id} className="py-3 flex items-center justify-between">
          <div><p className="text-xs font-semibold text-foreground">{r.id}</p><p className="text-[11px] text-muted-foreground">{r.kind}</p><p className="text-[11px] text-muted-foreground">{r.date}</p></div>
          <span className="text-sm font-bold"><Money v={5} sign /></span>
        </Card>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------- manager "Overview"

const DEALERS: [string, string, number, number][] = [
  ["Fahad Alotaibi", "30 Plans", 145, 90], ["Noura Alqahtani", "27 Plans", 132, 80], ["Saad Alghamdi", "22 Plans", 98, 65],
  ["Reem Aldosari", "18 Plans", 76, 50], ["Omar Alharbi", "14 Plans", 54, 40],
];
const ALL_DEALERS = [["Abdullah Al-Qahtani", "MBR-784231"], ["Member Name", "MBR-784231"], ["Mohammed Al-Dosari", "MBR-92474"], ["Khalid Al-Ghamdi", "MBR-45523"], ["Nasser Al-Harbi", "MBR-60852"]];

const Overview = () => {
  const { t } = useTranslation();
  const range = useCustomRange(t("commissionReport.last30"));
  const [top, setTop] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => (top ? DEALERS : [...DEALERS].reverse()), [top]);
  const people = ALL_DEALERS.filter(([n, c]) => !q || (n + c).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setSheet(true)} placeholder={t("commissionReport.searchMember")} className="h-11 bg-card rounded-xl ps-9 pe-10" />
        <SlidersHorizontal className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      </div>
      <Chips items={[t("commissionReport.today"), t("commissionReport.last7"), t("commissionReport.last30"), range.customLabel]} value={range.chipValue} onChange={range.onChipChange} />
      {range.drawer}
      <div className="grid grid-cols-2 gap-3">
        {[[t("commissionReport.dealersCommission"), 80], [t("commissionReport.myCommission"), 80]].map(([l, p]) => (
          <Card key={l as string} className="flex items-center gap-3 p-3">
            <KpiDonut percent={p as number} size={44} label={`${p}%`} labelClassName="text-[10px]" />
            <p className="text-xs font-semibold text-foreground leading-tight">{l}</p>
          </Card>
        ))}
      </div>
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div><p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t("commissionReport.needsAttention")}</p><p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">{t("commissionReport.needsAttentionSub", { n: 6 })}</p></div>
      </div>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t("commissionReport.dealersCommission")}</h3>
          <button type="button" onClick={() => setSheet(true)} className="text-xs font-semibold text-primary">{t("commissionReport.seeAll")} ›</button>
        </div>
        <Chips items={[t("commissionReport.top5"), t("commissionReport.lowest5")]} value={top ? t("commissionReport.top5") : t("commissionReport.lowest5")} onChange={(v) => setTop(v === t("commissionReport.top5"))} />
        <div className="mt-2">
          {list.map(([n, p, v], i) => (
            <div key={n} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-0"><p className="text-[13px] font-semibold text-foreground truncate">{n}</p><p className="text-[11px] text-muted-foreground">{p}</p></div>
              <span className="text-[13px] font-bold"><Money v={v} sign /></span>
            </div>
          ))}
        </div>
      </Card>

      <Drawer open={sheet} onOpenChange={setSheet}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[85vh]">
          <div className="flex items-center justify-between pb-3">
            <DrawerTitle className="text-lg font-bold text-foreground">{t("commissionReport.searchDealers")}</DrawerTitle>
            <button type="button" onClick={() => setSheet(false)} aria-label={t("settings.close")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
          <DrawerDescription className="sr-only">{t("commissionReport.searchDealers")}</DrawerDescription>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("commissionReport.searchMember")} className="h-11 rounded-xl mb-3" />
          {people.map(([n, c]) => (
            <div key={c + n} className="rounded-xl px-3 py-2.5 mb-2 bg-muted/50"><p className="text-sm font-semibold text-foreground">{n}</p><p className="text-[11px] text-muted-foreground">{c}</p></div>
          ))}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ---------------------------------------------------------------- page

const TITLES: Record<Screen, string> = {
  plans: "My Plans", scheme1: "Scheme 1 Breakdown", scheme2prepaid: "Scheme 2 Prepaid", scheme2postpaid: "Scheme 2 Postpaid",
  hbb: "HBB/ V-Net", clawbacks: "Postpaid Clawbacks", activities: "Activities",
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
          <div className="flex border-b border-border mb-4">
            {(["overview", "mine"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={cn("flex-1 py-2.5 text-sm font-semibold border-b-2 -mb-px", tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground")}>
                {t(k === "overview" ? "commissionReport.overview" : "commissionReport.myCommission")}
              </button>
            ))}
          </div>
        )}
        {!screen && (tab === "overview" && manager ? <Overview /> : <MyCommission go={go} />)}
        {screen === "plans" && <PlansScreen go={go} />}
        {screen === "scheme1" && <Scheme1Screen />}
        {(screen === "scheme2prepaid" || screen === "scheme2postpaid" || screen === "hbb" || screen === "clawbacks") && <BreakdownScreen kind={screen} go={go} />}
        {screen === "activities" && <ActivitiesScreen />}
      </div>
    </div>
  );
};

export default CommissionReport;
