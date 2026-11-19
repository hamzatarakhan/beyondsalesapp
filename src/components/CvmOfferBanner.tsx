import { useTranslation } from "react-i18next";
import { Gift } from "lucide-react";
import type { CvmOffer, CarriedCvmOffer } from "@/lib/cvmOffers";
import { cn } from "@/lib/utils";

/** Offer headline, benefits line and footnote — shared by the offers page and the flows it opens. */
export const useCvmOfferText = () => {
  const { t } = useTranslation();
  return (o: CvmOffer) => {
    const k = "customerOffers";
    const title = (() => {
      switch (o.kind) {
        case "recharge": return t(`${k}.title.recharge${o.rule === "exact" ? "Exact" : o.rule === "range" ? "Range" : "Any"}`, { amount: o.minAmount, min: o.minAmount, max: o.maxAmount });
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
    // Bill Offer 1 / 3 example: what the customer's next bills will be with the plan discount.
    const nextBill =
      o.kind === "billFull" || o.kind === "billWaiverDiscount"
        ? t(`${k}.nextBillValue`, {
            price: (o.planPrice * (1 - o.discountPct / 100)).toFixed(2),
            was: o.planPrice.toFixed(2),
            months: o.months,
          })
        : null;
    return { title, benefits, note, nextBill };
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
  const { title, benefits, note, nextBill } = text(offer);
  return (
    <OfferCard title={t("customerOffers.offerApplied")}>
      <OfferRow large={large} label={t("customerOffers.offer")} value={title} />
      {benefits && <OfferRow large={large} label={t("customerOffers.benefits")} value={benefits} />}
      {nextBill && <OfferRow large={large} label={t("customerOffers.nextBills")} value={nextBill} />}
      <OfferRow large={large} label={t("customerOffers.validUntilLabel")} value={offer.validUntil} />
      {note && <p className={cn("text-muted-foreground leading-snug pt-2", large ? "text-xs" : "text-[11px]")}>{note}</p>}
    </OfferCard>
  );
};

/** Line on a flow's success sheet: what the customer gets from the offer, and where it shows. */
export const CvmOfferSuccessNote = ({ offer }: { offer: CarriedCvmOffer | null }) => {
  const { t } = useTranslation();
  const text = useCvmOfferText();
  if (!offer) return null;
  const { benefits, nextBill } = text(offer);
  const k = "customerOffers.success";
  const msg =
    offer.kind === "billWaiver" ? t(`${k}.waiver`)
    : offer.kind === "billFull" || offer.kind === "billWaiverDiscount" ? t(`${k}.billDiscount`, { nextBill })
    : offer.kind === "migration" ? t(`${k}.migration`, { pct: offer.discountPct, months: offer.months })
    : offer.kind === "btl" ? t(`${k}.btl`)
    : t(`${k}.bonus`, { benefits, msisdn: offer.msisdn });
  return (
    <div className="mt-3 w-full rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 flex items-start gap-2 text-start">
      <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-snug">{msg}</p>
    </div>
  );
};

export default CvmOfferBanner;
