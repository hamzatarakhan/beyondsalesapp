import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { cn } from "@/lib/utils";
import { MapPin, Info, Eye, Plus, Smartphone, CreditCard, Router as RouterIcon, X as XIcon } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, getSalesOrder, updateSalesOrder, type ProductId, type SalesOrderStatus } from "@/data/salesOrdersStore";

const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };

const STATUS_STYLE: Record<SalesOrderStatus, string> = {
  rfq: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  quotationSent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  awaitingApproval: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  awaitingScanning: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  partiallyScanned: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  awaitingDelivery: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  received: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  cancelled: "bg-muted text-muted-foreground",
};

const REASON_OPTIONS = ["budget", "incorrectItems", "duplicateRequest", "pricingNotApproved", "other"] as const;

// Distinct from Purchase Order's action set — RFQ is just Edit/Cancel (no separate Submit
// step). Approve moves an order into Awaiting Scanning (not straight to Awaiting Delivery
// — scanning has to happen first, unlike Purchase Orders' receiving flow). Submitting from
// Awaiting Scanning/Partially Scanned always works, even incomplete: fully scanned lands
// on Awaiting Delivery, anything left over lands (or stays) on Partially Scanned. E-SIM
// lines never get scan UI — they're provisioned, not physically scanned.
type Action = "approve" | "reject" | "cancel" | "submitScanning";

