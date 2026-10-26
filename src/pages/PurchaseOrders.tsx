import { useMemo, useState } from "react";
import FitChips from "@/components/FitChips";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X as XIcon, Clock, Plus } from "lucide-react";
import { purchaseOrders, PURCHASE_ORDER_PRODUCTS, type PurchaseOrderStatus } from "@/data/purchaseOrdersStore";

const STATUSES: PurchaseOrderStatus[] = ["awaitingApproval", "awaitingScanning", "awaitingDelivery", "received", "issueReported", "rejected", "cancelled"];

const STATUS_STYLE: Record<PurchaseOrderStatus, string> = {
  rfq: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  quotationSent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  awaitingApproval: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  awaitingScanning: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  partiallyScanned: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  awaitingDelivery: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  received: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  issueReported: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  cancelled: "bg-muted text-muted-foreground",
};


const fmtShort = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const inRange = (d: Date, from: Date, to: Date) => {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return day >= new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime() && day <= new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
};

const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<PurchaseOrderStatus[]>([]);
  const [appliedStatus, setAppliedStatus] = useState<PurchaseOrderStatus[]>([]);
  const [appliedRange, setAppliedRange] = useState<{ from: Date; to: Date; label: string } | null>(null);

  const [pickDateOpen, setPickDateOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);

  const activeFilterCount = appliedStatus.length + (appliedRange ? 1 : 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return purchaseOrders
      .filter((o) => {
        if (q && !o.id.toLowerCase().includes(q)) return false;
        if (appliedStatus.length && !appliedStatus.includes(o.status)) return false;
        if (appliedRange && !inRange(o.dateObj, appliedRange.from, appliedRange.to)) return false;
        return true;
      })
      .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
  }, [search, appliedStatus, appliedRange]);

  const openFilter = () => {
    setDraftStatus(appliedStatus);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setAppliedStatus(draftStatus);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setDraftStatus([]);
    setAppliedStatus([]);
    setAppliedRange(null);
    setFilterOpen(false);
  };

  const openPickDate = () => {
    setDraftRange(appliedRange ? { from: appliedRange.from, to: appliedRange.to } : undefined);
    setFilterOpen(false);
    setPickDateOpen(true);
  };

  const applyPickDate = () => {
    if (draftRange?.from) {
      const to = draftRange.to ?? draftRange.from;
      setAppliedRange({ from: draftRange.from, to, label: `${fmtShort(draftRange.from)} - ${fmtShort(to)}` });
    }
    setPickDateOpen(false);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-24">
      <AppHeader title={t("purchaseOrders.title")} showBack />

      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("purchaseOrders.searchPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
          </div>
          <button
            type="button"
            onClick={openFilter}
            aria-label={t("purchaseOrders.filter.title")}
            className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </button>
        </div>

        {(appliedStatus.length > 0 || appliedRange) && (
          <div className="flex items-center gap-2 flex-wrap">
            {appliedStatus.map((st) => (
              <span key={st} className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {t(`purchaseOrders.status.${st}`)}
                <button type="button" onClick={() => setAppliedStatus(appliedStatus.filter((x) => x !== st))} aria-label={t("purchaseOrders.removeFilter")} className="w-4 h-4 rounded-full flex items-center justify-center">
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
            {appliedRange && (
              <span className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {appliedRange.label}
                <button type="button" onClick={() => setAppliedRange(null)} aria-label={t("purchaseOrders.removeFilter")} className="w-4 h-4 rounded-full flex items-center justify-center">
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("purchaseOrders.noOrders")}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => navigate(`/purchase-orders/${o.id}`)}
                className="w-full text-start bg-card rounded-2xl border-s-[3px] border-s-primary border border-border/60 p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-bold text-foreground">{o.id}</p>
                  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0", STATUS_STYLE[o.status])}>{t(`purchaseOrders.status.${o.status}`)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {o.date}
                </div>
                <FitChips
                  chips={o.lines.map((l) => ({ key: l.productId, label: t(`purchaseOrders.product.${PURCHASE_ORDER_PRODUCTS.find((p) => p.id === l.productId)?.nameKey}`) }))}
                  moreLabel={(n) => `+${n} ${t("purchaseOrders.moreItems")}`}
                />

              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/purchase-orders/new")}
        className="fixed bottom-6 end-6 z-40 h-12 ps-4 pe-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-primary/30"
      >
        <Plus className="w-4 h-4" /> {t("purchaseOrders.newOrder")}
      </button>

      {/* ---------- Filter drawer ---------- */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-hidden">
          <button onClick={() => setFilterOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("purchaseOrders.filter.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("purchaseOrders.filter.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-5 flex-1 min-h-0 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("purchaseOrders.filter.orderStatus")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraftStatus([])}
                  className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", draftStatus.length === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >
                  {t("purchaseOrders.filter.all")}
                </button>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraftStatus(draftStatus.includes(s) ? draftStatus.filter((x) => x !== s) : [...draftStatus, s])}
                    className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", draftStatus.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    {t(`purchaseOrders.status.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("purchaseOrders.filter.dateDuration")}</p>
              <button
                type="button"
                onClick={openPickDate}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 flex items-center justify-between text-sm text-start"
              >
                <span className={appliedRange ? "text-foreground font-medium" : "text-muted-foreground"}>{appliedRange ? appliedRange.label : t("purchaseOrders.filter.selectDate")}</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="shrink-0 px-4 pt-3 pb-6 space-y-3 border-t border-border/60">
            <button type="button" onClick={applyFilter} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {t("purchaseOrders.filter.apply")}
            </button>
            <button type="button" onClick={clearFilter} className="w-full text-center text-sm font-medium text-muted-foreground">
              {t("purchaseOrders.filter.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Pick a date drawer — full-width calendar, same as Orders History's ---------- */}
      <Drawer open={pickDateOpen} onOpenChange={(o) => { setPickDateOpen(o); if (!o) setFilterOpen(true); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-hidden">
          <button onClick={() => setPickDateOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("purchaseOrders.pickDate.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("purchaseOrders.pickDate.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={1}
              defaultMonth={new Date(2026, 7, 31)}
              className="w-full p-0"
              classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground flex-1 font-normal text-[0.8rem]",
                row: "flex w-full mt-1",
                cell: "flex-1 text-center text-sm p-0 relative",
                day: "h-10 w-10 mx-auto p-0 font-normal rounded-full aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
              }}
            />
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40">
                <span className="text-[11px] text-muted-foreground">{t("purchaseOrders.pickDate.dateFrom")}</span>
                <span className="text-xs font-semibold text-foreground">{draftRange?.from ? fmtShort(draftRange.from) : "—"}</span>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <span className="text-[11px] text-muted-foreground">{t("purchaseOrders.pickDate.dateTo")}</span>
                <span className="text-xs font-semibold text-foreground">{draftRange?.to ? fmtShort(draftRange.to) : "—"}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 px-4 pt-3 pb-6 space-y-3 border-t border-border/60">
            <button type="button" disabled={!draftRange?.from} onClick={applyPickDate} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {t("purchaseOrders.pickDate.apply")}
            </button>
            <button type="button" onClick={() => setDraftRange(undefined)} className="w-full text-center text-sm font-medium text-muted-foreground">
              {t("purchaseOrders.pickDate.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PurchaseOrders;
