import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Info, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { PurchaseOrderStatus } from "@/data/purchaseOrdersStore";

type Action = "submit" | "approve" | "reject" | "cancel";

// Prototype-only: no audit log exists yet, so the timeline is derived from the order's
// current status — every order was submitted, then moved on to wherever it is now.
const PATH: Partial<Record<PurchaseOrderStatus, { stage: PurchaseOrderStatus; action: Action }[]>> = {
  awaitingApproval: [{ stage: "awaitingApproval", action: "submit" }],
  awaitingScanning: [{ stage: "awaitingApproval", action: "submit" }, { stage: "awaitingScanning", action: "approve" }],
  received: [{ stage: "awaitingApproval", action: "submit" }, { stage: "awaitingScanning", action: "approve" }, { stage: "received", action: "approve" }],
  rejected: [{ stage: "awaitingApproval", action: "submit" }, { stage: "rejected", action: "reject" }],
  cancelled: [{ stage: "awaitingApproval", action: "submit" }, { stage: "cancelled", action: "cancel" }],
};

const STAGE_STYLE: Partial<Record<PurchaseOrderStatus, string>> = {
  awaitingApproval: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  awaitingScanning: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  received: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  cancelled: "bg-muted text-muted-foreground",
};

const DOT_STYLE: Partial<Record<PurchaseOrderStatus, string>> = {
  awaitingApproval: "border-sky-400 text-sky-500",
  awaitingScanning: "border-amber-400 text-amber-500",
  received: "border-emerald-500 text-emerald-600",
  rejected: "border-primary text-primary",
  cancelled: "border-muted-foreground text-muted-foreground",
};

const ACTION_STYLE: Record<Action, string> = {
  submit: "text-primary",
  approve: "text-emerald-600",
  reject: "text-primary",
  cancel: "text-muted-foreground",
};

const OrderStatusHistory = ({
  open,
  onOpenChange,
  status,
  date,
  reason,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  status: PurchaseOrderStatus;
  date: string;
  reason?: string;
}) => {
  const { t } = useTranslation();
  const steps = (PATH[status] ?? PATH.awaitingApproval!).slice().reverse();
  const [day, time] = date.split(" - ");

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between pb-4 shrink-0">
          <button type="button" onClick={() => onOpenChange(false)} aria-label={t("purchaseOrders.history.back")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4 text-foreground rtl:rotate-180" />
          </button>
          <div className="text-center flex-1">
            <DrawerTitle className="text-lg font-bold text-foreground">{t("purchaseOrders.history.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("purchaseOrders.history.subtitle")}</DrawerDescription>
          </div>
          <DrawerClose aria-label={t("settings.close")} className="w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </DrawerClose>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {steps.map((s, i) => {
            const Icon = s.stage === "rejected" ? X : s.stage === "received" ? Check : Info;
            return (
              <div key={s.stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn("w-6 h-6 rounded-full border bg-card flex items-center justify-center shrink-0", DOT_STYLE[s.stage])}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">{day} <span className="mx-0.5">•</span> {time}</p>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{t("purchaseOrders.history.actor")}</p>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STAGE_STYLE[s.stage])}>{t(`purchaseOrders.status.${s.stage}`)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t("purchaseOrders.history.role")}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {t("purchaseOrders.history.actionTaken")} <span className={cn("font-semibold", ACTION_STYLE[s.action])}>{t(`purchaseOrders.history.${s.action}`)}</span>
                    </p>
                    {(s.stage === "rejected" || s.stage === "cancelled") && reason && (
                      <div className="mt-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2.5 py-2">
                        <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {t(s.stage === "cancelled" ? "purchaseOrders.cancelReason" : "purchaseOrders.rejectReason")}
                        </p>
                        <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 leading-snug mt-0.5">{reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default OrderStatusHistory;
