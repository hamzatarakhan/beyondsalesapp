import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One KPI row of the commission table, rendered as a compact progress-bar card.
 * Shows exactly the table columns — KPI (Killer), Achievement %, Eligible for the
 * commission?, Min, Weight Applied, Score contribution — and nothing else:
 * name + Killer pill with the eligibility pill opposite, a bar whose fill stops at
 * the achievement with a tick marking the minimum, then "Achieved · Min" and
 * "Weight · Score" underneath.
 *
 * The bar fills teal once the minimum is met and red while it is missed, so an
 * ineligible KPI stands out without reading the pill.
 */
type KpiAchievementCardProps = {
  name: string;
  killer?: boolean;
  /** Achievement % — drives the bar fill. */
  percent: number;
  /** Achievement >= Min. */
  eligible: boolean;
  /** Minimum threshold % — marked by the tick on the bar. */
  min: number;
  /** Weight applied %. */
  weight: number;
  /** Score contribution in %. */
  score: number;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

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
  const clamped = clamp(percent);
  const minTick = clamp(min);
  const scoreLabel = `${score.toFixed(1)}%`;

  return (
    <div className="rounded-2xl bg-card border border-border/60 shadow-sm px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[15px] font-semibold text-foreground truncate">{name}</p>
          {killer && (
            <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold shrink-0">
              {t("ordersHistory.killerKpi", { defaultValue: "Killer" })}
            </span>
          )}
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0",
            eligible ? "bg-kpi-growth text-kpi-growth-foreground" : "bg-kpi-chip text-kpi-chip-foreground",
          )}
        >
          {eligible ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {eligible
            ? t("ordersHistory.kpiEligible", { defaultValue: "Eligible" })
            : t("ordersHistory.kpiNotEligible", { defaultValue: "Not eligible" })}
        </span>
      </div>

      <div
        className="relative mt-3 h-1.5 rounded-full bg-kpi-gauge-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={t("ordersHistory.kpiAchieved", { defaultValue: "Achieved" })}
      >
        <div
          className={cn("h-full rounded-full", eligible ? "bg-gradient-to-r from-kpi-gauge-bright to-kpi-gauge" : "bg-kpi-chip-foreground")}
          style={{ width: `${clamped}%` }}
        />
        <span
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 rounded-full bg-foreground/70"
          style={{ insetInlineStart: `calc(${minTick}% - 1px)` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
        <p className="text-muted-foreground min-w-0">
          {t("ordersHistory.kpiAchieved", { defaultValue: "Achieved" })}{" "}
          <span className="font-bold text-foreground tabular-nums">{Math.round(clamped)}%</span>
          {" · "}
          {t("ordersHistory.kpiMin", { defaultValue: "Min" })} {min}%
        </p>
        <p className="text-muted-foreground shrink-0">
          {t("ordersHistory.kpiWeight", { defaultValue: "Weight" })} {weight}%
          {" · "}
          <span
            className={cn(
              "font-bold tabular-nums",
              eligible ? "text-kpi-growth-foreground" : "text-muted-foreground",
            )}
          >
            {eligible ? `+${scoreLabel}` : scoreLabel}
          </span>
        </p>
      </div>
    </div>
  );
};

export default KpiAchievementCard;
