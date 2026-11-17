import { useTranslation } from "react-i18next";
import { Gift } from "lucide-react";
import type { CvmOffer } from "@/lib/cvmOffers";
import { cn } from "@/lib/utils";

/** Offer headline, benefits line and footnote — shared by the offers page and the flows it opens. */
export const useCvmOfferText = () => {
  const { t } = useTranslation();
  return (o: CvmOffer) => {
    const k = "customerOffers";
    const title = (() => {
      switch (o.kind) {
        case "recharge": return t(`${k}.title.recharge`, { amount: o.minAmount });
        case "btl": return o.planTitle;
        case "changePlan": return t(o.renew ? `${k}.title.renew` : `${k}.title.upgrade`, { plan: o.planTitle });
        case "postpaidPlan": return t(`${k}.title.upgrade`, { plan: o.planTitle });
        case "direct": return t(`${k}.title.direct`);
        case "billFull": return t(`${k}.title.billFull`, { pct: o.discountPct, months: o.months });
        case "billWaiver": return t(`${k}.title.billWaiver`, { pct: o.payPct });
        case "billWaiverDiscount": return t(`${k}.title.billWaiverDiscount`, { pct: o.payPct, discount: o.discountPct, months: o.months });
        case "migration": return t(`${k}.title.migration`, { pct: o.discountPct, months: o.months });
      }
    })();
    const benefits =
      "benefits" in o
        ? o.benefits.map((b) => t(`${k}.benefit.${b.kind}`, { amount: b.amount })).join(" · ")
        : o.kind === "btl"
        ? t(`${k}.btlPrice`, { price: o.price })
        : null;
    const note =
      o.kind === "billFull" ? t(`${k}.note.billFull`)
      : o.kind === "billWaiver" || o.kind === "billWaiverDiscount" ? t(`${k}.note.billWaiver`)
      : o.kind === "migration" ? t(`${k}.note.migration`)
      : o.kind === "btl" ? null
      : t(`${k}.note.bonus`);
    return { title, benefits, note };
  };
};

// Same card + row primitives as the flows' own CardSection / SummaryRow.
// "large" follows pages built on text-sm (E-Reload) instead of the summary-card sizes.
export const OfferRow = ({ label, value, large }: { label: string; value: React.ReactNode; large?: boolean }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className={cn("text-muted-foreground", large ? "text-sm" : "text-[11px]")}>{label}</span>
    <span className={cn("text-foreground text-end", large ? "text-sm font-medium" : "text-xs font-semibold")}>{value}</span>
  </div>
);

/** With onClick it becomes a selectable tile (app-wide selected-state classes), like plan cards. */
export const OfferCard = ({ title, children, selected, onClick }: { title: string; children: React.ReactNode; selected?: boolean; onClick?: () => void }) => (
  <section
    onClick={onClick}
    role={onClick ? "button" : undefined}
    aria-pressed={onClick ? !!selected : undefined}
    className={cn(
      "rounded-2xl p-4 transition-colors",
      !onClick ? "bg-card shadow-sm" : selected ? "border-[0.5px] bg-primary/10 border-primary/20 cursor-pointer" : "border bg-card border-border/60 cursor-pointer",
    )}
  >
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Gift className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="flex-1 text-sm font-semibold text-foreground">{title}</p>
      {/* Same radio as the SIM Activation plan cards (PlanCard's SelectRadio). */}
      {onClick && (
        <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", selected ? "border-primary bg-primary" : "border-muted-foreground/30")}>
          {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
        </span>
      )}
    </div>
    {children}
  </section>
);

/** Shown at the top of a flow opened from Customer Offers, so the dealer sees which offer applies. */
const CvmOfferBanner = ({ offer, large }: { offer: CvmOffer | null; large?: boolean }) => {
  const { t } = useTranslation();
  const text = useCvmOfferText();
  if (!offer) return null;
  const { title, benefits, note } = text(offer);
  return (
    <OfferCard title={t("customerOffers.offerApplied")}>
      <OfferRow large={large} label={t("customerOffers.offer")} value={title} />
      {benefits && <OfferRow large={large} label={t("customerOffers.benefits")} value={benefits} />}
      <OfferRow large={large} label={t("customerOffers.validUntilLabel")} value={offer.validUntil} />
      {note && <p className={cn("text-muted-foreground leading-snug pt-2", large ? "text-xs" : "text-[11px]")}>{note}</p>}
    </OfferCard>
  );
};

export default CvmOfferBanner;
