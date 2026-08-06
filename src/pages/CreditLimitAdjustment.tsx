import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PayOption from "@/components/activation/PayOption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import { DEALER_WALLET_BALANCE, VerifiedBanner } from "@/pages/NewActivation";
import {
  Phone,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  HandCoins,
  ClipboardList,
  AlertCircle,
  Check,
  XCircle,
  Minus,
  Plus,
} from "lucide-react";

// ---------- Local UI primitives (mirrors NewActivation.tsx / SubscriptionMigration.tsx) ----------
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
  </div>
);

const CardSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ClipboardList;
  children: React.ReactNode;
}) => (
  <section className="bg-card rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    {children}
  </section>
);

// ---------- Demo data ----------
interface DemoCreditCustomer {
  msisdn: string;
  name: string;
  planCategory: string;
  currentLimit: number;
}

const DEMO_CREDIT_CUSTOMERS: DemoCreditCustomer[] = [
  { msisdn: "0502222211", name: "Ahmed Mohammed", planCategory: "switch-postpaid", currentLimit: 200 },
  { msisdn: "0502222222", name: "Sara Al-Otaibi", planCategory: "switch-postpaid", currentLimit: 500 },
  { msisdn: "0501111133", name: "Faisal Al-Harbi", planCategory: "flex", currentLimit: 0 },
];

const DELTA_STEP = 10;
const DELTA_MIN = 10;
const DELTA_MAX = 200;

