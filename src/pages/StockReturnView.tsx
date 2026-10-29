import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Package, Eye, Info, X as XIcon } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, getStockReturn, updateStockReturn, type StockReturnStatus } from "@/data/stockReturnStore";
import { getStockReturnScenario } from "@/data/stockReturnScenarios";

const REJECT_REASONS = ["serialMismatch", "notReturnable", "missingItems", "damageNotCovered", "duplicateRequest", "other"] as const;

const STATUS_STYLE: Record<StockReturnStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

// View Order for one Stock Return. A Team Leader opening a pending return from their Task tab
// (a dealer's return) gets Approve / Reject; everything else is read-only. Same layout and
// confirm pattern as Request Stock's View Order.
const StockReturnView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [scenario] = useState(getStockReturnScenario);
  const order = id ? getStockReturn(id) : undefined;
  const backTo = `/stock-returns${params.get("tab") === "task" ? "?tab=task" : ""}`;

  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);
  const [rejectReasonKey, setRejectReasonKey] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");
  const [serialsOf, setSerialsOf] = useState<string | null>(null);

  if (!order) {
    return (
      <div className="mobile-container min-h-screen bg-background">
        <AppHeader title={t("stockReturn.viewOrderTitle")} showBack onBackClick={() => navigate(backTo)} />
        <p className="py-16 text-center text-sm text-muted-foreground">{t("stockReturn.noReturns")}</p>
      </div>
    );
  }

  const canReview = order.kind === "task" && scenario.role === "teamLeader" && order.status === "pending";
  const productName = (productId: string) => t(`purchaseOrders.product.${PURCHASE_ORDER_PRODUCTS.find((p) => p.id === productId)?.nameKey}`);

  const resolve = () => {
    if (confirm === "approve") updateStockReturn(order.id, { status: "approved" });
    if (confirm === "reject") {
      if (!rejectReasonKey) return;
      const reason = t(`stockReturn.rejectReasons.${rejectReasonKey}`);
      updateStockReturn(order.id, { status: "rejected", rejectReason: rejectRemark.trim() ? `${reason} — ${rejectRemark.trim()}` : reason });
    }
    setConfirm(null);
    navigate(backTo);
  };

  return (
    <div className={cn("mobile-container min-h-screen bg-background", canReview ? "pb-40" : "pb-8")}>
      <AppHeader title={t("stockReturn.viewOrderTitle")} showBack onBackClick={() => navigate(backTo)} />

      <div className="px-4 space-y-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">{order.id}</p>
            </div>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[order.status])}>{t(`stockReturn.status.${order.status}`)}</span>
          </div>

          {order.status === "rejected" && order.rejectReason && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-3.5">
              <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{t("stockReturn.rejectReason")}</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{order.rejectReason}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
            <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">{t("stockReturn.shippingFrom")}</p>
              <p className="text-sm font-semibold text-foreground truncate">{order.location ?? scenario.locations[0]}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {order.date} · <span className="font-semibold text-primary">{order.channelMember ?? scenario.user.name}</span>
          </p>
        </div>

        {order.lines.map((l) => {
          const Icon = PRODUCT_ICON[l.productId];
          return (
            <div key={l.productId} className="bg-card rounded-2xl border border-border/60 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{productName(l.productId)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Package className="w-3.5 h-3.5" /> {t("stockReturn.returnQuantity", { count: l.qty })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSerialsOf(l.productId)}
                  aria-label={t("stockReturn.viewSerialsAria", { product: productName(l.productId) })}
                  className="w-8 h-8 rounded-lg border border-primary/30 flex items-center justify-center text-primary shrink-0"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="border-t border-border/60 pt-3 space-y-0.5">
                <p className="text-[11px] font-semibold text-primary">{t("stockReturn.reasonForReturnLabel")}</p>
                <p className="text-xs font-bold text-foreground">{l.reason in RETURN_REASON_KEYS ? t(`stockReturn.reasons.${l.reason}`) : l.reason}</p>
                {l.remark && <p className="text-xs text-muted-foreground">{l.remark}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {canReview && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3 space-y-3">
          <button type="button" onClick={() => setConfirm("approve")} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("stockReturn.approve")}
          </button>
          <button type="button" onClick={() => { setRejectReasonKey(""); setRejectRemark(""); setConfirm("reject"); }} className="w-full text-center text-sm font-semibold text-primary">
            {t("stockReturn.reject")}
          </button>
        </div>
      )}

      <ConfirmMessageDrawer
        open={!!confirm}
        onOpenChange={(o) => { if (!o) setConfirm(null); }}
        title={t(confirm === "reject" ? "stockReturn.rejectTitle" : "stockReturn.approveTitle")}
        description={t(confirm === "reject" ? "stockReturn.rejectDesc" : "stockReturn.approveDesc", { member: order.channelMember ?? "" })}
        confirmLabel={t(confirm === "reject" ? "stockReturn.reject" : "stockReturn.approve")}
        onConfirm={resolve}
        // A rejection needs a reason picked; the remark below it stays optional.
        confirmDisabled={confirm === "reject" && !rejectReasonKey}
        cancelLabel={t("purchaseOrders.cancel")}
      >
        {confirm === "reject" && (
          <div className="space-y-3 text-start">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {t("stockReturn.rejectReasonLabel")} <span className="text-destructive">*</span>
              </p>
              <Select value={rejectReasonKey} onValueChange={setRejectReasonKey}>
                <SelectTrigger className="h-11 rounded-xl" aria-required>
                  <SelectValue placeholder={t("stockReturn.selectRejectReason")} />
                </SelectTrigger>
                <SelectContent>
                  {REJECT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{t(`stockReturn.rejectReasons.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("stockReturn.rejectRemarkLabel")}</p>
              <Textarea value={rejectRemark} onChange={(e) => setRejectRemark(e.target.value)} placeholder={t("purchaseOrders.writeHere")} className="rounded-xl min-h-[90px]" />
            </div>
          </div>
        )}
      </ConfirmMessageDrawer>

      <Drawer open={!!serialsOf} onOpenChange={(o) => { if (!o) setSerialsOf(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <button onClick={() => setSerialsOf(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{serialsOf ? productName(serialsOf) : ""}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            {(order.lines.find((l) => l.productId === serialsOf)?.serials ?? []).map((s) => (
              <div key={s} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm font-mono text-foreground" dir="ltr">{s}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

// Demo returns store a reason key; returns submitted from the app already store display text.
const RETURN_REASON_KEYS = { damagedSim: 1, defectiveDevice: 1, wrongItem: 1, expiredVoucher: 1, excessStock: 1, others: 1 };

export default StockReturnView;
