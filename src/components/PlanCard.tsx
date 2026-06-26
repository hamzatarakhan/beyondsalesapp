import { useState } from "react";
import { Gift, Signal, Globe, Phone, MessageSquare, Star, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

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

const FeatureRow = ({
  icon: Icon,
  label,
  chip,
}: {
  icon: typeof Signal;
  label: React.ReactNode;
  chip?: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={2} />
    <p className="flex-1 text-[13px] text-foreground leading-snug">{label}</p>
    {chip}
  </div>
);

const SocialChip = () => (
  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 text-[10px] font-semibold pointer-events-none">
    <span className="flex -space-x-1">
      <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-card" />
      <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-card" />
    </span>
    +5 more <ChevronRight className="w-2.5 h-2.5" />
  </span>
);

const FlagChip = () => (
  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 text-[10px] font-semibold pointer-events-none">
    <span className="flex -space-x-1">
      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-b from-red-500 via-white to-black border border-card" />
      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-green-600 via-white to-red-600 border border-card" />
    </span>
    +5 more <ChevronRight className="w-2.5 h-2.5" />
  </span>
);

const PlanCard = ({
  plan,
  selected,
  active = true,
  selectLabel = "Select this plan",
  selectedLabel = "Selected",
  onSelect,
  onMoreDetails,
}: Props) => {
  const validity = plan.validityLabel?.toLowerCase().replace("valid ", "") ?? "30 days";
  const [openSheet, setOpenSheet] = useState<null | "apps" | "countries">(null);
  return (
    <>
    <div
      className={cn(
        "rounded-2xl overflow-hidden border border-border bg-card transition-all duration-200",
        active ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"
      )}
    >
      {/* Most Popular header */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 text-center py-2.5">
        <p className="text-[13px] font-semibold text-foreground">Most Popular</p>
      </div>

      <div className="p-4">
        {/* Bonus chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-500 text-[11px] font-medium">
            <Gift className="w-3 h-3" /> Bonus {plan.internet} data
          </span>
          {plan.discount && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-500/10 text-red-500 text-[11px] font-medium">
              <Gift className="w-3 h-3" /> {plan.discount}
            </span>
          )}
        </div>

        {/* Title + validity */}
        <p className="text-[13px] mb-2">
          <button
            onClick={onMoreDetails}
            className="font-semibold text-primary active:opacity-70"
          >
            {plan.title}
          </button>
          <span className="mx-1.5 inline-block w-1 h-1 rounded-full bg-red-500 align-middle" />
          <span className="text-muted-foreground">valid {validity}</span>
        </p>

        {/* Data + price */}
        <div className="flex items-end justify-between mb-4">
          <p className="text-3xl font-bold text-primary leading-none">{plan.internet}</p>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Vat Incl</p>
            <p className="text-xl font-bold text-foreground">
              {Number(plan.price).toFixed(2)}{" "}
              <span className="text-muted-foreground font-normal text-sm">SAR</span>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-4">
          <FeatureRow icon={Signal} label={`${plan.internet} core data`} />
          <FeatureRow
            icon={Globe}
            label={<>Unlimited social data</>}
            chip={
              <button onClick={() => setOpenSheet("apps")} className="active:opacity-70">
                <SocialChip />
              </button>
            }
          />
          <FeatureRow icon={Phone} label={`${plan.mins} local minutes`} />
          <FeatureRow icon={Phone} label="Unlimited (receiving) roaming" />
          <FeatureRow icon={MessageSquare} label={`Unlimited SMS`} />
          <FeatureRow
            icon={Star}
            label="Free subscription upon activation"
            chip={
              <button onClick={() => setOpenSheet("countries")} className="active:opacity-70">
                <FlagChip />
              </button>
            }
          />
        </div>

        {/* CTA */}
        <button
          onClick={onSelect}
          className={cn(
            "w-full py-3 rounded-full text-sm font-semibold transition-colors",
            selected
              ? "bg-red-700 text-white"
              : "bg-red-600 text-white hover:bg-red-700"
          )}
        >
          {selected ? selectedLabel : selectLabel}
        </button>
      </div>
    </div>
    <InfoSheet
      open={openSheet === "apps"}
      onClose={() => setOpenSheet(null)}
      title="Supported Apps"
      items={[
        { label: "Facebook", icon: <span className="w-9 h-9 rounded-full bg-blue-600 text-white grid place-items-center font-bold text-sm">f</span> },
        { label: "Youtube", icon: <span className="w-9 h-9 rounded-full bg-red-600 text-white grid place-items-center text-xs">▶</span> },
        { label: "Whatsapp", icon: <span className="w-9 h-9 rounded-full bg-green-500 text-white grid place-items-center font-bold text-sm">W</span> },
        { label: "X", icon: <span className="w-9 h-9 rounded-full bg-black text-white grid place-items-center font-bold text-sm">X</span> },
        { label: "Instagram", icon: <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white grid place-items-center font-bold text-sm">IG</span> },
        { label: "TikTok", icon: <span className="w-9 h-9 rounded-full bg-black text-white grid place-items-center font-bold text-xs">TT</span> },
      ]}
    />
    <InfoSheet
      open={openSheet === "countries"}
      onClose={() => setOpenSheet(null)}
      title="Available in"
      items={[
        { label: "Saudi Arabia", icon: <span className="w-9 h-9 rounded-full bg-green-700 text-white grid place-items-center text-[10px]">KSA</span> },
        { label: "Egypt", icon: <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-b from-red-500 via-white to-black border" /> },
        { label: "UAE", icon: <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-r from-red-600 via-white to-green-600 border" /> },
        { label: "India", icon: <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-b from-orange-500 via-white to-green-600 border" /> },
        { label: "Bahrain", icon: <span className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-r from-red-600 to-white border" /> },
      ]}
    />
    </>
  );
};

const InfoSheet = ({
  open,
  onClose,
  title,
  items,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { label: string; icon: React.ReactNode }[];
}) => (
  <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
    <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[80vh]">
      <div className="relative mb-4 mt-2 flex items-center justify-center">
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        <button
          onClick={onClose}
          className="absolute right-0 w-8 h-8 rounded-full border border-border flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border"
          >
            {item.icon}
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </DrawerContent>
  </Drawer>
);

export default PlanCard;