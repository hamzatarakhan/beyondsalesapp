import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import { Boxes, Check, ChevronRight, Clock, Eye, FileText, Image as ImageIcon, MapPin, Minus, Plus, Search, SlidersHorizontal, Trash2, UploadCloud, User, X as XIcon } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import TagChips from "@/components/TagChips";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { DEMO_DESTINATIONS, PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/purchaseOrdersStore";
import {
  chainOrders, getChainOrder, saveChainOrder, statusLabelKey, updateChainOrder, visibleTo,
  type ChainLine, type ChainOrder, type ChainRole,
} from "@/data/stockChainStore";
import { cn } from "@/lib/utils";

// Request/Push Stock "Option 2": Team Leader → Regional Manager → Sales Support. One page serves
// all three roles (?role=tl|rm|ss); list → view → form is a local stack so Back steps up one level.
// Filter, confirm, success and picker sheets reuse the Request Stock (purchaseOrders.*) patterns.

const BADGE: Record<string, string> = {
  pendingApproval: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  orderPending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  orderPlaced: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  delivered: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  completed: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const FILTERS: Record<ChainRole, string[]> = {
  tl: ["pendingApproval", "approved", "rejected", "cancelled"],
  rm: ["pendingApproval", "approved", "orderPlaced", "delivered", "rejected"],
  ss: ["orderPending", "orderPlaced", "completed", "rejected"],
};
const REASON_OPTIONS = ["budget", "incorrectItems", "duplicateRequest", "pricingNotApproved", "other"] as const;

const fmtShort = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
const dayMs = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const inRange = (d: Date, from: Date, to: Date) => dayMs(d) >= dayMs(from) && dayMs(d) <= dayMs(to);

type Screen = { k: "view"; id: string } | { k: "form"; id?: string };

const Badge = ({ role, o }: { role: ChainRole; o: ChainOrder }) => {
  const { t } = useTranslation();
  const key = statusLabelKey(role, o);
  return <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0", BADGE[key])}>{t(`stockOpt2.status.${key}`)}</span>;
};

const productName = (t: (k: string) => string, id: ProductId) => t(`purchaseOrders.product.${id}`);

const CloseButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
      <XIcon className="w-4 h-4 text-foreground" />
    </button>
  );
};

// ------------------------------------------------------------------ list

