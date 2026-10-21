import { cn } from "@/lib/utils";

/**
 * Shared KPI ring used by every commission chart — the Commission tab cards and
 * the KPI group breakdown summary — so the teal gradient, ring thickness, track
 * colour and centred label stay identical everywhere.
 *
 * The ring is a conic-gradient sweep from bright teal to the deep gauge teal
 * across the filled share, with the rest of the arc in the gauge track colour.
 * Colours come from the KPI gauge tokens, so dark mode follows automatically.
 */
type KpiDonutProps = {
  /** Filled share of the ring, 0–100. */
  percent: number;
  /** Square chart box in px. */
  size?: number;
  /** Ring thickness in px. */
  thickness?: number;
  /** Text shown in the middle, e.g. "75%". */
  label: string;
  /** Size/weight classes for the middle label. */
  labelClassName?: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

const KpiDonut = ({ percent, size = 48, thickness = 4, label, labelClassName }: KpiDonutProps) => {
  const filled = clamp(percent);

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 0deg, hsl(var(--kpi-gauge-bright)) 0%, hsl(var(--kpi-gauge)) ${filled}%, hsl(var(--kpi-gauge-track)) ${filled}% 100%)`,
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(filled)}
    >
      <div className="absolute rounded-full bg-card" style={{ inset: thickness }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold text-foreground tabular-nums", labelClassName)}>{label}</span>
      </div>
    </div>
  );
};

export default KpiDonut;
