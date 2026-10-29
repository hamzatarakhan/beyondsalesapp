import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { cn } from "@/lib/utils";
import { ChevronRight, Boxes, Package, SquarePen, CheckCircle2 } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, returnDraft, submitReturnDraft } from "@/data/stockReturnStore";
import { getStockReturnScenario, usesLocationStep } from "@/data/stockReturnScenarios";

// Create Order product list of a multi-product Stock Return. Products saved from their own
// page (Submit there) show as a summary card with Edit in place of their plain card; Submit
// Order at the bottom sends every saved product together as one return.
const StockReturnCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [items] = useState(() => returnDraft.items);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const canSubmitOrder = items.length > 0;

  const submitOrder = () => {
    setConfirmOpen(false);
    submitReturnDraft((r) => t(`stockReturn.reasons.${r}`), getStockReturnScenario().role, getStockReturnScenario().user.name);
    setSuccessOpen(true);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t("stockReturn.createOrderTitle")} showBack onBackClick={() => navigate(usesLocationStep(getStockReturnScenario()) ? "/stock-returns/location" : "/stock-returns")} />

      <div className="px-4 space-y-3">
        {PURCHASE_ORDER_PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICON[p.id];
          const name = t(`purchaseOrders.product.${p.nameKey}`);
          const item = items.find((i) => i.productId === p.id);
          const open = () => navigate(`/stock-returns/new/${p.id}`);

          if (item) {
            return (
              <div key={p.id} className="bg-card rounded-2xl border border-primary/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Package className="w-3.5 h-3.5" /> {t("stockReturn.returnQuantity", { count: item.qty })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={open}
                    aria-label={t("stockReturn.editProductAria", { product: name })}
                    className="w-8 h-8 rounded-lg border border-primary/30 flex items-center justify-center text-primary shrink-0"
                  >
                    <SquarePen className="w-4 h-4" />
                  </button>
                </div>
                <div className="border-t border-border/60 pt-3 space-y-0.5">
                  <p className="text-[11px] font-semibold text-primary">{t("stockReturn.reasonForReturnLabel")}</p>
                  <p className="text-xs font-bold text-foreground">{t(`stockReturn.reasons.${item.reason}`)}</p>
                  {item.remark.trim() && <p className="text-xs text-muted-foreground">{item.remark}</p>}
                </div>
              </div>
            );
          }

          return (
            <button
              key={p.id}
              type="button"
              onClick={open}
              className="w-full text-start bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{name}</p>
                <p className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-0.5">
                  <Boxes className="w-3 h-3" /> {t("purchaseOrders.availableStocks", { count: p.availableStocks })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <button
          type="button"
          disabled={!canSubmitOrder}
          onClick={() => setConfirmOpen(true)}
          className={cn(
            "w-full h-12 rounded-full font-semibold text-sm transition-colors",
            canSubmitOrder ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {t("stockReturn.submitOrder")}
        </button>
      </div>

      <ConfirmMessageDrawer
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("stockReturn.submitOrderTitle")}
        description={t("stockReturn.submitOrderDesc", { count: items.length })}
        confirmLabel={t("stockReturn.submitOrder")}
        onConfirm={submitOrder}
        cancelLabel={t("purchaseOrders.cancel")}
      />

      <Dialog open={successOpen} onOpenChange={(open) => { setSuccessOpen(open); if (!open) navigate("/stock-returns"); }}>
        <DialogContent className="max-w-[320px] rounded-2xl text-center">
          <div className="flex flex-col items-center gap-3 py-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-base font-bold text-foreground">{t("stockReturn.successTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("stockReturn.successMessage")}</p>
            <button
              type="button"
              onClick={() => { setSuccessOpen(false); navigate("/stock-returns"); }}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm mt-1"
            >
              {t("stockReturn.goToList")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockReturnCreate;
