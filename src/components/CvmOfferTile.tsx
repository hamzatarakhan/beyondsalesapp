import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ChevronRight, ArrowLeftRight, BadgeCheck, CalendarClock, Globe, Percent, Phone, PhoneOutgoing, Plug, Receipt, Signal, Wallet } from "lucide-react";
import RiyalSymbol from "@/components/RiyalSymbol";
import type { CvmBenefitKind, CvmOffer } from "@/lib/cvmOffers";
import { useCvmOfferText } from "@/components/CvmOfferBanner";

// Non-plan offers (recharge, gift, bill, migration) drawn like a PlanCard: same container and
// selected state, "title • validity" line with the plan radio, big primary headline, then icon
// feature rows — so every offer on the page reads like the plan cards around it.

const BENEFIT_ICON: Record<CvmBenefitKind, typeof Signal> = {
  data: Signal,
  minutes: Phone,
  social: Globe,
  idd: PhoneOutgoing,
  cashback: Wallet,
  discount: Percent,
};

const Row = ({ icon: Icon, children }: { icon: typeof Signal; children: React.ReactNode }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={2} />
    <p className="flex-1 text-[13px] text-foreground leading-snug">{children}</p>
  </div>
);

/** Soft full-width per-card action (only this opens the offer). */
export const OfferAction = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <div className="mt-4">
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="w-full h-11 inline-flex items-center justify-center gap-1 rounded-full border-[0.5px] border-primary/10 bg-primary/10 text-primary text-sm font-semibold active:opacity-70"
    >
      {label}
      <ChevronRight className="w-4 h-4 rtl:rotate-180" />
    </button>
  </div>
);

const CvmOfferTile = ({ offer: o, action, selected, onSelect }: { offer: CvmOffer; action?: React.ReactNode; selected?: boolean; onSelect?: () => void }) => {
  const { t } = useTranslation();
  const { nextBill } = useCvmOfferText()(o);
  const k = "customerOffers.tile";
  const B = ({ children }: { children: React.ReactNode }) => <span className="font-semibold">{children}</span>;

  const kicker =
    o.kind === "recharge" ? t(`${k}.kickerRecharge`)
    : o.kind === "direct" ? t(`${k}.kickerGift`)
    : o.kind === "migration" ? t(`${k}.kickerMigration`)
    : t(`${k}.kickerBill`);

  // Headline (big, primary) + small caption beside it, like a plan's data amount and price.
  const [headline, caption] = (() => {
    switch (o.kind) {
      case "recharge":
        return o.rule === "any"
          ? [t(`${k}.anyAmount`), t(`${k}.topUpCaption`)]
          : [<><span className="text-base font-normal text-muted-foreground"><RiyalSymbol /></span> {o.rule === "range" ? `${o.minAmount}–${o.maxAmount}` : o.minAmount}</>, t(o.rule === "range" ? `${k}.rangeTopUp` : `${k}.exactTopUp`)];
      case "direct": return [t(`${k}.free`), null];
      case "billFull": return [`${o.discountPct}%`, t(`${k}.offFor`, { months: o.months })];
      case "billWaiver":
      case "billWaiverDiscount": return [`${o.payPct}%`, t(`${k}.ofTheBill`)];
      case "migration": return [`${o.discountPct}%`, t(`${k}.offFor`, { months: o.months })];
      default: return [null, null];
    }
  })();

  const benefitRows =
    "benefits" in o
      ? o.benefits.map((b) => (
          <Row key={b.kind + b.amount} icon={BENEFIT_ICON[b.kind]}>
            <B>{b.kind === "cashback" ? <><RiyalSymbol /> {b.amount}</> : b.kind === "discount" ? `${b.amount}%` : `+${b.amount}`}</B>{" "}
            {t(`${k}.benefit.${b.kind}`)}
          </Row>
        ))
      : null;

  const rows = (() => {
    switch (o.kind) {
      case "billFull":
        return <>
          <Row icon={Receipt}>{t(`${k}.payFull`)}</Row>
          <Row icon={Percent}><B>{o.discountPct}%</B> {t(`${k}.planDiscount`, { months: o.months })}</Row>
          {nextBill && <Row icon={CalendarClock}>{t(`${k}.nextBills`)} <B>{nextBill}</B></Row>}
          <Row icon={Plug}>{t(`${k}.reconnect`)}</Row>
        </>;
      case "billWaiver":
      case "billWaiverDiscount":
        return <>
          <Row icon={Receipt}>{t(`${k}.pay`)} <B>{o.payPct}%</B> {t(`${k}.ofTheBill`)}</Row>
          <Row icon={BadgeCheck}><B>{100 - o.payPct}%</B> {t(`${k}.waived`)}</Row>
          {o.kind === "billWaiverDiscount" && <Row icon={Percent}><B>{o.discountPct}%</B> {t(`${k}.planDiscount`, { months: o.months })}</Row>}
          {nextBill && <Row icon={CalendarClock}>{t(`${k}.nextBills`)} <B>{nextBill}</B></Row>}
          <Row icon={Plug}>{t(`${k}.reconnect`)}</Row>
        </>;
      case "migration":
        return <>
          <Row icon={ArrowLeftRight}>{t(`${k}.migrate`)}</Row>
          <Row icon={Percent}><B>{o.discountPct}%</B> {t(`${k}.planDiscount`, { months: o.months })}</Row>
          <Row icon={Receipt}>{t(`${k}.autoApplied`)}</Row>
        </>;
      default:
        return benefitRows;
    }
  })();

  return (
    <div
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      aria-pressed={onSelect ? !!selected : undefined}
      className={cn(
        "relative rounded-2xl flex flex-col w-full transition-colors",
        selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60",
        onSelect && "cursor-pointer",
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[12px] text-muted-foreground">
            <span className="font-medium text-primary">{kicker}</span>
            <span className="mx-1.5">•</span>
            {t("customerOffers.validUntil", { date: o.validUntil })}
          </p>
          {/* Same radio as the SIM Activation plan cards. */}
          {onSelect && (
            <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", selected ? "border-primary bg-primary" : "border-muted-foreground/30")}>
              {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 mb-4">
          <p className="text-3xl font-bold leading-none text-primary">{headline}</p>
          {caption && <p className="text-[12px] text-muted-foreground pb-0.5">{caption}</p>}
        </div>
        <div className="space-y-2.5">{rows}</div>
        {action}
      </div>
    </div>
  );
};

export default CvmOfferTile;
