import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Boxes, Check, ChevronRight, Eye, FileText, Image as ImageIcon, Info, MapPin, Minus, Plus, Search, SlidersHorizontal, Trash2, UploadCloud, User, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import TagChips from "@/components/TagChips";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { DEMO_DESTINATIONS, PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/purchaseOrdersStore";
import {
  chainOrders, getChainOrder, saveChainOrder, statusLabelKey, updateChainOrder, visibleTo,
  type ChainLine, type ChainOrder, type ChainRole,
} from "@/data/stockChainStore";
import { cn } from "@/lib/utils";

// Request/Push Stock "Option 2": Team Leader → Regional Manager → Sales Support. One page serves
// all three roles (?role=tl|rm|ss); list → view → form is a local stack so Back steps up one level.

const BADGE: Record<string, string> = {
  pendingApproval: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  orderPending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  orderPlaced: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  delivered: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  completed: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  rejected: "bg-rose-100 text-primary dark:bg-rose-500/15",
  cancelled: "bg-muted text-muted-foreground",
};

const FILTERS: Record<ChainRole, string[]> = {
  tl: ["pendingApproval", "approved", "rejected", "cancelled"],
  rm: ["pendingApproval", "approved", "orderPlaced", "delivered", "rejected"],
  ss: ["orderPending", "orderPlaced", "completed", "rejected"],
};

type Screen = { k: "view"; id: string } | { k: "form"; id?: string };

const Badge = ({ role, o }: { role: ChainRole; o: ChainOrder }) => {
  const { t } = useTranslation();
  const key = statusLabelKey(role, o);
  return <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0", BADGE[key])}>{t(`stockOpt2.status.${key}`)}</span>;
};

const productName = (t: (k: string) => string, id: ProductId) => t(`purchaseOrders.product.${id}`);

// Confirmation bottom sheet shared by approve / reject / confirm / cancel / submit.
const ConfirmSheet = ({ open, onClose, heading, text, confirmLabel, disabled, onConfirm, children }: {
  open: boolean; onClose: () => void; heading: string; text: string; confirmLabel: string; disabled?: boolean; onConfirm: () => void; children?: React.ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2">
        <DrawerTitle className="text-base font-semibold text-foreground text-center pb-4">{t("stockOpt2.confirmationMessage")}</DrawerTitle>
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl border-2 border-blue-500 text-blue-500 flex items-center justify-center"><Info className="w-6 h-6" /></div>
          <p className="mt-3 text-sm font-semibold text-blue-600">{heading}</p>
          <DrawerDescription className="text-xs text-muted-foreground mt-1">{text}</DrawerDescription>
        </div>
        {children}
        <Button disabled={disabled} onClick={onConfirm} className="w-full h-12 rounded-full mt-5">{confirmLabel}</Button>
        <button type="button" onClick={onClose} className="w-full py-3 text-sm font-semibold text-primary">{t("stockOpt2.cancel")}</button>
      </DrawerContent>
    </Drawer>
  );
};

// ------------------------------------------------------------------ list

const List = ({ role, onOpen, onNew }: { role: ChainRole; onOpen: (id: string) => void; onNew: () => void }) => {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const rows = chainOrders.filter((o) => visibleTo(role, o)
    && (statuses.length === 0 || statuses.includes(statusLabelKey(role, o)))
    && (!q || o.id.includes(q)));
  const person = role === "tl" ? null : t(role === "rm" ? "stockOpt2.teamLeaderName" : "stockOpt2.regionalManagerName");

  return (
    <div className="space-y-3 pb-24">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("stockOpt2.search")} className="h-12 bg-card rounded-xl pe-10 border-0 shadow-sm" />
          <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <button type="button" aria-label={t("stockOpt2.filter")} onClick={() => { setDraft(statuses); setSheet(true); }} className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
        </button>
      </div>
      {statuses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button key={s} type="button" onClick={() => setStatuses((x) => x.filter((y) => y !== s))} className="px-3 py-1 rounded-full text-xs font-medium border border-primary/30 text-primary flex items-center gap-1">
              {t(`stockOpt2.status.${s}`)} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
      {rows.length === 0 && <p className="py-16 text-center text-sm text-muted-foreground">{t("stockOpt2.noOrders")}</p>}
      {rows.map((o) => (
        <button key={o.id} type="button" onClick={() => onOpen(o.id)} className="w-full text-start rounded-xl bg-card shadow-sm border-s-[3px] border-primary px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-foreground">{o.id}</p><Badge role={role} o={o} /></div>
          <p className="text-xs text-muted-foreground">{o.date}</p>
          {person && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> {person}</p>}
          <TagChips chips={o.lines.map((l) => ({ key: l.productId, label: productName(t, l.productId) }))} moreLabel={(n) => t("stockOpt2.more", { count: n })} />
        </button>
      ))}
      {role === "tl" && (
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] px-4 pb-6 pointer-events-none flex justify-end">
          <button type="button" onClick={onNew} className="pointer-events-auto h-12 px-5 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> {t("stockOpt2.newOrder")}</button>
        </div>
      )}

      <Drawer open={sheet} onOpenChange={setSheet}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2">
          <div className="flex items-center justify-between pb-1">
            <DrawerTitle className="text-lg font-bold text-foreground">{t("stockOpt2.filter")}</DrawerTitle>
            <button type="button" onClick={() => setSheet(false)} aria-label={t("settings.close")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
          <DrawerDescription className="text-xs text-muted-foreground mb-3">{t("stockOpt2.filterHint")}</DrawerDescription>
          <p className="text-sm font-semibold text-foreground mb-2">{t("stockOpt2.orderStatus")}</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {FILTERS[role].map((s) => (
              <button key={s} type="button" onClick={() => setDraft((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]))}
                className={cn("px-4 py-1.5 rounded-full text-xs font-medium border-[0.5px]", draft.includes(s) ? "bg-primary/10 border-primary/20 text-primary" : "bg-card border-border text-muted-foreground")}>
                {t(`stockOpt2.status.${s}`)}
              </button>
            ))}
          </div>
          <Button onClick={() => { setStatuses(draft); setSheet(false); }} className="w-full h-12 rounded-full">{t("stockOpt2.apply")}</Button>
          <button type="button" onClick={() => { setStatuses([]); setSheet(false); }} className="w-full py-3 text-sm font-semibold text-primary">{t("stockOpt2.clearFilter")}</button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// ------------------------------------------------------------------ create / edit (Team Leader)

const Form = ({ id, onDone }: { id?: string; onDone: () => void }) => {
  const { t } = useTranslation();
  const existing = id ? getChainOrder(id) : undefined;
  const [location, setLocation] = useState(existing?.location ?? "");
  const [qtys, setQtys] = useState<Record<string, number>>(() => Object.fromEntries((existing?.lines ?? []).map((l) => [l.productId, l.qty])));
  const [pick, setPick] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sent, setSent] = useState(false);
  const total = Object.values(qtys).reduce((a, b) => a + b, 0);
  const setQty = (pid: string, n: number, max: number) => setQtys((q) => ({ ...q, [pid]: Math.max(0, Math.min(n, max)) }));

  const submit = () => {
    const ls: ChainLine[] = Object.entries(qtys).filter(([, n]) => n > 0).map(([productId, qty]) => ({ productId: productId as ProductId, qty }));
    saveChainOrder(location, ls, id);
    setConfirm(false);
    setSent(true);
    setTimeout(onDone, 1400);
  };

  return (
    <div className="space-y-3 pb-24">
      <button type="button" onClick={() => setPick(true)} className="w-full text-start rounded-xl bg-card shadow-sm px-4 py-3 flex items-center justify-between">
        <div><p className="text-[11px] text-muted-foreground">{t("stockOpt2.location")}</p><p className={cn("text-sm", location ? "font-semibold text-foreground" : "text-muted-foreground")}>{location || t("stockOpt2.selectLocation")}</p></div>
        <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
      </button>
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
      <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] px-4 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <Button disabled={!location || total === 0} onClick={() => setConfirm(true)} className="w-full h-12 rounded-full text-base">{t(id ? "stockOpt2.save" : "stockOpt2.submitOrder")}</Button>
      </div>

      <Drawer open={pick} onOpenChange={setPick}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[80vh]">
          <DrawerTitle className="text-lg font-semibold text-foreground text-center pb-3">{t("stockOpt2.location")}</DrawerTitle>
          <DrawerDescription className="sr-only">{t("stockOpt2.selectLocation")}</DrawerDescription>
          <div className="space-y-2 overflow-y-auto">
            {DEMO_DESTINATIONS.map((d) => (
              <button key={d} type="button" onClick={() => { setLocation(d); setPick(false); }}
                className={cn("w-full text-start flex items-center gap-3 rounded-xl px-3 py-3 border", location === d ? "bg-primary/10 border-primary/20" : "bg-muted/40 border-border/60")}>
                <MapPin className="w-4 h-4 text-primary" /><span className="text-sm text-foreground">{d}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
      <ConfirmSheet open={confirm} onClose={() => setConfirm(false)} heading={t("stockOpt2.submitRequest")} text={t("stockOpt2.submitQ")} confirmLabel={t("stockOpt2.submit")} onConfirm={submit} />
      <Drawer open={sent} onOpenChange={() => {}}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-4 text-center">
          <DrawerTitle className="sr-only">{t("stockOpt2.submitRequest")}</DrawerTitle>
          <DrawerDescription className="sr-only">{t("stockOpt2.submitted")}</DrawerDescription>
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-6 h-6" /></div>
          <p className="mt-3 text-sm font-semibold text-emerald-600">{t("stockOpt2.submitRequest")}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("stockOpt2.submitted")}</p>
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
  const [reason, setReason] = useState("");
  const [remark, setRemark] = useState("");
  const [tracking, setTracking] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canUpload = role === "rm" && o.status === "pendingApproval";
  const showProof = o.proofs.length > 0 || canUpload;
  const trackingId = o.trackingId;
  const requester = role === "tl" ? null : t(role === "rm" ? "stockOpt2.teamLeaderName" : "stockOpt2.regionalManagerName");
  const close = () => { setAction(null); setReason(""); setRemark(""); };

  const run = () => {
    const rejectedBy = role === "ss" ? "ss" : "rm";
    const patch: Record<Action, Partial<ChainOrder>> = {
      approve: { status: "orderPending" },
      confirm: { status: "orderPlaced" },
      submit: { status: "delivered", trackingId: tracking.trim() },
      cancel: { status: "cancelled", reason: remark || reason },
      reject: { status: "rejected", rejectedBy, reason: remark || reason },
    };
    updateChainOrder(id, patch[action!]);
    close();
    onChanged();
  };

  const rejectFields = (
    <div className="mt-4 space-y-3 text-start">
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">{t(action === "cancel" ? "stockOpt2.cancelReason" : "stockOpt2.rejectReason")}</p>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground">
          <option value="">{t("stockOpt2.selectReason")}</option>
          {["r1", "r2", "r3", "r4"].map((r) => <option key={r} value={t(`stockOpt2.reasons.${r}`)}>{t(`stockOpt2.reasons.${r}`)}</option>)}
        </select>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">{t(action === "cancel" ? "stockOpt2.cancelRemark" : "stockOpt2.rejectRemark")}</p>
        <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={t("stockOpt2.writeHere")} className="rounded-xl min-h-[80px]" />
      </div>
    </div>
  );
  const sheet: Record<Action, { heading: string; text: string; confirm: string }> = {
    approve: { heading: t("stockOpt2.approveRequest"), text: t("stockOpt2.approveQ"), confirm: t("stockOpt2.submit") },
    confirm: { heading: t("stockOpt2.confirmRequest"), text: t("stockOpt2.confirmQ"), confirm: t("stockOpt2.confirm") },
    reject: { heading: t("stockOpt2.rejectRequest"), text: t("stockOpt2.rejectQ"), confirm: t("stockOpt2.submit") },
    cancel: { heading: t("stockOpt2.cancelRequest"), text: t("stockOpt2.cancelQ"), confirm: t("stockOpt2.submit") },
    submit: { heading: t("stockOpt2.deliverRequest"), text: t("stockOpt2.deliverQ"), confirm: t("stockOpt2.submit") },
  };

  const primary = (label: string, a: Action, disabled?: boolean) => <Button disabled={disabled} onClick={() => setAction(a)} className="w-full h-12 rounded-full text-base">{label}</Button>;
  const link = (label: string, a: Action) => <button type="button" onClick={() => setAction(a)} className="w-full py-3 text-sm font-semibold text-primary">{label}</button>;

  return (
    <div className="space-y-3 pb-8">
      <div className="rounded-2xl bg-card shadow-sm p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{t("stockOpt2.orderId")} <span className="text-muted-foreground font-normal">{o.id}</span></p>
          <Badge role={role} o={o} />
        </div>
        {(o.status === "rejected" || o.status === "cancelled") && o.reason && (
          <div className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 px-3 py-2">
            <p className="text-[11px] font-semibold text-primary">{t(o.status === "cancelled" ? "stockOpt2.cancelReason" : "stockOpt2.rejectReason")}</p>
            <p className="text-[11px] text-foreground/80 mt-0.5">{o.reason}</p>
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
                  <Eye className="w-4 h-4 text-blue-500" />
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

      {(trackingId || (role === "rm" && o.status === "orderPlaced")) && (
        <>
          <p className="text-sm font-semibold text-foreground pt-2 px-1">{t("stockOpt2.trackingId")}</p>
          {trackingId
            ? <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground tabular-nums">{trackingId}</div>
            : <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder={t("stockOpt2.enterTracking")} className="h-12 rounded-xl bg-card" />}
        </>
      )}

      <div className="pt-3">
        {role === "rm" && o.status === "pendingApproval" && <>{primary(t("stockOpt2.approve"), "approve", o.proofs.length === 0)}{link(t("stockOpt2.reject"), "reject")}</>}
        {role === "ss" && o.status === "orderPending" && <>{primary(t("stockOpt2.confirm"), "confirm")}{link(t("stockOpt2.reject"), "reject")}</>}
        {role === "rm" && o.status === "orderPlaced" && primary(t("stockOpt2.submit"), "submit", !tracking.trim())}
        {role === "tl" && o.status === "pendingApproval" && <><Button onClick={onEdit} className="w-full h-12 rounded-full text-base">{t("stockOpt2.edit")}</Button>{link(t("stockOpt2.cancelOrder"), "cancel")}</>}
      </div>

      <ConfirmSheet open={action !== null} onClose={close} heading={action ? sheet[action].heading : ""} text={action ? sheet[action].text : ""}
        confirmLabel={action ? sheet[action].confirm : ""} disabled={(action === "reject" || action === "cancel") && !reason} onConfirm={run}>
        {(action === "reject" || action === "cancel") && rejectFields}
      </ConfirmSheet>
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
