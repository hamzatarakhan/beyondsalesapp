import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { TEAM_ACHIEVEMENTS } from "@/pages/OrdersHistory";

// Full list behind the Commission tab's "See all" — the tab itself only shows the
// first 3 of TEAM_ACHIEVEMENTS.
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

const OrdersHistoryAchievements = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("ordersHistory.achievementsTitle")} showBack onBackClick={() => navigate(-1)} />
      <div className="px-4 space-y-3">
        {TEAM_ACHIEVEMENTS.map((a) => (
          <div key={a.key} className="bg-card rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${a.key}`)}</p>
              <p className="text-[11px] text-muted-foreground">{t("ordersHistory.achievementTarget")}</p>
            </div>
            <RingProgress percent={Math.round((a.achievement / a.target) * 100)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersHistoryAchievements;
