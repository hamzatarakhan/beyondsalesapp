import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One KPI row of the commission table, rendered as a flat progress-bar card.
 * Shows exactly the table columns — KPI (Killer), Achievement %, Eligible for the
 * commission?, Min, Weight Applied, Score contribution — and nothing else.
 *
 * The achievement is a thin bar with a tick marking the minimum threshold, so the
 * whole KPI is readable at a glance without expanding anything. Eligibility also
 * paints the leading edge stripe, the bar and the percentage.
 */
type KpiAchievementCardProps = {
  name: string;
  killer?: boolean;
  /** Achievement % — drives the bar. */
  percent: number;
  /** Achievement >= Min. */
  eligible: boolean;
  /** Minimum threshold %. */
  min: number;
  /** Weight applied %. */
  weight: number;
  /** Score contribution in %. */
  score: number;
};

const KpiAchievementCard = ({
  name,
  killer,
  percent,
  eligible,
  min,
  weight,
  score,
}: KpiAchievementCardProps) => {
  const { t } = useTranslation();
  const clamped = Math.max(0, Math.min(100, percent));
  const minTick = Math.max(0, Math.min(100, min));

  const stats = [
    {
      key: "min",
      label: t("ordersHistory.kpiMin", { defaultValue: "Min" }),
      value: `${min}%`,
    },
    {
      key: "weight",
      label: t("ordersHistory.kpiWeightApplied", { defaultValue: "Weight Applied" }),
      value: `${weight}%`,
    },
    {
      key: "score",
      label: t("ordersHistory.kpiScoreContribution", { defaultValue: "Score contribution" }),
      value: `${score.toFixed(1)}%`,
    },
  ];

  return (
    <div className="flex rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm">
      <span
        aria-hidden
        className={cn("w-1.5 shrink-0", eligible ? "bg-kpi-growth-foreground" : "bg-kpi-chip-foreground")}
      />

      <div className="flex-1 min-w-0 p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="shrink-0">
            <p
              className={cn(
                "text-3xl font-bold leading-none tabular-nums",
                eligible ? "text-kpi-growth-foreground" : "text-kpi-chip-foreground",
              )}
            >
              {Math.round(clamped)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t("ordersHistory.kpiAchievementPercent", { defaultValue: "Achievement %" })}
            </p>
          </div>

          <div className="min-w-0 text-end space-y-1.5">
            <div className="flex items-center justify-end gap-1.5 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{name}</p>
              {killer && (
                <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold shrink-0">
                  {t("ordersHistory.killerKpi", { defaultValue: "Killer" })}
                </span>
              )}
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold",
                eligible ? "bg-kpi-growth text-kpi-growth-foreground" : "bg-kpi-chip text-kpi-chip-foreground",
              )}
            >
              {eligible ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {eligible
                ? t("ordersHistory.kpiEligible", { defaultValue: "Eligible" })
                : t("ordersHistory.kpiNotEligible", { defaultValue: "Not eligible" })}
            </span>
          </div>
        </div>

        <div
          className="relative h-2 rounded-full bg-kpi-gauge-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamped)}
          aria-label={t("ordersHistory.kpiAchievementPercent", { defaultValue: "Achievement %" })}
        >
          <div
            className={cn("h-full rounded-full", eligible ? "bg-kpi-growth-foreground" : "bg-kpi-chip-foreground")}
            style={{ width: `${clamped}%` }}
          />
          <span
            aria-hidden
            className="absolute top-1/2 -translate-y-1/2 h-3.5 w-0.5 rounded-full bg-foreground/45"
            style={{ insetInlineStart: `calc(${minTick}% - 1px)` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-kpi-tile/70 px-2 py-2">
          {stats.map((s) => (
            <div key={s.key} className="text-center min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground truncate">{s.label}</p>
              <p className="text-sm font-bold text-foreground mt-0.5 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KpiAchievementCard;
