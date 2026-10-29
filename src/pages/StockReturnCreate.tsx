import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { ChevronRight, Boxes } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS } from "@/data/stockReturnStore";
import { getStockReturnScenario, usesLocationStep } from "@/data/stockReturnScenarios";

const StockReturnCreate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="mobile-container min-h-screen bg-background pb-10">
      <AppHeader title={t("stockReturn.createOrderTitle")} showBack onBackClick={() => navigate(usesLocationStep(getStockReturnScenario()) ? "/stock-returns/location" : "/stock-returns")} />

      <div className="px-4 space-y-3">
        {PURCHASE_ORDER_PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICON[p.id];
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/stock-returns/new/${p.id}`)}
              className="w-full text-start bg-card rounded-2xl border border-border/60 p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${p.nameKey}`)}</p>
                <p className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-0.5">
                  <Boxes className="w-3 h-3" /> {t("purchaseOrders.availableStocks", { count: p.availableStocks })}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StockReturnCreate;
