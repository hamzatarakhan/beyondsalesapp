import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X as XIcon } from "lucide-react";

// Demo only — same trend shape under every card, one metric name each.
const CHART_DATA = [180, 400, 150, 90, 90, 20, 350].map((value, i) => ({ day: "Mon", value, i }));
const PEAK_INDEX = 1;

const FILTER_OPTIONS = ["mnp", "grossAdds", "churnRate", "arpu"] as const;
const DEMO_METRICS = FILTER_OPTIONS;

const TrendDot = (props: { cx?: number; cy?: number; payload?: { i: number } }) => {
  if (!props.payload || props.payload.i !== PEAK_INDEX) return null;
  return <circle cx={props.cx} cy={props.cy} r={4} fill="#2563eb" stroke="white" strokeWidth={2} />;
};

const PerformanceAtGlance = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const [appliedOptions, setAppliedOptions] = useState<Set<string>>(new Set());
  const [draftOptions, setDraftOptions] = useState<Set<string>>(new Set());

  const activeFilterCount = appliedOptions.size;

  const openFilter = () => {
    setDraftOptions(new Set(appliedOptions));
    setFilterSearch("");
    setFilterOpen(true);
  };

  const toggleDraftOption = (key: string) => {
    setDraftOptions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectFilter = () => {
    setAppliedOptions(draftOptions);
    setFilterOpen(false);
  };

  const clearFilter = () => setDraftOptions(new Set());

  const q = filterSearch.trim().toLowerCase();
  const filteredOptions = FILTER_OPTIONS.filter((key) => t(`performanceAtGlance.filter.options.${key}`).toLowerCase().includes(q));

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("performanceAtGlance.title")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("performanceAtGlance.searchPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
          </div>
          <button
            type="button"
            onClick={openFilter}
            aria-label={t("performanceAtGlance.filter.title")}
            className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {DEMO_METRICS.map((id) => (
          <div key={id} className="rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm">
            <div className="bg-rose-50 dark:bg-rose-500/10 px-4 py-3">
              <p className="text-sm font-bold text-foreground">{t(`performanceAtGlance.filter.options.${id}`)}</p>
            </div>
            <div className="p-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis ticks={[0, 100, 200, 300, 400]} domain={[0, 400]} axisLine={false} tickLine={false} width={32} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.15} dot={<TrendDot />} activeDot={false} />
                </AreaChart>
              </ResponsiveContainer>
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
            <DrawerTitle className="text-lg font-semibold">{t("performanceAtGlance.filter.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("performanceAtGlance.filter.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <div className="relative">
              <Input
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder={t("performanceAtGlance.filter.searchPlaceholder")}
                className="h-11 bg-background rounded-xl pe-9"
              />
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            <div className="divide-y divide-border/60">
              {filteredOptions.map((key) => (
                <label key={key} className="flex items-center gap-3 py-3.5 cursor-pointer">
                  <Checkbox checked={draftOptions.has(key)} onCheckedChange={() => toggleDraftOption(key)} className="w-5 h-5 rounded-md" />
                  <span className="text-sm text-foreground">{t(`performanceAtGlance.filter.options.${key}`)}</span>
                </label>
              ))}
            </div>

            <button type="button" onClick={selectFilter} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {t("performanceAtGlance.filter.select")}
            </button>
            <button type="button" onClick={clearFilter} className="w-full text-center text-sm font-medium text-primary">
              {t("performanceAtGlance.filter.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PerformanceAtGlance;
