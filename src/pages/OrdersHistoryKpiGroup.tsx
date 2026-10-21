import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import KpiAchievementCard from "@/components/KpiAchievementCard";
import { KPI_GROUPS } from "@/pages/OrdersHistory";
import { cn } from "@/lib/utils";

// Small ring used by the group summary card at the top of the page.
const RingProgress = ({ percent }: { percent: number }) => {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, percent) / 100) * c;
  return (
    <div className="relative w-11 h-11 shrink-0">
      <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="text-emerald-500" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{percent}%</span>
    </div>
  );
};

const OrdersHistoryKpiGroup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { key } = useParams<{ key: string }>();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "member" ? "member" : "parent";

  const group = KPI_GROUPS.find((g) => g.key === key);
  // One card open at a time; the first starts open so the page never looks empty.
  const [openKey, setOpenKey] = useState<string | null>(group?.kpis[0]?.key ?? null);

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
        <div className="bg-card rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${group.key}`)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {t("ordersHistory.kpiAchievedOf", { achieved, total: group.kpis.length })}
            </p>
          </div>
          <RingProgress percent={overall} />
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
              updatedOn={k.updatedOn}
              delta={k.delta}
              percent={k.achievement}
              target={k.target}
              achieved={k.achieved}
              lm={k.lm}
              mtd={k.mtd}
              lmtd={k.lmtd}
              open={openKey === k.key}
              onToggle={() => setOpenKey(openKey === k.key ? null : k.key)}
            >
              <span
                className={cn(
                  "inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  eligible
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-destructive/10 text-destructive",
                )}
              >
                {eligible ? t("ordersHistory.kpiEligible", { defaultValue: "Eligible for commission" }) : t("ordersHistory.kpiNotEligible", { defaultValue: "Not eligible" })}
              </span>
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40 text-center">
                {[
                  { l: t("ordersHistory.kpiMin", { defaultValue: "Min" }), v: `${k.min}%` },
                  { l: t("ordersHistory.kpiWeight", { defaultValue: "Weight" }), v: `${k.weight}%` },
                  { l: t("ordersHistory.kpiScore", { defaultValue: "Score" }), v: `${score.toFixed(1)}%` },
                ].map((c) => (
                  <div key={c.l}>
                    <p className="text-[10px] text-muted-foreground">{c.l}</p>
                    <p className="text-xs font-bold text-foreground">{c.v}</p>
                  </div>
                ))}
              </div>
            </KpiAchievementCard>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersHistoryKpiGroup;
