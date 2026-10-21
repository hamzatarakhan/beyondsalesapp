import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import KpiAchievementCard from "@/components/KpiAchievementCard";
import { KPI_GROUPS } from "@/pages/OrdersHistory";
import KpiDonut from "@/components/KpiDonut";

const OrdersHistoryKpiGroup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { key } = useParams<{ key: string }>();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "member" ? "member" : "parent";

  const group = KPI_GROUPS.find((g) => g.key === key);

  if (!group) {
    return (
      <div className="mobile-container min-h-screen bg-background pb-8">
        <AppHeader title={t("ordersHistory.teamAchievements")} showBack onBackClick={() => navigate(-1)} />
        <p className="px-4 text-xs text-muted-foreground text-center py-10">{t("ordersHistory.noOrders")}</p>
      </div>
    );
  }

  const achieved = group.kpis.filter((k) => k.achievement >= k.min).length;
  const overall = Math.round(group.kpis.reduce((s, k) => s + k.achievement, 0) / group.kpis.length);


  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t(`ordersHistory.teamAchievement.${group.key}`)} showBack onBackClick={() => navigate(`/order-history?view=${view}`)} />

      <div className="px-4 space-y-3">
        <div className="bg-card rounded-2xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${group.key}`)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("ordersHistory.kpiAchievedOf", { achieved, total: group.kpis.length })}
            </p>
          </div>
          {/* Overall achievement as a ring; every commission chart shares this style. */}
          <KpiDonut percent={overall} size={48} label={`${overall}%`} labelClassName="text-[10px]" />
        </div>

        <p className="text-xs text-muted-foreground px-1">{t("ordersHistory.kpiBreakdown")}</p>

        {group.kpis.map((k) => {
          const eligible = k.achievement >= k.min;
          const score = eligible ? (k.achievement * k.weight) / 100 : 0;
          return (
            <KpiAchievementCard
              key={k.key}
              name={k.name}
              killer={k.killer}
              percent={k.achievement}
              eligible={eligible}
              min={k.min}
              weight={k.weight}
              score={score}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OrdersHistoryKpiGroup;
