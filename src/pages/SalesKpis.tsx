import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X as XIcon } from "lucide-react";

// Demo only — every card shows the same generic figures, matching the design mock exactly.
const DEMO_KPIS = [
  { id: "kpi-1", updatedOn: "2/5/2026", degrowth: 10, pct: 90, target: "300", achievement: "298.326", lm: "132.56", mtd: "25.13", lmtd: "213.21" },
  { id: "kpi-2", updatedOn: "2/5/2026", degrowth: 10, pct: 90, target: "300", achievement: "298.326", lm: "132.56", mtd: "25.13", lmtd: "213.21" },
  { id: "kpi-3", updatedOn: "2/5/2026", degrowth: 10, pct: 90, target: "300", achievement: "298.326", lm: "132.56", mtd: "25.13", lmtd: "213.21" },
];

const TABS = ["revenue", "acquisition", "geography", "distribution"] as const;

const FILTER_FIELDS = [
  { key: "accountManager", options: ["Ahmed Al-Otaibi", "Sara Al-Harbi", "Faisal Al-Qahtani"] },
  { key: "dms", options: ["DMS 1", "DMS 2", "DMS 3"] },
  { key: "dealer", options: ["Dealer 1", "Dealer 2", "Dealer 3"] },
  { key: "area", options: ["Central", "Eastern", "Western"] },
  { key: "region", options: ["Riyadh Region", "Makkah Region", "Eastern Region"] },
  { key: "willaya", options: ["Willaya 1", "Willaya 2", "Willaya 3"] },
  { key: "location", options: ["Riyadh", "Jeddah", "Dammam"] },
] as const;

const RingProgress = ({ percent }: { percent: number }) => {
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="text-teal-500" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">{percent}%</span>
    </div>
  );
};

const SalesKpis = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [tab, setTab] = useState<(typeof TABS)[number]>("revenue");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const chips = useMemo(
    () => [
      { key: "lm", label: t("salesKpis.lm"), bg: "bg-pink-100 dark:bg-pink-500/10", text: "text-pink-600 dark:text-pink-300" },
      { key: "mtd", label: t("salesKpis.mtd"), bg: "bg-sky-100 dark:bg-sky-500/10", text: "text-sky-600 dark:text-sky-300" },
      { key: "lmtd", label: t("salesKpis.lmtd"), bg: "bg-teal-100 dark:bg-teal-500/10", text: "text-teal-600 dark:text-teal-300" },
    ] as const,
    [t],
  );

  const openFilter = () => {
    setDraftFilters(appliedFilters);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setAppliedFilters(draftFilters);
    setFilterOpen(false);
  };

  const clearFilter = () => setDraftFilters({});

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("salesKpis.title")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors", tab === tb ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              {t(`salesKpis.tabs.${tb}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("salesKpis.searchPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
          </div>
          <button
            type="button"
            onClick={openFilter}
            aria-label={t("salesKpis.filter.title")}
            className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {DEMO_KPIS.map((kpi) => (
          <div key={kpi.id} className="rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm">
            <div className="bg-rose-50 dark:bg-rose-500/10 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{t("salesKpis.kpiName")}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("salesKpis.updatedOn", { date: kpi.updatedOn })}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 shrink-0">
                {t("salesKpis.degrowth", { value: kpi.degrowth })}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <RingProgress percent={kpi.pct} />
                  <p className="text-[10px] text-muted-foreground text-center leading-tight w-24">{t("salesKpis.achievementTarget")}</p>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="rounded-xl bg-muted/50 px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("salesKpis.target")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{kpi.target}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-3 py-2 text-center">
                    <p className="text-xs text-muted-foreground">{t("salesKpis.achievement")}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{kpi.achievement}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {chips.map((c) => (
                  <div key={c.key} className={cn("rounded-xl px-2 py-2 text-center", c.bg)}>
                    <p className={cn("text-[10px] font-semibold", c.text)}>{c.label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{kpi[c.key as "lm" | "mtd" | "lmtd"]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Filter drawer ---------- */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setFilterOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("salesKpis.filter.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("salesKpis.filter.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            {FILTER_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground px-1">{t(`salesKpis.filter.${f.key}`)}</p>
                <Select value={draftFilters[f.key] ?? ""} onValueChange={(v) => setDraftFilters((prev) => ({ ...prev, [f.key]: v }))}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t(`salesKpis.filter.${f.key}Placeholder`)} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <button type="button" onClick={applyFilter} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {t("salesKpis.filter.apply")}
            </button>
            <button type="button" onClick={clearFilter} className="w-full text-center text-sm font-medium text-primary">
              {t("salesKpis.filter.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SalesKpis;
