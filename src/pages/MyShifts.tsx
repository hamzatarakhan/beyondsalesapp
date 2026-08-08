import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import { format, addDays, subDays } from "date-fns";
import AppHeader from "@/components/AppHeader";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import StoreLocationMap from "@/components/StoreLocationMap";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X, CalendarX, MapPin, Clock, ChevronRight } from "lucide-react";

// Stretches the date-picker grid to the full width of its drawer (mirrors
// OnboardingRequests.tsx's date-range picker).
const FULL_WIDTH_CALENDAR_CLASSNAMES = {
  caption_label: "text-sm font-bold text-primary",
  months: "w-full",
  month: "w-full space-y-4",
  table: "w-full border-collapse space-y-1",
  head_row: "flex w-full",
  head_cell: "text-muted-foreground flex-1 text-center font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "flex-1 flex items-center justify-center h-9 text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
};

type ShiftStatus = "scheduled" | "not-started" | "not-checked-in" | "completed";

interface ShiftRecord {
  id: string;
  date: Date;
  status: ShiftStatus;
  start: string;
  end: string;
  storeName: string;
  storeLocation: string;
  checkInTime?: string;
  checkOutTime?: string;
}

const today = new Date();

// Prototype-only demo shifts — no scheduling backend to source this from yet.
const DEMO_SHIFTS: ShiftRecord[] = [
  { id: "shift-1", date: today, status: "not-started", start: "10:00 AM", end: "6:00 PM", storeName: "home.workingShift.stores.s1.name", storeLocation: "home.workingShift.stores.s1.location" },
  { id: "shift-2", date: subDays(today, 1), status: "completed", start: "10:00 AM", end: "6:00 PM", storeName: "home.workingShift.stores.s2.name", storeLocation: "home.workingShift.stores.s2.location", checkInTime: "10:05 AM", checkOutTime: "6:10 PM" },
  { id: "shift-3", date: addDays(today, 1), status: "scheduled", start: "10:00 AM", end: "6:00 PM", storeName: "home.workingShift.stores.s3.name", storeLocation: "home.workingShift.stores.s3.location" },
  { id: "shift-4", date: subDays(today, 3), status: "not-checked-in", start: "10:00 AM", end: "6:00 PM", storeName: "home.workingShift.stores.s4.name", storeLocation: "home.workingShift.stores.s4.location" },
  { id: "shift-5", date: subDays(today, 4), status: "completed", start: "10:00 AM", end: "6:00 PM", storeName: "home.workingShift.stores.s5.name", storeLocation: "home.workingShift.stores.s5.location", checkInTime: "9:58 AM", checkOutTime: "6:02 PM" },
];

type StatusFilter = "all" | ShiftStatus;

