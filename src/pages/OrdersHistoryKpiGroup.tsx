import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import KpiAchievementCard from "@/components/KpiAchievementCard";
import { KPI_GROUPS } from "@/pages/OrdersHistory";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

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
  // Weighted commission score: each eligible KPI contributes achievement x weight.
  const totalScore = group.kpis.reduce(
    (s, k) => s + (k.achievement >= k.min ? (k.achievement * k.weight) / 100 : 0),
    0,
  );

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t(`ordersHistory.teamAchievement.${group.key}`)} showBack onBackClick={() => navigate(`/order-history?view=${view}`)} />

      <div className="px-4 space-y-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${group.key}`)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("ordersHistory.kpiAchievedOf", { achieved, total: group.kpis.length })}
            </p>
          </div>
          {/* Overall achievement as a ring; the weighted score sits inside it. */}
          <div className="relative w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ v: overall }, { v: 100 - overall }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="v"
                  stroke="none"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-sm font-bold text-primary tabular-nums">{overall}%</span>
              <span className="text-[8px] font-semibold text-muted-foreground mt-0.5 tabular-nums">
                {t("ordersHistory.kpiScore", { defaultValue: "Score" })} {totalScore.toFixed(1)}%
              </span>
            </div>
          </div>
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
