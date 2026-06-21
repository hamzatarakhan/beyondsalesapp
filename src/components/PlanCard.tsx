import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable, data-driven plan card.
 * Works across Prepaid, Postpaid and Change-Owner flows.
 *
 * Fields that may NOT generalise across flows (flag for callers):
 *  - `discount`        — promo concept; Change-Owner usually has no discount
 *  - `validityLabel`   — postpaid is recurring; "Valid 30 days" doesn't apply
 *  - `priceSuffix`     — "/mo" vs one-off charge differs per flow
 *  - `selectLabel`     — Prepaid: "Select" / Postpaid: "Subscribe" / Change-Owner: "Apply"
 */
export interface PlanCardData {
  title: string;
  internet: string;
  mins: string;
  sms: string;
  social: string;
  price: number;
  discount?: string | null;
  validityLabel?: string;
  priceSuffix?: string;
  features?: string[];
  categories?: string[];
  tags?: string[];
}

interface Props {
  plan: PlanCardData;
  selected: boolean;
  active?: boolean;
  selectLabel?: string;
  selectedLabel?: string;
  onSelect: () => void;
  onMoreDetails?: () => void;
}

const PlanCard = ({
  plan,
  selected,
  active = true,
  selectLabel = "Select",
  selectedLabel = "Selected",
  onSelect,
  onMoreDetails,
}: Props) => (
  <div
    className={cn(
      "bg-card rounded-2xl p-4 shadow-sm transition-all duration-200",
      active ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"
    )}
  >
    <div className="flex items-center justify-between mb-3">
      <p className="font-semibold text-foreground">{plan.title}</p>
      {plan.discount && (
        <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold">
          {plan.discount}
        </span>
      )}
    </div>
    <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
      <Stat label="Internet" value={plan.internet} />
      <Stat label="Local Mins" value={plan.mins} />
      <Stat label="SMS" value={plan.sms} />
      <Stat label="Social Media" value={plan.social} />
    </div>
    {onMoreDetails && (
      <button
        onClick={onMoreDetails}
        className="flex items-center gap-1 text-sky-600 text-xs font-medium mb-3 active:opacity-70"
      >
        More Details <Eye className="w-3.5 h-3.5" />
      </button>
    )}
    <div className="flex items-center justify-between mb-3">
      <p>
        <span className="text-2xl font-bold text-primary">
          {plan.price}
          {plan.priceSuffix ?? "/mo"}
        </span>
        <span className="text-xs text-muted-foreground ml-1">kSA</span>
      </p>
      {plan.validityLabel && (
        <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-[10px] font-medium">
          {plan.validityLabel}
        </span>
      )}
    </div>
    <p className="text-[11px] text-muted-foreground mb-3">+15% Vat included</p>
    <button
      onClick={onSelect}
      className={cn(
        "w-full py-2.5 rounded-full text-sm font-semibold transition-colors",
        selected
          ? "bg-primary text-primary-foreground"
          : "bg-primary/10 text-primary"
      )}
    >
      {selected ? selectedLabel : selectLabel}
    </button>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground">{label}</p>
    <p className="font-semibold text-foreground">{value}</p>
  </div>
);

export default PlanCard;