const CreditLimitAdjustment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  // Step 0 — Lookup
  const [msisdn, setMsisdn] = useState("0502222211");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoCreditCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Step 1 — Adjust
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [delta, setDelta] = useState(DELTA_STEP);

  // Step 2 — Checkout
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN lookup — triggered by the Search button, not on every keystroke ----------
  const handleSearch = () => {
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    setLookupError(null);
    setCustomer(null);
    setTimeout(() => {
      setChecking(false);
      const found = DEMO_CREDIT_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError(t("creditLimitAdjustment.lookupErrorNotFound"));
        return;
      }
      if (found.planCategory !== "switch-postpaid") {
        setLookupError(t("creditLimitAdjustment.lookupErrorNotEligible"));
        return;
      }
      setCustomer(found);
    }, 800);
  };

  const eligible = !!customer && !lookupError;

  // ---------- Limit math ----------
  const currentLimit = customer?.currentLimit ?? 0;
  const effectiveDelta = direction === "decrease" ? Math.min(delta, currentLimit) : delta;
  const newLimit = direction === "increase" ? currentLimit + delta : currentLimit - effectiveDelta;

  // Reset the delta step whenever direction or customer changes, so it never starts out-of-range.
  useEffect(() => {
    setDelta(DELTA_STEP);
  }, [direction, customer]);

  // ---------- OTP handlers ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => {
      setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpOpen]);

  const setOtpDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      if (d && i === 5) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "111111") {
            setOtpError(true);
          } else {
            setOtpError(false);
            setOtpVerified(true);
            setOtpOpen(false);
          }
        }, 300);
      }
      return next;
    });
    if (d && i < 5) {
      const el = document.getElementById(`credit-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("credit-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  const canContinueAdjust = eligible && delta > 0 && newLimit >= 0;
  const canConfirm = otpVerified;

  const resolvePayment = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`CL-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMsisdn("0502222211");
    setCustomer(null);
    setLookupError(null);
    setDirection("increase");
    setDelta(DELTA_STEP);
    setOtpVerified(false);
    setPayMethod("wallet");
  };

  // Hidden per UX decision: a 2-stage stepper adds chrome without adding real progress info.
  // Kept in source in case we want it back — just uncomment the FlowStepper line below.
  const steps = [
    { label: "Adjust", Icon: TrendingUp },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("creditLimitAdjustment.title")} showBack onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} />
      {/* <FlowStepper current={step} steps={steps} /> */}

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup + Adjust (merged) ── */}
        {step === 0 && (
          <>
            <Field label={t("creditLimitAdjustment.msisdn")}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={msisdn}
                    onChange={(e) => { setMsisdn(e.target.value.replace(/\D/g, "").slice(0, 10)); setCustomer(null); setLookupError(null); }}
                    placeholder={t("creditLimitAdjustment.msisdnPlaceholder")}
                    inputMode="numeric"
                    className="h-12 bg-card rounded-xl pe-10"
                  />
                  <Phone className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {/* Fixed width so swapping the label for the loader doesn't resize the button. */}
                <Button
                  type="button"
                  className="h-12 w-20 rounded-xl shrink-0"
                  disabled={!/^\d{10}$/.test(msisdn) || checking}
                  onClick={handleSearch}
                >
                  {t("creditLimitAdjustment.search")}
                </Button>
              </div>
            </Field>

            <PrototypeTestBox
              heading={t("creditLimitAdjustment.testNumbersHeading")}
              description={t("creditLimitAdjustment.testNumbersDescription")}
              items={[
                { value: "0502222211", note: t("creditLimitAdjustment.testNoteLimit200") },
                { value: "0502222222", note: t("creditLimitAdjustment.testNoteLimit500") },
                { value: "0501111133", note: t("creditLimitAdjustment.testNoteNotSwitchPostpaid") },
                { value: "0500000099", note: t("creditLimitAdjustment.testNoteNotFound") },
              ]}
              onSelect={(v) => { setMsisdn(v); setCustomer(null); setLookupError(null); }}
            />

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}

            {customer && (
              <>
                <CardSection title={t("creditLimitAdjustment.customerDetails")} icon={ClipboardList}>
              <SummaryRow label={t("creditLimitAdjustment.customerName")} value={customer.name} />
              <SummaryRow label={t("creditLimitAdjustment.currentCreditLimit")} value={<><RiyalSymbol /> {currentLimit}</>} />
            </CardSection>

            <div className="flex gap-3">
              {([
                { value: "increase" as const, label: t("creditLimitAdjustment.increase"), Icon: TrendingUp },
                { value: "decrease" as const, label: t("creditLimitAdjustment.decrease"), Icon: TrendingDown },
              ]).map(({ value, label, Icon }) => {
                const selected = direction === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDirection(value)}
                    className={cn(
                      "relative flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all",
                      selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60"
                    )}
                  >
                    <span className={cn(
                      "absolute top-2.5 end-2.5 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <Icon className={cn("w-6 h-6", selected ? "text-primary" : "text-muted-foreground")} />
                    <p className={cn("text-sm font-semibold", selected ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                  </button>
                );
              })}
            </div>

            <CardSection title={t("creditLimitAdjustment.adjustmentAmount")} icon={direction === "increase" ? TrendingUp : TrendingDown}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setDelta((d) => Math.max(DELTA_MIN, d - DELTA_STEP))}
                  disabled={delta <= DELTA_MIN}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
                >
                  <Minus className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-2xl font-bold text-foreground">
                  <RiyalSymbol className="text-lg" /> {delta}
                </span>
                <button
                  type="button"
                  onClick={() => setDelta((d) => Math.min(DELTA_MAX, d + DELTA_STEP))}
                  disabled={delta >= DELTA_MAX || (direction === "decrease" && delta >= currentLimit)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
                >
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </CardSection>

            <CardSection title={t("creditLimitAdjustment.preview")} icon={ClipboardList}>
              <SummaryRow label={t("creditLimitAdjustment.currentLimit")} value={<><RiyalSymbol /> {currentLimit}</>} />
              <SummaryRow label={t("creditLimitAdjustment.newLimit")} value={<span className="text-primary"><RiyalSymbol /> {newLimit}</span>} />
            </CardSection>

            {direction === "increase" ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500/20 px-4 py-3 flex items-start gap-3">
                <HandCoins className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-sky-700 dark:text-sky-300 leading-snug">
                  {t("creditLimitAdjustment.increaseNote", { delta })}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-3">
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-emerald-700 dark:text-emerald-300 leading-snug">
                  {t("creditLimitAdjustment.decreaseNote", { delta: effectiveDelta })}
                </p>
              </div>
            )}
              </>
            )}
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 1 && customer && (
          <>
            <CardSection title={t("creditLimitAdjustment.adjustmentSummary")} icon={ClipboardList}>
              <SummaryRow label={t("creditLimitAdjustment.customerName")} value={customer.name} />
              <SummaryRow label={t("creditLimitAdjustment.direction")} value={direction === "increase" ? t("creditLimitAdjustment.increase") : t("creditLimitAdjustment.decrease")} />
              <SummaryRow label={t("creditLimitAdjustment.currentLimit")} value={<><RiyalSymbol /> {currentLimit}</>} />
              <SummaryRow label={t("creditLimitAdjustment.newLimit")} value={<><RiyalSymbol /> {newLimit}</>} />
            </CardSection>

            <CardSection title={t("creditLimitAdjustment.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("creditLimitAdjustment.otpVerified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("creditLimitAdjustment.sendVerifyOtp")}</Button>
              )}
            </CardSection>

            {direction === "increase" && (
              <CardSection title={t("creditLimitAdjustment.paymentMethod")} icon={CreditCard}>
                <div className="space-y-2">
                  <PayOption icon={CreditCard} label={t("activation.checkout.dealerWallet")} description={t("activation.checkout.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE })} selected={payMethod === "wallet"} onClick={() => setPayMethod("wallet")} />
                  <PayOption icon={HandCoins} label={t("activation.checkout.posTerminal")} description={t("activation.checkout.posTerminalDesc")} selected={payMethod === "pos"} onClick={() => setPayMethod("pos")} />
                </div>
              </CardSection>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueAdjust} onClick={() => setStep(1)}>
              {t("creditLimitAdjustment.continue")}
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
              {direction === "increase" ? t("creditLimitAdjustment.payAmountSar", { amount: delta }) : t("creditLimitAdjustment.confirmAdjustment")}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("creditLimitAdjustment.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("creditLimitAdjustment.otpIncorrect") : t("creditLimitAdjustment.otpSentViaSms")}
            </p>
            <div className="flex gap-2" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`credit-otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigitAt(i, e.target.value)}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 text-center text-base font-semibold focus:outline-none",
                    otpError ? "border-destructive text-destructive" : "border-border focus:border-primary text-foreground",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {otpError ? (
                <>
                  {t("creditLimitAdjustment.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("creditLimitAdjustment.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("creditLimitAdjustment.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("creditLimitAdjustment.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("creditLimitAdjustment.resend")}</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirm */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {direction === "increase" ? t("creditLimitAdjustment.confirmPaymentTitle") : t("creditLimitAdjustment.confirmAdjustment")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {direction === "increase"
                  ? t("creditLimitAdjustment.confirmPaymentDesc")
                  : t("creditLimitAdjustment.confirmAdjustmentDesc")}
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolvePayment}>{t("creditLimitAdjustment.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("creditLimitAdjustment.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => !o && (setSuccessOpen(false), resetAll(), navigate("/"))}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("creditLimitAdjustment.creditLimitUpdated")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {direction === "increase"
                ? t("creditLimitAdjustment.increasedTo", { limit: newLimit })
                : t("creditLimitAdjustment.decreasedTo", { limit: newLimit, delta: effectiveDelta })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("creditLimitAdjustment.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("creditLimitAdjustment.done")}
          </Button>
        </DrawerContent>
      </Drawer>

      {/* Failure */}
      <Drawer open={failureOpen} onOpenChange={setFailureOpen}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-destructive/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("creditLimitAdjustment.adjustmentFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("creditLimitAdjustment.adjustmentFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("creditLimitAdjustment.tryAgain")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => { setFailureOpen(false); }}
            >
              {t("creditLimitAdjustment.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default CreditLimitAdjustment;
