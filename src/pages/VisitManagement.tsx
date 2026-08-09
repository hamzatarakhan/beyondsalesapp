import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarDays, Info, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import AppHeader from "@/components/AppHeader";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

type VisitStatus = "pending" | "active" | "completed" | "missed" | "canceled";

interface Visit {
  id: string;
  name: string;
  type: "planned" | "adhoc";
  status: VisitStatus;
  from: Date;
  to?: Date;
}

// Prototype-only demo list — no visit backend yet.
const DEMO_VISITS: Visit[] = [
  { id: "VST-1001", name: "Riyadh North Route", type: "planned", status: "pending", from: new Date(2026, 11, 15), to: new Date(2026, 11, 20) },
  { id: "VST-1002", name: "Jeddah Corniche Route", type: "adhoc", status: "missed", from: new Date(2026, 11, 15) },
  { id: "VST-1003", name: "Tahlia Dealers", type: "adhoc", status: "completed", from: new Date(2026, 11, 15) },
  { id: "VST-1004", name: "Dammam Central", type: "planned", status: "canceled", from: new Date(2026, 11, 15), to: new Date(2026, 11, 20) },
  { id: "VST-1005", name: "Al Nakheel Plaza", type: "planned", status: "active", from: new Date(2026, 11, 15), to: new Date(2026, 11, 20) },
];

const STATUS_STYLE: Record<VisitStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  active: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  missed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  canceled: "bg-muted text-muted-foreground",
};

const ALL_STATUSES: VisitStatus[] = ["pending", "active", "completed", "missed", "canceled"];

const VisitManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // Applied filters vs. the draft the dealer is editing inside the sheet.
  const [statuses, setStatuses] = useState<VisitStatus[]>([]);
  const [range, setRange] = useState<DateRange | undefined>();
  const [draftStatuses, setDraftStatuses] = useState<VisitStatus[]>([]);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();

  const openFilter = () => {
    setDraftStatuses(statuses);
    setDraftRange(range);
    setFilterOpen(true);
  };

  const toggleDraftStatus = (s: VisitStatus) => {
    setDraftStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const applyFilters = () => {
    setStatuses(draftStatuses);
    setRange(draftRange);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftStatuses([]);
    setDraftRange(undefined);
    setStatuses([]);
    setRange(undefined);
    setFilterOpen(false);
  };

  const visits = useMemo(() => {
    return DEMO_VISITS.filter((v) => {
      if (query && !v.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (statuses.length && !statuses.includes(v.status)) return false;
      if (range?.from && (v.to ?? v.from) < range.from) return false;
      if (range?.to && v.from > range.to) return false;
      return true;
    });
  }, [query, statuses, range]);

  const fmt = (d: Date) => format(d, "d MMM yyyy");
  const draftRangeLabel = draftRange?.from
    ? `${fmt(draftRange.from)}${draftRange.to ? ` - ${fmt(draftRange.to)}` : ""}`
    : t("visits.selectDate");

  return (
    <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
      <AppHeader title={t("visits.title")} showBack />

      {/* Search + filter */}
      <div className="px-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("visits.search")}
            className="w-full h-12 rounded-xl bg-card border border-border ps-4 pe-11 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />
          <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>
        <button
          onClick={openFilter}
          aria-label={t("visits.filter")}
          className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0"
        >
          <SlidersHorizontal className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {visits.map((v) => (
          <button
            key={v.id}
            onClick={() => navigate("/coming-soon")}
            className="w-full text-start relative overflow-hidden rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4 ps-5"
          >
            <span className="absolute start-0 top-0 bottom-0 w-1.5 bg-primary" />
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-foreground">{v.name}</p>
              <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[v.status]}`}>
                {t(`visits.status.${v.status}`)}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <Info className="w-4 h-4" />
              {v.type === "planned" ? t("visits.planned") : t("visits.adHoc")}
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <CalendarDays className="w-4 h-4" />
              {fmt(v.from)}{v.to ? ` - ${fmt(v.to)}` : ""}
            </p>
          </button>
        ))}
        {visits.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">{t("visits.empty")}</p>
        )}
      </div>

      {/* Add new visit — expands into the two visit kinds */}
      <div className="fixed bottom-6 end-4 z-20 flex flex-col items-end gap-3">
        {addOpen && (
          <>
            <button
              onClick={() => { setAddOpen(false); navigate("/coming-soon"); }}
              className="px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg"
            >
              {t("visits.adHocVisit")}
            </button>
            <button
              onClick={() => { setAddOpen(false); navigate("/coming-soon"); }}
              className="px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg"
            >
              {t("visits.plannedVisit")}
            </button>
          </>
        )}
        <button
          onClick={() => setAddOpen((o) => !o)}
          className="px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg flex items-center gap-1.5"
        >
          <Plus className={`w-4 h-4 transition-transform ${addOpen ? "rotate-45" : ""}`} />
          {t("visits.addNewVisit")}
        </button>
      </div>

      {/* Filter sheet */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setFilterOpen(false)}
            aria-label={t("visits.close")}
            className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-lg font-semibold">{t("visits.filter")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {t("visits.filterSubtitle")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <p className="text-sm font-medium text-foreground mb-2">{t("visits.visitStatus")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDraftStatuses([])}
                className={`px-4 py-1.5 rounded-full text-xs font-medium ${draftStatuses.length === 0 ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}
              >
                {t("visits.status.all")}
              </button>
              {ALL_STATUSES.map((s) => {
                const on = draftStatuses.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleDraftStatus(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${on ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}
                  >
                    {!on && <Plus className="w-3 h-3" />}
                    {t(`visits.status.${s}`)}
                  </button>
                );
              })}
            </div>

            <p className="text-sm font-medium text-foreground mt-5 mb-2">{t("visits.dateDuration")}</p>
            <button
              onClick={() => setDateOpen(true)}
              className="w-full h-12 rounded-xl border border-border bg-card px-4 flex items-center justify-between"
            >
              <span className={`text-sm ${draftRange?.from ? "text-foreground" : "text-muted-foreground"}`}>
                {draftRangeLabel}
              </span>
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              onClick={applyFilters}
              className="w-full mt-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("visits.apply")}
            </button>
            <button
              onClick={clearFilters}
              className="w-full mt-3 py-2 text-primary font-semibold text-sm"
            >
              {t("visits.clearFilter")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Date range picker sheet */}
      <Drawer open={dateOpen} onOpenChange={setDateOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[92vh]">
          <button
            onClick={() => setDateOpen(false)}
            aria-label={t("visits.close")}
            className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-lg font-semibold">{t("visits.pickDate")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {t("visits.pickDateSubtitle")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-2 pb-6 overflow-y-auto scrollbar-hide">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              className="w-full p-0 [&_.rdp-month]:w-full [&_table]:w-full"
            />
            <div className="mx-2 mt-3 rounded-2xl bg-muted/40 px-3 divide-y divide-border/60">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">{t("visits.dateFrom")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {draftRange?.from ? fmt(draftRange.from) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">{t("visits.dateTo")}</span>
                <span className="text-sm font-semibold text-foreground">
                  {draftRange?.to ? fmt(draftRange.to) : "—"}
                </span>
              </div>
            </div>
            <div className="px-2">
              <button
                onClick={() => setDateOpen(false)}
                className="w-full mt-4 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
              >
                {t("visits.apply")}
              </button>
              <button
                onClick={() => { setDraftRange(undefined); setDateOpen(false); }}
                className="w-full mt-2 py-2 text-primary font-semibold text-sm"
              >
                {t("visits.clearFilter")}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default VisitManagement;
