import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Info, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { StockReturnHistoryEntry } from "@/data/stockReturnStore";

// Stock Return's Status History sheet — same layout as Request Stock's OrderStatusHistory, but
// built from the order's real history: who submitted it and each approver's decision, newest
// first. The badge says where the order stood after that step.
type Step = "submitted" | "teamLeaderApproved" | "approved" | "rejected";

const stepOf = (e: StockReturnHistoryEntry): Step =>
  e.action === "submit" ? "submitted" : e.action === "reject" ? "rejected" : e.role === "teamLeader" ? "teamLeaderApproved" : "approved";

const BADGE: Record<Step, string> = {
  submitted: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  teamLeaderApproved: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};

const DOT: Record<Step, string> = {
  submitted: "border-sky-400 text-sky-500",
  teamLeaderApproved: "border-amber-400 text-amber-500",
  approved: "border-emerald-500 text-emerald-600",
  rejected: "border-primary text-primary",
};

const ACTION: Record<StockReturnHistoryEntry["action"], string> = {
  submit: "text-primary",
  approve: "text-emerald-600",
  reject: "text-primary",
};

const StockReturnStatusHistory = ({ open, onOpenChange, history }: { open: boolean; onOpenChange: (o: boolean) => void; history: StockReturnHistoryEntry[] }) => {
  const { t } = useTranslation();
  const steps = [...history].reverse();

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
          {steps.map((e, i) => {
            const step = stepOf(e);
            const Icon = step === "rejected" ? X : step === "approved" ? Check : Info;
            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn("w-6 h-6 rounded-full border bg-card flex items-center justify-center shrink-0", DOT[step])}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {i < steps.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-xs text-muted-foreground mb-1.5">{e.date}</p>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{e.name}</p>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", BADGE[step])}>{t(`stockReturn.historySteps.${step}`)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{t(`stockReturn.roles.${e.role}`)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {t("purchaseOrders.history.actionTaken")} <span className={cn("font-semibold", ACTION[e.action])}>{t(`purchaseOrders.history.${e.action}`)}</span>
                    </p>
                    {e.action === "reject" && e.reason && (
                      <div className="mt-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2.5 py-2">
                        <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Info className="w-3 h-3" /> {t("stockReturn.rejectReason")}
                        </p>
                        <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 leading-snug mt-0.5">{e.reason}</p>
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

export default StockReturnStatusHistory;
