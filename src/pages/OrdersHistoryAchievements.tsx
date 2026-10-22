import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import KpiDonut from "@/components/KpiDonut";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { COMMISSION_KPI_CARDS } from "@/pages/OrdersHistory";

const OrdersHistoryAchievements = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "member" ? "member" : "parent";

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("ordersHistory.teamAchievements")} showBack onBackClick={() => navigate("/")} />
      <div className="mx-4 bg-card rounded-2xl p-4 shadow-sm space-y-3">
        {COMMISSION_KPI_CARDS.map((card) => {
          const shell = "w-full rounded-2xl bg-surface border border-border/60 shadow-sm px-4 py-3 flex items-center gap-3";
          if (card.kind === "single") {
            return (
              <div key={card.key} className={shell}>
                <KpiDonut percent={card.commissionPercent} label={`${card.commissionPercent}%`} labelClassName="text-[10px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground truncate">{t("ordersHistory.bundlesRecharge")}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{t("ordersHistory.singleKpiSales", { value: card.sales })}</p>
                  <p className="text-[11px] font-semibold text-foreground leading-tight mt-0.5 flex items-center gap-1 tabular-nums">
                    <RiyalSymbol /> {card.amount}
                  </p>
                </div>
              </div>
            );
          }
          const group = card.group;
          const achieved = group.kpis.filter((kpi) => kpi.achievement >= kpi.min).length;
          const overall = Math.round(group.kpis.reduce((sum, kpi) => sum + kpi.achievement, 0) / group.kpis.length);
          return (
            <Button key={card.key} variant="ghost" onClick={() => navigate(`/order-history/kpi-group/${card.key}?view=${view}`)} className={`${shell} h-auto justify-start text-start whitespace-normal hover:bg-muted/60`}>
              <KpiDonut percent={overall} label={`${overall}%`} labelClassName="text-[10px]" />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${card.key}`)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("ordersHistory.kpiAchievedOf", { achieved, total: group.kpis.length })}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180 shrink-0" />
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersHistoryAchievements;
