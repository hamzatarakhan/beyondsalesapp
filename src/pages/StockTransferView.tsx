import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Textarea } from "@/components/ui/textarea";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { cn } from "@/lib/utils";
import { MapPin, ArrowRight, Info, Smartphone, CreditCard, Router as RouterIcon } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, getStockTransfer, updateStockTransfer, type ProductId, type StockTransferStatus } from "@/data/stockTransferStore";

const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };

const STATUS_STYLE: Record<StockTransferStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  inTransit: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
};

type Action = "dispatch" | "receive" | "cancel";

const StockTransferView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const transfer = id ? getStockTransfer(id) : undefined;

  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [remark, setRemark] = useState("");

  const resolve = () => {
    if (!transfer) return;
    switch (confirmAction) {
      case "dispatch":
        updateStockTransfer(transfer.id, { status: "inTransit" });
        break;
      case "receive":
        updateStockTransfer(transfer.id, { status: "received" });
        break;
      case "cancel":
        updateStockTransfer(transfer.id, { status: "cancelled", reason: remark || t("stockTransfer.noReasonGiven") });
        break;
    }
    setConfirmAction(null);
    navigate("/stock-transfer");
  };

  if (!transfer) {
    return (
      <div className="mobile-container min-h-screen bg-background">
        <AppHeader title={t("stockTransfer.viewTitle")} showBack onBackClick={() => navigate("/stock-transfer")} />
        <p className="text-center text-sm text-muted-foreground py-16">{t("stockTransfer.noTransfers")}</p>
      </div>
    );
  }

  const confirmCopy: Record<Action, { title: string; desc: string; confirm: string }> = {
    dispatch: { title: t("stockTransfer.dispatchRequestTitle"), desc: t("stockTransfer.dispatchRequestDesc"), confirm: t("stockTransfer.confirmDispatch") },
    receive: { title: t("stockTransfer.receiveRequestTitle"), desc: t("stockTransfer.receiveRequestDesc"), confirm: t("stockTransfer.confirmReceipt") },
    cancel: { title: t("stockTransfer.cancelRequestTitle"), desc: t("stockTransfer.cancelRequestDesc"), confirm: t("purchaseOrders.submit") },
  };

  const hasActionBar = transfer.status === "pending" || transfer.status === "inTransit";

  return (
    <div className={cn("mobile-container min-h-screen bg-background", hasActionBar ? "pb-40" : "pb-8")}>
      <AppHeader title={t("stockTransfer.viewTitle")} showBack onBackClick={() => navigate("/stock-transfer")} />

      <div className="px-4 space-y-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{transfer.id}</p>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[transfer.status])}>{t(`stockTransfer.status.${transfer.status}`)}</span>
          </div>

          {transfer.status === "cancelled" && transfer.reason && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-3.5">
              <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{t("stockTransfer.cancelReason")}</p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{transfer.reason}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{t("stockTransfer.fromBranch")}</p>
                <p className="text-sm font-semibold text-foreground truncate">{transfer.fromBranch}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{t("stockTransfer.toBranch")}</p>
                <p className="text-sm font-semibold text-foreground truncate">{transfer.toBranch}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground px-1">{transfer.date}</p>
        </div>

        {transfer.lines.map((l) => {
          const product = PURCHASE_ORDER_PRODUCTS.find((p) => p.id === l.productId)!;
          const Icon = PRODUCT_ICON[l.productId];
          return (
            <div key={l.productId} className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${product.nameKey}`)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("purchaseOrders.pcs", { count: l.qty })}</p>
              </div>
            </div>
          );
        })}
      </div>

      {transfer.status === "pending" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3 space-y-3">
          <button type="button" onClick={() => setConfirmAction("dispatch")} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("stockTransfer.confirmDispatch")}
          </button>
          <button type="button" onClick={() => { setRemark(""); setConfirmAction("cancel"); }} className="w-full text-center text-sm font-semibold text-primary">
            {t("stockTransfer.cancelTransfer")}
          </button>
        </div>
      )}

      {transfer.status === "inTransit" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <button type="button" onClick={() => setConfirmAction("receive")} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("stockTransfer.confirmReceipt")}
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
        cancelLabel={t("purchaseOrders.cancel")}
      >
        {confirmAction === "cancel" && (
          <div className="space-y-1.5 text-start">
            <p className="text-xs font-medium text-muted-foreground">{t("stockTransfer.cancelRemarkLabel")}</p>
            <Textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={t("purchaseOrders.writeHere")} className="rounded-xl min-h-[90px]" />
          </div>
        )}
      </ConfirmMessageDrawer>
    </div>
  );
};

export default StockTransferView;
