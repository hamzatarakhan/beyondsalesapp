import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import KpiDonut from "@/components/KpiDonut";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { COMMISSION_KPI_CARDS, type CommissionKpiCard } from "@/pages/OrdersHistory";

const OrdersHistoryAchievements = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "member" ? "member" : "parent";

  // Demo copies of the real records so the See all screen shows the full repeated
  // pattern (same card designs and data, appended after the genuine records).
  const demoCopies: { card: CommissionKpiCard; copyKey: string }[] = [
    { card: COMMISSION_KPI_CARDS[0], copyKey: "copy-1" },
    { card: COMMISSION_KPI_CARDS[1], copyKey: "copy-2" },
    { card: COMMISSION_KPI_CARDS[0], copyKey: "copy-3" },
    { card: COMMISSION_KPI_CARDS[1], copyKey: "copy-4" },
  ];

  const renderCard = (card: CommissionKpiCard, key: string, isCopy: boolean) => {
    const shell = "w-full rounded-2xl bg-card shadow-sm px-4 py-3 flex items-center gap-3";
    if (card.kind === "single") {
      return (
        <div key={key} className={shell}>
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
      <Button
        key={key}
        variant="ghost"
        onClick={() => !isCopy && navigate(`/order-history/kpi-group/${card.key}?view=${view}`)}
        className={`${shell} h-auto justify-start text-start whitespace-normal hover:bg-muted/60`}
      >
        <KpiDonut percent={overall} label={`${overall}%`} labelClassName="text-[10px]" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${card.key}`)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t("ordersHistory.kpiAchievedOf", { achieved, total: group.kpis.length })}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180 shrink-0" />
      </Button>
    );
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("ordersHistory.teamAchievements")} showBack onBackClick={() => navigate("/")} />
      <div className="mx-4 space-y-3">
        {COMMISSION_KPI_CARDS.map((card) => renderCard(card, card.key, false))}
        {demoCopies.map(({ card, copyKey }) => renderCard(card, copyKey, true))}
      </div>
    </div>
  );
};

export default OrdersHistoryAchievements;