const SalesOrderView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const order = id ? getSalesOrder(id) : undefined;

  const [, forceRerender] = useState(0);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [reasonKey, setReasonKey] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [serialsProduct, setSerialsProduct] = useState<ProductId | null>(null);

  const needsReason = confirmAction === "reject" || confirmAction === "cancel";

  const openConfirm = (action: Action) => {
    setReasonKey("");
    setRemark("");
    setConfirmAction(action);
  };

  const resolve = () => {
    if (!order) return;
    switch (confirmAction) {
      case "approve":
        updateSalesOrder(order.id, { status: "awaitingScanning" });
        break;
      case "reject":
        updateSalesOrder(order.id, { status: "rejected", reason: t(`purchaseOrders.reason.${reasonKey || "other"}`) + (remark ? ` — ${remark}` : "") });
        break;
      case "cancel":
        updateSalesOrder(order.id, { status: "cancelled", reason: t(`purchaseOrders.reason.${reasonKey || "other"}`) + (remark ? ` — ${remark}` : "") });
        break;
      case "submitScanning": {
        const fullyDone = order.lines.every((l) => l.productId === "esim" || l.scanned >= l.qty);
        updateSalesOrder(order.id, { status: fullyDone ? "awaitingDelivery" : "partiallyScanned" });
        break;
      }
    }
    setConfirmAction(null);
    forceRerender((n) => n + 1);
  };

  if (!order) {
    return (
      <div className="mobile-container min-h-screen bg-background">
        <AppHeader title={t("purchaseOrders.viewOrderTitle")} showBack onBackClick={() => navigate("/sales-orders")} />
        <p className="text-center text-sm text-muted-foreground py-16">{t("salesOrders.noOrders")}</p>
      </div>
    );
  }

  const confirmCopy: Record<Action, { title: string; desc: string; confirm: string }> = {
    approve: { title: t("purchaseOrders.approveRequestTitle"), desc: t("purchaseOrders.approveRequestDesc"), confirm: t("purchaseOrders.approve") },
    reject: { title: t("purchaseOrders.rejectRequestTitle"), desc: t("purchaseOrders.rejectRequestDesc"), confirm: t("purchaseOrders.submit") },
    cancel: { title: t("purchaseOrders.cancelRequestTitle"), desc: t("purchaseOrders.cancelRequestDesc"), confirm: t("purchaseOrders.submit") },
    submitScanning: { title: t("purchaseOrders.submitScanningRequestTitle"), desc: t("purchaseOrders.submitScanningRequestDesc"), confirm: t("purchaseOrders.confirm") },
  };

  const hasActionBar = ["rfq", "quotationSent", "awaitingApproval", "awaitingDelivery", "awaitingScanning", "partiallyScanned"].includes(order.status);

  return (
    <div className={cn("mobile-container min-h-screen bg-background", hasActionBar ? "pb-40" : "pb-8")}>
      <AppHeader title={t("purchaseOrders.viewOrderTitle")} showBack onBackClick={() => navigate("/sales-orders")} />

      <div className="px-4 space-y-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{order.id}</p>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[order.status])}>{t(`salesOrders.status.${order.status}`)}</span>
          </div>

          {(order.status === "cancelled" || order.status === "rejected") && order.reason && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-3.5">
              <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{t(order.status === "cancelled" ? "purchaseOrders.cancelReason" : "purchaseOrders.rejectReason")}</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{order.reason}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground">{t("purchaseOrders.shippingTo")}</p>
              <p className="text-sm font-semibold text-foreground">{order.destination}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            {order.date}
            {order.status !== "rfq" && (
              <>
                {" "}<span className="text-muted-foreground/50">•</span> <span className="text-primary font-semibold">{order.channelMember.name}</span>
              </>
            )}
          </p>
        </div>

        {order.lines.map((l) => {
          const product = PURCHASE_ORDER_PRODUCTS.find((p) => p.id === l.productId)!;
          const Icon = PRODUCT_ICON[l.productId];
          const isFullyScanned = l.scanned >= l.qty;
          return (
            <div key={l.productId} className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${product.nameKey}`)}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  <span>{t("purchaseOrders.pcs", { count: l.qty })}</span>
                  <span className="flex items-center gap-1">
                    <RiyalSymbol /> {product.price.toFixed(2)}
                  </span>
                </div>
              </div>
              {/* E-SIM is provisioned, not physically scanned — it never gets this UI.
                  Awaiting Scanning and Partially Scanned share the same per-item layout;
                  they only differ in the order-level badge. */}
              {l.productId !== "esim" && (order.status === "awaitingScanning" || order.status === "partiallyScanned") && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", isFullyScanned ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300")}>
                    {t("purchaseOrders.scannedCount", { scanned: l.scanned, qty: l.qty })}
                  </span>
                  {isFullyScanned ? (
                    <button type="button" onClick={() => setSerialsProduct(l.productId)} aria-label={t("purchaseOrders.viewSerialsAria")} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center">
                      <Eye className="w-4 h-4 text-foreground" />
                    </button>
                  ) : (
                    <button type="button" onClick={() => navigate(`/sales-orders/${order.id}/scan/${l.productId}`)} aria-label={t("purchaseOrders.scanAria")} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center">
                      <Plus className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
              )}
              {/* Awaiting Delivery is reached only once scanning is fully done — items
                  here are view-only (their serials were already captured). */}
              {l.productId !== "esim" && (order.status === "awaitingDelivery" || order.status === "received") && l.scanned > 0 && (
                <button type="button" onClick={() => setSerialsProduct(l.productId)} aria-label={t("purchaseOrders.viewSerialsAria")} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4 text-foreground" />
                </button>
              )}
            </div>
          );
        })}

        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("purchaseOrders.untaxedAmount")}</span>
            <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {order.untaxed.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <span className="text-xs text-muted-foreground">{t("purchaseOrders.tax")}</span>
            <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {order.tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-primary">{t("purchaseOrders.total")}</span>
            <span className="text-xs font-bold text-primary"><RiyalSymbol /> {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons pinned to the bottom of the screen — RFQ is just Edit/Cancel (no
          separate Submit step), Awaiting Approval is where the dealer Approves/Rejects,
          Awaiting Delivery offers View Invoice/Cancel (scanning starts per-item instead of
          Awaiting Delivery only Cancel (scanning's already done by the time an order gets
          here), and Awaiting Scanning/Partially Scanned are just Submit — always enabled,
          submitting with leftover unscanned units is allowed and expected. */}
      {order.status === "rfq" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3 space-y-3">
          <button type="button" onClick={() => navigate(`/sales-orders/${order.id}/edit`)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("purchaseOrders.edit")}
          </button>
          <button type="button" onClick={() => openConfirm("cancel")} className="w-full text-center text-sm font-semibold text-primary">
            {t("purchaseOrders.cancelOrder")}
          </button>
        </div>
      )}

      {order.status === "quotationSent" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3 space-y-3">
          <button type="button" onClick={() => navigate(`/sales-orders/${order.id}/edit`)} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("purchaseOrders.edit")}
          </button>
          <button type="button" onClick={() => openConfirm("cancel")} className="w-full text-center text-sm font-semibold text-primary">
            {t("purchaseOrders.cancelOrder")}
          </button>
        </div>
      )}

      {order.status === "awaitingApproval" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3 space-y-3">
          <button type="button" onClick={() => openConfirm("approve")} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("purchaseOrders.approve")}
          </button>
          <button type="button" onClick={() => openConfirm("reject")} className="w-full h-12 rounded-full border-2 border-primary text-primary font-semibold text-sm">
            {t("purchaseOrders.rejectOrder")}
          </button>
          <button type="button" onClick={() => openConfirm("cancel")} className="w-full text-center text-sm font-semibold text-primary">
            {t("purchaseOrders.cancelOrder")}
          </button>
        </div>
      )}

      {order.status === "awaitingDelivery" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <button type="button" onClick={() => openConfirm("cancel")} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("purchaseOrders.cancelOrder")}
          </button>
        </div>
      )}

      {(order.status === "awaitingScanning" || order.status === "partiallyScanned") && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <button type="button" onClick={() => openConfirm("submitScanning")} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("purchaseOrders.submit")}
          </button>
        </div>
      )}

      <ConfirmMessageDrawer
        open={!!confirmAction}
        onOpenChange={(o) => { if (!o) setConfirmAction(null); }}
        title={confirmAction ? confirmCopy[confirmAction].title : ""}
        description={confirmAction ? confirmCopy[confirmAction].desc : ""}
        confirmLabel={confirmAction ? confirmCopy[confirmAction].confirm : ""}
        onConfirm={resolve}
        confirmDisabled={needsReason && !reasonKey}
        cancelLabel={t("purchaseOrders.cancel")}
      >
        {needsReason && (
          <div className="space-y-3 text-start">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t(confirmAction === "cancel" ? "purchaseOrders.cancelReasonLabel" : "purchaseOrders.rejectReasonLabel")}</p>
              <Select value={reasonKey} onValueChange={setReasonKey}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder={t("purchaseOrders.selectReason")} />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{t(`purchaseOrders.reason.${r}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t(confirmAction === "cancel" ? "purchaseOrders.cancelRemarkLabel" : "purchaseOrders.rejectRemarkLabel")}</p>
              <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={t("purchaseOrders.writeHere")} className="rounded-xl min-h-[90px]" />
            </div>
          </div>
        )}
      </ConfirmMessageDrawer>

      {/* ---------- Scanned serials ---------- */}
      <Drawer open={!!serialsProduct} onOpenChange={(o) => { if (!o) setSerialsProduct(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <button onClick={() => setSerialsProduct(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{serialsProduct ? t(`purchaseOrders.product.${PURCHASE_ORDER_PRODUCTS.find((p) => p.id === serialsProduct)?.nameKey}`) : ""}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            {(order.lines.find((l) => l.productId === serialsProduct)?.serials ?? []).map((s) => (
              <div key={s} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <span className="text-sm font-mono text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

    </div>
  );
};

export default SalesOrderView;