const MyShifts = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STATUS_STYLE: Record<ShiftStatus, string> = {
    scheduled: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    "not-started": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    "not-checked-in": "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };

  const STATUS_LABEL: Record<ShiftStatus, string> = {
    scheduled: t("myShifts.statusScheduled"),
    "not-started": t("myShifts.statusNotStarted"),
    "not-checked-in": t("myShifts.statusNotCheckedIn"),
    completed: t("myShifts.statusCompleted"),
  };

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [mapShift, setMapShift] = useState<ShiftRecord | null>(null);

  const hasActiveFilter = statusFilter !== "all" || !!dateRange?.from;
  const activeFilterLabel = statusFilter !== "all" ? STATUS_LABEL[statusFilter] : dateRange?.from ? t("onboardingRequests.customDate") : null;

  const clearActiveFilter = () => {
    setStatusFilter("all");
    setDateRange(undefined);
  };

  const openFilter = () => {
    setDraftStatus(statusFilter);
    setDraftDateRange(dateRange);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setStatusFilter(draftStatus);
    setDateRange(draftDateRange);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setDraftStatus("all");
    setDraftDateRange(undefined);
  };

  const filtered = DEMO_SHIFTS.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesDate = !dateRange?.from || (s.date >= dateRange.from && s.date <= (dateRange.to ?? dateRange.from));
    return matchesStatus && matchesDate;
  }).sort((a, b) => b.date.getTime() - a.date.getTime());

  const dateLabel = (d: Date) => {
    if (format(d, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return `${t("home.workingShift.today")}, ${format(d, "d MMM")}`;
    if (format(d, "yyyy-MM-dd") === format(addDays(today, 1), "yyyy-MM-dd")) return `${t("myShifts.tomorrow")}, ${format(d, "d MMM")}`;
    return format(d, "d MMM");
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-6">
      <AppHeader title={t("myShifts.pageTitle")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        <button
          type="button"
          onClick={openFilter}
          className="w-full h-11 rounded-xl bg-card border border-border shadow-sm flex items-center justify-between px-3.5"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontal className="w-4 h-4 text-primary" /> {t("myShifts.filters")}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>

        {hasActiveFilter && activeFilterLabel && (
          <div className="flex">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-destructive text-destructive text-xs font-semibold">
              {activeFilterLabel}
              <button type="button" onClick={clearActiveFilter} aria-label={t("onboardingRequests.clearFilterAria")}>
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <CalendarX className="w-7 h-7 text-destructive" />
            </div>
            <p className="font-semibold text-foreground">{t("myShifts.noResultsTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("myShifts.noResultsSubtitle")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="bg-card rounded-2xl p-3 shadow-sm border border-border/60 space-y-3">
                <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <p dir="ltr" className="text-sm font-semibold text-foreground">{s.start} - {s.end}</p>
                    <p className="text-xs text-muted-foreground">{dateLabel(s.date)}</p>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium shrink-0", STATUS_STYLE[s.status])}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>

                <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t(s.storeName)}</p>
                      <p className="text-xs text-muted-foreground truncate">{t(s.storeLocation)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMapShift(s)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-medium shrink-0"
                  >
                    {t("home.workingShift.viewMap")}
                  </button>
                </div>

                {(s.checkInTime || s.checkOutTime) && (
                  <div className="flex gap-2">
                    {s.checkInTime && (
                      <span className="flex-1 text-center px-2 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium">
                        ✓ {t("home.workingShift.checkInLabel")}: <bdi dir="ltr">{s.checkInTime}</bdi>
                      </span>
                    )}
                    {s.checkOutTime && (
                      <span className="flex-1 text-center px-2 py-1.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 text-xs font-medium">
                        ✓ {t("home.workingShift.checkOutLabel")}: <bdi dir="ltr">{s.checkOutTime}</bdi>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter drawer */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{t("myShifts.filterTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("myShifts.filterSubtitle")}</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>

          <div className="space-y-4 pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("myShifts.status")}</p>
              <div className="flex flex-wrap gap-2">
                {([["all", t("onboardingRequests.filterAll")], ["scheduled", STATUS_LABEL.scheduled], ["not-started", STATUS_LABEL["not-started"]], ["not-checked-in", STATUS_LABEL["not-checked-in"]], ["completed", STATUS_LABEL.completed]] as [StatusFilter, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraftStatus(value)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-xs font-semibold transition-colors",
                      draftStatus === value ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    {value !== "all" && "+ "}{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("myShifts.dateDuration")}</p>
              <button
                type="button"
                onClick={() => { setFilterOpen(false); setDateOpen(true); }}
                className="w-full h-12 rounded-xl border border-input bg-card px-3 flex items-center justify-between text-sm text-start"
              >
                <span className={draftDateRange?.from ? "text-foreground" : "text-muted-foreground"}>
                  {draftDateRange?.from
                    ? draftDateRange.to
                      ? `${format(draftDateRange.from, "d MMM yyyy")} - ${format(draftDateRange.to, "d MMM yyyy")}`
                      : format(draftDateRange.from, "d MMM yyyy")
                    : t("onboardingRequests.selectDate")}
                </span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <Button className="w-full h-12 rounded-full font-semibold" onClick={applyFilter}>{t("channelOnboarding.apply")}</Button>
          <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={clearFilter}>{t("onboardingRequests.clearFilter")}</button>
        </DrawerContent>
      </Drawer>

      {/* Date range drawer */}
      <Drawer open={dateOpen} onOpenChange={(o) => { setDateOpen(o); if (!o) setFilterOpen(true); }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-1">
            <div className="flex-1 text-center">
              <h3 className="text-lg font-bold text-foreground">{t("channelOnboarding.pickADate")}</h3>
              <p className="text-xs text-muted-foreground">{t("channelOnboarding.pleaseSelectDate")}</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center absolute end-5 top-4">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>

          <Calendar
            mode="range"
            selected={draftDateRange}
            onSelect={setDraftDateRange}
            defaultMonth={draftDateRange?.from}
            numberOfMonths={1}
            className="w-full p-0"
            classNames={FULL_WIDTH_CALENDAR_CLASSNAMES}
          />

          <div className="rounded-xl bg-muted/40 divide-y divide-border mb-4 mt-2">
            <div className="px-3 py-2.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("onboardingRequests.dateFrom")}</span>
              <span className="font-semibold text-foreground">{draftDateRange?.from ? format(draftDateRange.from, "d MMM yyyy") : "—"}</span>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("onboardingRequests.dateTo")}</span>
              <span className="font-semibold text-foreground">{draftDateRange?.to ? format(draftDateRange.to, "d MMM yyyy") : "—"}</span>
            </div>
          </div>

          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setDateOpen(false); setFilterOpen(true); }}>{t("channelOnboarding.apply")}</Button>
          <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setDraftDateRange(undefined)}>{t("onboardingRequests.clearFilter")}</button>
        </DrawerContent>
      </Drawer>

      <StoreLocationMap
        open={!!mapShift}
        onOpenChange={(o) => !o && setMapShift(null)}
        storeName={mapShift ? t(mapShift.storeName) : ""}
        storeLocation={mapShift ? t(mapShift.storeLocation) : ""}
      />
    </div>
  );
};

export default MyShifts;