const List = ({ role, onOpen, onNew }: { role: ChainRole; onOpen: (id: string) => void; onNew: () => void }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<string[]>([]);
  const [appliedStatus, setAppliedStatus] = useState<string[]>([]);
  const [appliedRange, setAppliedRange] = useState<{ from: Date; to: Date; label: string } | null>(null);
  const [pickDateOpen, setPickDateOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return chainOrders.filter((o) => visibleTo(role, o)
      && (!q || o.id.toLowerCase().includes(q))
      && (appliedStatus.length === 0 || appliedStatus.includes(statusLabelKey(role, o)))
      && (!appliedRange || inRange(o.dateObj, appliedRange.from, appliedRange.to)));
  }, [role, search, appliedStatus, appliedRange]);
  const person = role === "tl" ? null : t(role === "rm" ? "stockOpt2.teamLeaderName" : "stockOpt2.regionalManagerName");

  const openFilter = () => { setDraftStatus(appliedStatus); setFilterOpen(true); };
  const applyFilter = () => { setAppliedStatus(draftStatus); setFilterOpen(false); };
  const clearFilter = () => { setDraftStatus([]); setAppliedStatus([]); setAppliedRange(null); setFilterOpen(false); };
  const openPickDate = () => { setDraftRange(appliedRange ? { from: appliedRange.from, to: appliedRange.to } : undefined); setFilterOpen(false); setPickDateOpen(true); };
  const applyPickDate = () => {
    if (draftRange?.from) {
      const to = draftRange.to ?? draftRange.from;
      setAppliedRange({ from: draftRange.from, to, label: `${fmtShort(draftRange.from)} - ${fmtShort(to)}` });
    }
    setPickDateOpen(false);
  };
  const chip = "inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium";

  return (
    <div className="space-y-3 pb-24">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("purchaseOrders.searchPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
        </div>
        <button type="button" onClick={openFilter} aria-label={t("purchaseOrders.filter.title")} className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
        </button>
      </div>

      {(appliedStatus.length > 0 || appliedRange) && (
        <div className="flex items-center gap-2 flex-wrap">
          {appliedStatus.map((st) => (
            <span key={st} className={chip}>
              {t(`stockOpt2.status.${st}`)}
              <button type="button" onClick={() => setAppliedStatus(appliedStatus.filter((x) => x !== st))} aria-label={t("purchaseOrders.removeFilter")} className="w-4 h-4 rounded-full flex items-center justify-center"><XIcon className="w-3 h-3" /></button>
            </span>
          ))}
          {appliedRange && (
            <span className={chip}>
              {appliedRange.label}
              <button type="button" onClick={() => setAppliedRange(null)} aria-label={t("purchaseOrders.removeFilter")} className="w-4 h-4 rounded-full flex items-center justify-center"><XIcon className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{t("purchaseOrders.noOrders")}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <button key={o.id} type="button" onClick={() => onOpen(o.id)} className="w-full text-start bg-card rounded-2xl border-s-[3px] border-s-primary border border-border/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2"><p className="text-base font-bold text-foreground">{o.id}</p><Badge role={role} o={o} /></div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="w-3.5 h-3.5 shrink-0" />{o.date}</div>
              {person && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="w-3.5 h-3.5 shrink-0" />{person}</div>}
              <TagChips chips={o.lines.map((l) => ({ key: l.productId, label: productName(t, l.productId) }))} moreLabel={(n) => `+${n} ${t("purchaseOrders.moreItems")}`} />
            </button>
          ))}
        </div>
      )}

      {role === "tl" && (
        <button type="button" onClick={onNew} className="fixed bottom-6 end-6 z-40 h-12 ps-4 pe-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {t("stockOpt2.newOrder")}
        </button>
      )}

      {/* ---------- Filter drawer ---------- */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-hidden">
          <CloseButton onClick={() => setFilterOpen(false)} />
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("purchaseOrders.filter.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("purchaseOrders.filter.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-5 flex-1 min-h-0 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("purchaseOrders.filter.orderStatus")}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setDraftStatus([])}
                  className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", draftStatus.length === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {t("purchaseOrders.filter.all")}
                </button>
                {FILTERS[role].map((s) => (
                  <button key={s} type="button" onClick={() => setDraftStatus(draftStatus.includes(s) ? draftStatus.filter((x) => x !== s) : [...draftStatus, s])}
                    className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", draftStatus.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {t(`stockOpt2.status.${s}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("purchaseOrders.filter.dateDuration")}</p>
              <button type="button" onClick={openPickDate} className="w-full h-11 rounded-xl border border-border bg-background px-3.5 flex items-center justify-between text-sm text-start">
                <span className={appliedRange ? "text-foreground font-medium" : "text-muted-foreground"}>{appliedRange ? appliedRange.label : t("purchaseOrders.filter.selectDate")}</span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div className="shrink-0 px-4 pt-3 pb-6 space-y-3 border-t border-border/60">
            <button type="button" onClick={applyFilter} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">{t("purchaseOrders.filter.apply")}</button>
            <button type="button" onClick={clearFilter} className="w-full text-center text-sm font-medium text-muted-foreground">{t("purchaseOrders.filter.clear")}</button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Pick a date drawer ---------- */}
      <Drawer open={pickDateOpen} onOpenChange={(o) => { setPickDateOpen(o); if (!o) setFilterOpen(true); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-hidden">
          <CloseButton onClick={() => setPickDateOpen(false)} />
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("purchaseOrders.pickDate.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("purchaseOrders.pickDate.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
            <Calendar mode="range" selected={draftRange} onSelect={setDraftRange} numberOfMonths={1} defaultMonth={new Date(2026, 9, 15)} className="w-full p-0"
              classNames={{
                months: "w-full", month: "w-full space-y-4", table: "w-full border-collapse", head_row: "flex w-full",
                head_cell: "text-muted-foreground flex-1 font-normal text-[0.8rem]", row: "flex w-full mt-1", cell: "flex-1 text-center text-sm p-0 relative",
                day: "h-10 w-10 mx-auto p-0 font-normal rounded-full aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
              }} />
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
            <button type="button" disabled={!draftRange?.from} onClick={applyPickDate} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">{t("purchaseOrders.pickDate.apply")}</button>
            <button type="button" onClick={() => setDraftRange(undefined)} className="w-full text-center text-sm font-medium text-muted-foreground">{t("purchaseOrders.pickDate.clear")}</button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ------------------------------------------------------------------ create / edit (Team Leader)

const Form = ({ id, onDone }: { id?: string; onDone: () => void }) => {
  const { t } = useTranslation();
  const existing = id ? getChainOrder(id) : undefined;
  const isEdit = !!existing;
  const [location, setLocation] = useState(existing?.location ?? "");
  const [qtys, setQtys] = useState<Record<string, number>>(() => Object.fromEntries((existing?.lines ?? []).map((l) => [l.productId, l.qty])));
  const [pick, setPick] = useState(false);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const setQty = (pid: string, n: number, max: number) => setQtys((q) => ({ ...q, [pid]: Math.max(0, Math.min(n, max)) }));
  const places = useMemo(() => DEMO_DESTINATIONS.filter((d) => d.toLowerCase().includes(search.trim().toLowerCase())), [search]);

  const submit = () => {
    const ls: ChainLine[] = Object.entries(qtys).filter(([, n]) => n > 0).map(([productId, qty]) => ({ productId: productId as ProductId, qty }));
    saveChainOrder(location, ls, id);
    setConfirm(false);
    setSuccess(true);
  };

  return (
    <div className="space-y-3 pb-28">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground px-1">{t("stockOpt2.location")}</p>
        <button type="button" onClick={() => setPick(true)} className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm">
          <span className={location ? "text-foreground font-medium" : "text-muted-foreground"}>{location || t("stockOpt2.selectLocation")}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>
      </div>
      {PURCHASE_ORDER_PRODUCTS.map((p) => {
        const Icon = PRODUCT_ICON[p.id];
        const qty = qtys[p.id] ?? 0;
        return (
          <div key={p.id} className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{productName(t, p.id)}</p>
                <p className="text-[11px] text-primary font-semibold flex items-center gap-1"><Boxes className="w-3 h-3" /> {t("purchaseOrders.availableStocks", { count: p.availableStocks })}</p>
              </div>
            </div>
            <div className="flex items-center h-11 rounded-full bg-card border border-border overflow-hidden">
              <button type="button" disabled={qty <= 0} onClick={() => setQty(p.id, qty - 1, p.availableStocks)} className="flex-1 h-full flex items-center justify-center text-primary bg-primary/10 disabled:opacity-40"><Minus className="w-4 h-4" /></button>
              <input type="text" inputMode="numeric" value={qty === 0 ? "" : String(qty)} placeholder="0" aria-label={productName(t, p.id)}
                onChange={(e) => setQty(p.id, parseInt(e.target.value.replace(/\D/g, "") || "0", 10), p.availableStocks)}
                className="flex-1 h-full bg-card text-center text-sm font-bold text-foreground outline-none" />
              <button type="button" disabled={qty >= p.availableStocks} onClick={() => setQty(p.id, qty + 1, p.availableStocks)} className="flex-1 h-full flex items-center justify-center text-primary bg-primary/10 disabled:opacity-40"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        );
      })}
      <div className="fixed bottom-0 start-0 end-0 z-40 bg-background border-t border-border px-4 py-3">
        <Button disabled={!location || total === 0} onClick={() => setConfirm(true)} className="w-full h-12 rounded-full text-base">{t(isEdit ? "purchaseOrders.save" : "stockOpt2.submitOrder")}</Button>
      </div>

      {/* ---------- Location picker ---------- */}
      <Drawer open={pick} onOpenChange={setPick}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <CloseButton onClick={() => setPick(false)} />
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("stockOpt2.location")}</DrawerTitle>
            <DrawerDescription className="sr-only">{t("stockOpt2.selectLocation")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("purchaseOrders.searchPlaceholder")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
            {places.map((d) => (
              <button key={d} type="button" onClick={() => { setLocation(d); setPick(false); }}
                className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl transition text-start", location === d ? "border-[0.5px] bg-primary/10 border-primary/20" : "bg-muted/50")}>
                <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" /></div>
                <span className="text-sm font-semibold text-foreground flex-1">{d}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmMessageDrawer open={confirm} onOpenChange={setConfirm} title={t(isEdit ? "purchaseOrders.saveRequestTitle" : "purchaseOrders.submitRequestTitle")}
        description={t(isEdit ? "purchaseOrders.saveRequestDesc" : "purchaseOrders.submitRequestDesc")} confirmLabel={t(isEdit ? "purchaseOrders.save" : "purchaseOrders.submit")}
        onConfirm={submit} cancelLabel={t("purchaseOrders.cancel")} />

      {/* ---------- Success ---------- */}
      <Drawer open={success} onOpenChange={(o) => { if (!o) { setSuccess(false); onDone(); } }}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-8 h-8 text-white" strokeWidth={3} /></div>
            </div>
            <DrawerTitle className="font-semibold text-foreground text-base mb-1 text-center">{t(isEdit ? "purchaseOrders.saveSuccessTitle" : "purchaseOrders.submitSuccessTitle")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground mt-2 text-center">{t(isEdit ? "purchaseOrders.saveSuccessDesc" : "purchaseOrders.submitSuccessDesc")}</DrawerDescription>
          </div>
          <button type="button" onClick={() => { setSuccess(false); onDone(); }} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">{t("purchaseOrders.done")}</button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ------------------------------------------------------------------ view order

type Action = "approve" | "reject" | "confirm" | "cancel" | "submit";

const View = ({ role, id, onEdit, onChanged }: { role: ChainRole; id: string; onEdit: () => void; onChanged: () => void }) => {
  const { t } = useTranslation();
  const o = getChainOrder(id)!;
  const [action, setAction] = useState<Action | null>(null);
  const [reasonKey, setReasonKey] = useState("");
  const [remark, setRemark] = useState("");
  const [tracking, setTracking] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canUpload = role === "rm" && o.status === "pendingApproval";
  const showProof = o.proofs.length > 0 || canUpload;
  const requester = role === "tl" ? null : t(role === "rm" ? "stockOpt2.teamLeaderName" : "stockOpt2.regionalManagerName");
  const needsReason = action === "reject" || action === "cancel";
  const hasActions = (role === "rm" && (o.status === "pendingApproval" || o.status === "orderPlaced")) || (role === "ss" && o.status === "orderPending") || (role === "tl" && o.status === "pendingApproval");

  const run = () => {
    const reason = needsReason ? t(`purchaseOrders.reason.${reasonKey || "other"}`) + (remark ? ` — ${remark}` : "") : undefined;
    const patch: Record<Action, Partial<ChainOrder>> = {
      approve: { status: "orderPending" },
      confirm: { status: "orderPlaced" },
      submit: { status: "delivered", trackingId: tracking.trim() },
      cancel: { status: "cancelled", reason },
      reject: { status: "rejected", rejectedBy: role === "ss" ? "ss" : "rm", reason },
    };
    updateChainOrder(id, patch[action!]);
    setAction(null); setReasonKey(""); setRemark("");
    onChanged();
  };

  const copy: Record<Action, { title: string; desc: string; confirm: string }> = {
    approve: { title: t("purchaseOrders.approveRequestTitle"), desc: t("purchaseOrders.approveRequestDesc"), confirm: t("purchaseOrders.approve") },
    reject: { title: t("purchaseOrders.rejectRequestTitle"), desc: t("purchaseOrders.rejectRequestDesc"), confirm: t("purchaseOrders.submit") },
    cancel: { title: t("purchaseOrders.cancelRequestTitle"), desc: t("purchaseOrders.cancelRequestDesc"), confirm: t("purchaseOrders.submit") },
    confirm: { title: t("stockOpt2.confirmRequest"), desc: t("stockOpt2.confirmQ"), confirm: t("stockOpt2.confirm") },
    submit: { title: t("stockOpt2.deliverRequest"), desc: t("stockOpt2.deliverQ"), confirm: t("purchaseOrders.submit") },
  };

  const primary = (label: string, a: Action, disabled?: boolean) => <Button disabled={disabled} onClick={() => setAction(a)} className="w-full h-12 rounded-full text-base">{label}</Button>;
  const link = (label: string, a: Action) => <button type="button" onClick={() => setAction(a)} className="w-full py-3 text-sm font-semibold text-primary">{label}</button>;

  return (
    <div className={cn("space-y-3", hasActions ? "pb-40" : "pb-8")}>
      <div className="rounded-2xl bg-card shadow-sm p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-bold text-foreground">{o.id}</p>
          <Badge role={role} o={o} />
        </div>
        {(o.status === "rejected" || o.status === "cancelled") && o.reason && (
          <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3 py-2">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{t(o.status === "cancelled" ? "purchaseOrders.cancelReason" : "purchaseOrders.rejectReason")}</p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{o.reason}</p>
          </div>
        )}
        <div className="mt-3 rounded-xl bg-muted/50 px-3 py-2.5 flex items-center gap-2.5">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <div><p className="text-[11px] text-muted-foreground">{t("stockOpt2.shippingTo")}</p><p className="text-sm font-semibold text-foreground">{o.location}</p></div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">{o.date}{requester && <> · <span className="text-primary">{requester}</span></>}</p>
      </div>

      {o.lines.map((l) => {
        const Icon = PRODUCT_ICON[l.productId];
        return (
          <div key={l.productId} className="rounded-2xl bg-card shadow-sm px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
            <div><p className="text-sm font-semibold text-foreground">{productName(t, l.productId)}</p><p className="text-[11px] text-muted-foreground">{t("stockOpt2.pcs", { count: l.qty })}</p></div>
          </div>
        );
      })}

      {showProof && (
        <>
          <p className="text-sm font-semibold text-foreground pt-2 px-1">{t("stockOpt2.paymentProof")}</p>
          <div className="rounded-2xl bg-card shadow-sm p-3 space-y-2">
            {o.proofs.map((f, i) => (
              <div key={f + i} className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-foreground">
                <span className="flex items-center gap-2 min-w-0">{/\.(png|jpe?g)$/i.test(f) ? <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" /> : <FileText className="w-4 h-4 text-muted-foreground shrink-0" />}<span className="truncate">{f}</span></span>
                <span className="flex items-center gap-3 shrink-0">
                  <Eye className="w-4 h-4 text-primary" />
                  {canUpload && <button type="button" aria-label={t("stockOpt2.remove")} onClick={() => { updateChainOrder(id, { proofs: o.proofs.filter((_, j) => j !== i) }); onChanged(); }}><Trash2 className="w-4 h-4 text-primary" /></button>}
                </span>
              </div>
            ))}
            {canUpload && (
              <>
                <button type="button" onClick={() => fileRef.current?.click()} className="w-full rounded-xl border border-dashed border-border py-6 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                  <UploadCloud className="w-5 h-5 text-primary" /> {t("stockOpt2.uploadFiles")}
                </button>
                <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden
                  onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name); if (names.length) { updateChainOrder(id, { proofs: [...o.proofs, ...names] }); onChanged(); } e.target.value = ""; }} />
              </>
            )}
          </div>
        </>
      )}

      {(o.trackingId || (role === "rm" && o.status === "orderPlaced")) && (
        <>
          <p className="text-sm font-semibold text-foreground pt-2 px-1">{t("stockOpt2.trackingId")}</p>
          {o.trackingId
            ? <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground tabular-nums">{o.trackingId}</div>
            : <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder={t("stockOpt2.enterTracking")} className="h-12 rounded-xl bg-card" />}
        </>
      )}

      {hasActions && (
        <div className="fixed bottom-0 start-0 end-0 z-40 bg-background border-t border-border px-4 py-3">
          {role === "rm" && o.status === "pendingApproval" && <>{primary(t("purchaseOrders.approve"), "approve", o.proofs.length === 0)}{link(t("stockOpt2.reject"), "reject")}</>}
          {role === "ss" && o.status === "orderPending" && <>{primary(t("stockOpt2.confirm"), "confirm")}{link(t("stockOpt2.reject"), "reject")}</>}
          {role === "rm" && o.status === "orderPlaced" && primary(t("purchaseOrders.submit"), "submit", !tracking.trim())}
          {role === "tl" && o.status === "pendingApproval" && <><Button onClick={onEdit} className="w-full h-12 rounded-full text-base">{t("purchaseOrders.edit")}</Button>{link(t("purchaseOrders.cancelOrder"), "cancel")}</>}
        </div>
      )}

      <ConfirmMessageDrawer
        open={!!action}
        onOpenChange={(open) => { if (!open) { setAction(null); setReasonKey(""); setRemark(""); } }}
        title={action ? copy[action].title : ""}
        description={action ? copy[action].desc : ""}
        confirmLabel={action ? copy[action].confirm : ""}
        onConfirm={run}
        confirmDisabled={needsReason && !reasonKey}
        cancelLabel={t("purchaseOrders.cancel")}
      >
        {needsReason && (
          <div className="space-y-3 text-start">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t(action === "cancel" ? "purchaseOrders.cancelReasonLabel" : "purchaseOrders.rejectReasonLabel")}</p>
              <Select value={reasonKey} onValueChange={setReasonKey}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={t("purchaseOrders.selectReason")} /></SelectTrigger>
                <SelectContent>{REASON_OPTIONS.map((r) => <SelectItem key={r} value={r}>{t(`purchaseOrders.reason.${r}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t(action === "cancel" ? "purchaseOrders.cancelRemarkLabel" : "purchaseOrders.rejectRemarkLabel")}</p>
              <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={t("purchaseOrders.writeHere")} className="rounded-xl min-h-[90px]" />
            </div>
          </div>
        )}
      </ConfirmMessageDrawer>
    </div>
  );
};

// ------------------------------------------------------------------ page

const StockOption2 = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const r = params.get("role");
  const role: ChainRole = r === "rm" || r === "ss" ? r : "tl";
  const [screen, setScreen] = useState<Screen | null>(null);
  const [, bump] = useState(0);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const title = screen?.k === "form" ? t(screen.id ? "stockOpt2.editOrder" : "stockOpt2.createOrder") : screen ? t("stockOpt2.viewOrder") : t(role === "tl" ? "stockOpt2.requestStock" : "stockOpt2.pushStock");
  const back = () => (screen?.k === "form" && screen.id ? setScreen({ k: "view", id: screen.id }) : screen ? setScreen(null) : navigate("/"));

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={title} showBack onBackClick={back} />
      <div className="px-4">
        {!screen && <List role={role} onOpen={(id) => setScreen({ k: "view", id })} onNew={() => setScreen({ k: "form" })} />}
        {screen?.k === "view" && <View key={screen.id} role={role} id={screen.id} onEdit={() => setScreen({ k: "form", id: screen.id })} onChanged={() => bump((n) => n + 1)} />}
        {screen?.k === "form" && <Form id={screen.id} onDone={() => setScreen(null)} />}
      </div>
    </div>
  );
};

export default StockOption2;
