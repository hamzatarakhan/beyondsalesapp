import { useTranslation } from "react-i18next";
import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Open-ended gauge: 270° sweep with the gap centred at the bottom, rounded caps and a
// white marker on the leading edge — matching the Sales KPI card design.
const GAUGE_START = -135;
const GAUGE_SPAN = 270;

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
};

const arcPath = (cx: number, cy: number, r: number, from: number, to: number) => {
  const s = polar(cx, cy, r, from);
  const e = polar(cx, cy, r, to);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
};

const KpiGauge = ({ percent }: { percent: number }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const end = GAUGE_START + (GAUGE_SPAN * clamped) / 100;
  const tip = polar(50, 50, 38, end);
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-24 h-24" role="img" aria-label={`${Math.round(clamped)}%`}>
        <path
          d={arcPath(50, 50, 38, GAUGE_START, GAUGE_START + GAUGE_SPAN)}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-kpi-gauge-track"
        />
        {clamped > 0 && (
          <path
            d={arcPath(50, 50, 38, GAUGE_START, end)}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-kpi-gauge"
          />
        )}
        <circle cx={tip.x} cy={tip.y} r="4" strokeWidth="2" className="fill-card stroke-kpi-gauge" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-kpi-gauge">
        {Math.round(clamped)}%
      </span>
    </div>
  );
};

/**
 * One KPI row of the commission table, rendered as a collapsible card.
 * Shows exactly the table columns — KPI (Killer), Achievement %, Eligible for the
 * commission?, Min, Weight Applied, Score contribution — and nothing else.
 */
type KpiAchievementCardProps = {
  name: string;
  killer?: boolean;
  /** Achievement % — drives the gauge. */
  percent: number;
  /** Achievement >= Min. */
  eligible: boolean;
  /** Minimum threshold %. */
  min: number;
  /** Weight applied %. */
  weight: number;
  /** Score contribution in %. */
  score: number;
  open: boolean;
  onToggle: () => void;
};

const KpiAchievementCard = ({
  name,
  killer,
  percent,
  eligible,
  min,
  weight,
  score,
  open,
  onToggle,
}: KpiAchievementCardProps) => {
  const { t } = useTranslation();
  const tiles = [
    {
      key: "min",
      label: t("ordersHistory.kpiMin", { defaultValue: "Min" }),
      value: `${min}%`,
      bg: "bg-kpi-lm",
      text: "text-kpi-lm-foreground",
    },
    {
      key: "weight",
      label: t("ordersHistory.kpiWeightApplied", { defaultValue: "Weight Applied" }),
      value: `${weight}%`,
      bg: "bg-kpi-mtd",
      text: "text-kpi-mtd-foreground",
    },
    {
      key: "score",
      label: t("ordersHistory.kpiScoreContribution", { defaultValue: "Score contribution" }),
      value: `${score.toFixed(1)}%`,
      bg: "bg-kpi-lmtd",
      text: "text-kpi-lmtd-foreground",
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? t("ordersHistory.kpiHideDetails") : t("ordersHistory.kpiShowDetails")}
        className="w-full bg-kpi-header px-4 py-3 flex items-center justify-between gap-3 text-start"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{name}</p>
          {killer && (
            <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold shrink-0">
              {t("ordersHistory.killerKpi", { defaultValue: "Killer" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <div className="flex flex-col items-center gap-1">
            <KpiGauge percent={percent} />
            <p className="text-[10px] text-muted-foreground text-center leading-tight">
              {t("ordersHistory.kpiAchievementPercent", { defaultValue: "Achievement %" })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {tiles.map((c) => (
              <div key={c.key} className={cn("rounded-xl px-2 py-2 text-center", c.bg)}>
                <p className={cn("text-[10px] font-semibold", c.text)}>{c.label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiAchievementCard;
