import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PayOption from "@/components/activation/PayOption";
import SimCard from "@/components/activation/SimCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDragScroll } from "@/hooks/useDragScroll";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import { VerifiedBanner } from "@/pages/NewActivation";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import WalletShortNotice from "@/components/WalletShortNotice";
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
  ArrowRight,
  X,
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

const DELTA_STEP = 25;
const DELTA_MIN = 25;
const DELTA_MAX = 200;
const AMOUNT_PRESETS = [25, 50, 75, 100, 125, 150, 175, 200];
// Option 3 (carousel): fixed slot width each amount occupies, incl. the gap to its neighbor —
// drives both the scroll-snap math and the padding that lets the first/last items center.
const AMOUNT_ITEM_WIDTH = 84;
const AMOUNT_ITEM_GAP = 20;
const AMOUNT_SLOT = AMOUNT_ITEM_WIDTH + AMOUNT_ITEM_GAP;

const CreditLimitAdjustment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { balance: DEALER_WALLET_BALANCE, justToppedUp } = useWalletBalance();
  const [searchParams] = useSearchParams();
  // Five separate Home entry points ("Option 1-5") land on this same flow, each fixed to
  // its own way of choosing the adjustment amount — a slider, a predefined-amount pill grid
  // (mirrors Friendi's PAYG top-up), a boxed swipeable carousel, a plain typographic wheel
  // picker paired with its own current→new limit summary, or a single increase-only slider
  // that replaces the increase/decrease toggle entirely. Not a toggle the dealer switches
  // mid-flow; which one they get depends on which tile they tapped.
  const optionParam = searchParams.get("option");
  const amountMode: "slider" | "preset" | "carousel" | "wheel" | "unified" =
    optionParam === "2" ? "preset" : optionParam === "3" ? "carousel" : optionParam === "4" ? "wheel" : optionParam === "5" ? "unified" : "slider";
  // Carousel, wheel, and the unified (Option 5) picker are the same swipeable-strip
  // mechanic underneath, just styled differently — every effect/handler that drives the
  // strip keys off this instead of repeating the check.
  const usesSwipeStrip = amountMode === "carousel" || amountMode === "wheel" || amountMode === "unified";

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
  // Top-right X, shown from stage 2 onward only — nothing to lose yet on stage 1.
  const [cancelOpen, setCancelOpen] = useState(false);
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
  // Can't decrease by more than the customer already has.
  const deltaMax = direction === "decrease" ? Math.max(DELTA_MIN, Math.min(DELTA_MAX, currentLimit)) : DELTA_MAX;

  // Options 1-4: reset the delta step whenever direction or customer changes, so it never
  // starts out-of-range. Option 5 is excluded — there direction is a side-effect of the
  // slider crossing zero, not a manual toggle, so resetting here on every flip would fight
  // the drag; it gets its own reset-on-lookup effect below instead.
  useEffect(() => {
    if (amountMode === "unified") return;
    setDelta(DELTA_STEP);
  }, [direction, customer, amountMode]);

  // Option 5 only: re-center the slider to zero whenever a new customer is looked up.
  useEffect(() => {
    if (amountMode !== "unified") return;
    setDelta(0);
    setDirection("increase");
  }, [customer, amountMode]);

  // ---------- Option 3/4: swipeable centered amount carousel (unsigned) ----------
  const carouselValues = useMemo(() => {
    const vals: number[] = [];
    for (let v = DELTA_MIN; v <= deltaMax; v += DELTA_STEP) vals.push(v);
    return vals;
  }, [deltaMax]);
  // ---------- Option 5: same strip, increase-only, starting from "no change" ----------
  const unifiedValues = useMemo(() => {
    const vals: number[] = [];
    for (let v = 0; v <= DELTA_MAX; v += DELTA_STEP) vals.push(v);
    return vals;
  }, []);
  const stripValues = amountMode === "unified" ? unifiedValues : carouselValues;
  const currentStripValue = delta;
  const carouselDrag = useDragScroll<HTMLDivElement>();
  const [carouselScroll, setCarouselScroll] = useState(0);

  // Re-center the strip on the current value whenever it becomes active or its value range
  // changes (direction flip) — instant jump, not an animated scroll, so it doesn't fight a
  // drag the dealer might already be mid-gesture on. `customer` is in the deps (not read
  // otherwise) because the strip <div> only exists in the DOM once a customer is looked up —
  // without it, this would only ever see a null ref from the pre-lookup render and never
  // retry once the element actually mounts. `step` is in the deps for the same reason on the
  // way back: step 0's JSX (and the strip along with it) unmounts while on step 1, so
  // returning to step 0 mounts a brand-new <div> whose native scrollLeft starts at 0 — without
  // `step` here, that remount wouldn't re-trigger this effect and the strip would render at
  // its default position even though `delta`/`direction` themselves were never actually lost.
  useEffect(() => {
    if (!usesSwipeStrip) return;
    const el = carouselDrag.ref.current;
    if (!el) return;
    const idx = Math.max(0, stripValues.indexOf(currentStripValue));
    el.scrollLeft = idx * AMOUNT_SLOT;
    setCarouselScroll(idx * AMOUNT_SLOT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usesSwipeStrip, stripValues, customer, step]);

  // Snaps to the nearest value a beat after the strip stops moving (covers both a drag
  // release and momentum scrolling), rather than reading delta off every scroll frame.
  // `carouselDrag.ref` is a stable useRef object (never changes identity), so it does
  // nothing to trigger a re-run on its own — `step` is what actually gets this listener
  // re-attached to the fresh <div> after leaving and returning to step 0. Without it, a
  // drag after coming back moves the strip (native scrolling still works) but never
  // commits a new delta, since the listener was never re-attached to the new element.
  useEffect(() => {
    if (!usesSwipeStrip) return;
    const el = carouselDrag.ref.current;
    if (!el) return;
    let settleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      requestAnimationFrame(() => setCarouselScroll(el.scrollLeft));
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        const idx = Math.max(0, Math.min(stripValues.length - 1, Math.round(el.scrollLeft / AMOUNT_SLOT)));
        setDelta(stripValues[idx]);
      }, 100);
    };
    el.addEventListener("scroll", onScroll);
    return () => { el.removeEventListener("scroll", onScroll); clearTimeout(settleTimer); };
  }, [usesSwipeStrip, stripValues, carouselDrag.ref, customer, step]);

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
  const walletShort = direction === "increase" && delta > DEALER_WALLET_BALANCE;
  const canConfirm = otpVerified && !(payMethod === "wallet" && walletShort);

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

  // Shared between all options — Option 5 renders it right after Customer Details instead
  // of after the amount picker, per the client's requested layout.
  const limitSummaryCard = (
    <div className="bg-card rounded-2xl p-4 shadow-sm flex items-center justify-center gap-4">
      <div className="text-center">
        <p className="text-xl font-bold text-foreground"><RiyalSymbol className="text-base" /> {currentLimit.toFixed(0)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{t("creditLimitAdjustment.yourCurrentLimit")}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <ArrowRight className="w-4 h-4 text-foreground rtl:rotate-180" />
      </div>
      <div className="text-center">
        <p className={cn("text-xl font-bold", direction === "increase" ? "value-positive" : "value-negative")}>
          <RiyalSymbol className="text-base" /> {newLimit.toFixed(0)}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">{t("creditLimitAdjustment.yourNewLimit")}</p>
      </div>
    </div>
  );

  // Hidden per UX decision: a 2-stage stepper adds chrome without adding real progress info.
  // Kept in source in case we want it back — just uncomment the FlowStepper line below.
  const steps = [
    { label: "Adjust", Icon: TrendingUp },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("creditLimitAdjustment.title")}
        showBack
        onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))}
        rightElement={
          step > 0 ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      {/* <FlowStepper current={step} steps={steps} /> */}

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup + Adjust (merged) ── */}
        {step === 0 && (
          <>
            <Field label={t("creditLimitAdjustment.msisdn")}>
              <div className="flex gap-2">
                <PhoneNumberInput
                  value={msisdn}
                  onChange={(v) => { setMsisdn(v); setCustomer(null); setLookupError(null); }}
                  icon={<Phone className="w-4 h-4" />}
                  className="flex-1"
                />
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
                {amountMode === "unified" && limitSummaryCard}

            {amountMode !== "unified" && (
              <div className="flex gap-3">
                {([
                  { value: "increase" as const, label: t("creditLimitAdjustment.increase"), Icon: TrendingUp },
                  { value: "decrease" as const, label: t("creditLimitAdjustment.decrease"), Icon: TrendingDown },
                ]).map(({ value, label, Icon }) => (
                  <SimCard key={value} active={direction === value} label={label} icon={Icon} onClick={() => setDirection(value)} />
                ))}
              </div>
            )}

            <CardSection title={t("creditLimitAdjustment.adjustmentAmount")} icon={direction === "increase" ? TrendingUp : TrendingDown}>
              {amountMode !== "wheel" && amountMode !== "unified" && (
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold text-foreground">
                    <RiyalSymbol className="text-lg" /> {delta.toFixed(2)}
                  </span>
                </div>
              )}

              {amountMode === "slider" ? (
                <div className="space-y-2">
                  <Slider
                    value={[delta]}
                    min={DELTA_MIN}
                    max={deltaMax}
                    step={DELTA_STEP}
                    onValueChange={([v]) => setDelta(v)}
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span><RiyalSymbol /> {DELTA_MIN.toFixed(2)}</span>
                    <span><RiyalSymbol /> {deltaMax.toFixed(2)}</span>
                  </div>
                </div>
              ) : amountMode === "carousel" ? (
                <div className="relative -mx-4">
                  {/* Center selection window — purely visual, sits behind the strip */}
                  <div
                    className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-primary/40 bg-primary/5"
                    style={{ width: AMOUNT_ITEM_WIDTH, height: 56 }}
                  />
                  <div
                    ref={carouselDrag.ref}
                    onMouseDown={carouselDrag.onMouseDown}
                    onMouseUp={carouselDrag.onMouseUp}
                    onMouseLeave={carouselDrag.onMouseLeave}
                    onMouseMove={carouselDrag.onMouseMove}
                    onClickCapture={carouselDrag.onClickCapture}
                    className={cn("relative flex items-center overflow-x-auto no-scrollbar", carouselDrag.className)}
                    style={{
                      height: 72,
                      gap: AMOUNT_ITEM_GAP,
                      scrollSnapType: "x mandatory",
                      paddingInline: `calc(50% - ${AMOUNT_ITEM_WIDTH / 2}px)`,
                    }}
                  >
                    {carouselValues.map((v, i) => {
                      const dist = Math.abs(i * AMOUNT_SLOT - carouselScroll) / AMOUNT_SLOT;
                      const opacity = Math.max(0.25, 1 - dist * 0.5);
                      const scale = Math.max(0.72, 1 - dist * 0.2);
                      return (
                        <div
                          key={v}
                          style={{ width: AMOUNT_ITEM_WIDTH, scrollSnapAlign: "center", opacity, transform: `scale(${scale})` }}
                          className="shrink-0 flex items-center justify-center h-full"
                        >
                          <span className="text-base font-bold text-foreground whitespace-nowrap">
                            <RiyalSymbol className="text-sm" /> {v.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : amountMode === "wheel" ? (
                <div>
                  <div
                    ref={carouselDrag.ref}
                    onMouseDown={carouselDrag.onMouseDown}
                    onMouseUp={carouselDrag.onMouseUp}
                    onMouseLeave={carouselDrag.onMouseLeave}
                    onMouseMove={carouselDrag.onMouseMove}
                    onClickCapture={carouselDrag.onClickCapture}
                    className={cn("relative -mx-4 flex items-center overflow-x-auto no-scrollbar", carouselDrag.className)}
                    style={{
                      height: 56,
                      gap: AMOUNT_ITEM_GAP,
                      scrollSnapType: "x mandatory",
                      paddingInline: `calc(50% - ${AMOUNT_ITEM_WIDTH / 2}px)`,
                    }}
                  >
                    {carouselValues.map((v, i) => {
                      const dist = Math.abs(i * AMOUNT_SLOT - carouselScroll) / AMOUNT_SLOT;
                      const isCenter = dist < 0.5;
                      const opacity = Math.max(0.3, 1 - dist * 0.45);
                      return (
                        <div
                          key={v}
                          style={{ width: AMOUNT_ITEM_WIDTH, scrollSnapAlign: "center", opacity }}
                          className="shrink-0 flex flex-col items-center justify-center h-full gap-1"
                        >
                          <span className="flex items-center gap-1">
                            <RiyalSymbol className={isCenter ? "text-foreground" : "text-muted-foreground"} />
                            <span className={cn(
                              "font-bold whitespace-nowrap transition-all",
                              isCenter ? "text-2xl text-foreground" : "text-lg text-muted-foreground"
                            )}>
                              {v.toFixed(0)}
                            </span>
                          </span>
                          <span className={cn("w-6 h-0.5 rounded-full", isCenter ? "bg-primary" : "bg-transparent")} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : amountMode === "unified" ? (
                <div className="space-y-2">
                  {/* dir="ltr" keeps the strip's low→high order stable regardless of app
                      language — native scroll containers can otherwise reverse their
                      scrollLeft convention under the Arabic rtl dir. */}
                  <div
                    ref={carouselDrag.ref}
                    dir="ltr"
                    onMouseDown={carouselDrag.onMouseDown}
                    onMouseUp={carouselDrag.onMouseUp}
                    onMouseLeave={carouselDrag.onMouseLeave}
                    onMouseMove={carouselDrag.onMouseMove}
                    onClickCapture={carouselDrag.onClickCapture}
                    className={cn("relative -mx-4 flex items-center overflow-x-auto no-scrollbar", carouselDrag.className)}
                    style={{
                      height: 56,
                      gap: AMOUNT_ITEM_GAP,
                      scrollSnapType: "x mandatory",
                      paddingInline: `calc(50% - ${AMOUNT_ITEM_WIDTH / 2}px)`,
                    }}
                  >
                    {unifiedValues.map((v, i) => {
                      const dist = Math.abs(i * AMOUNT_SLOT - carouselScroll) / AMOUNT_SLOT;
                      const isCenter = dist < 0.5;
                      const opacity = Math.max(0.3, 1 - dist * 0.45);
                      const tone = v === 0 ? "text-foreground" : "value-positive";
                      return (
                        <div
                          key={v}
                          style={{ width: AMOUNT_ITEM_WIDTH, scrollSnapAlign: "center", opacity }}
                          className="shrink-0 flex flex-col items-center justify-center h-full gap-1"
                        >
                          <span className="flex items-center gap-1">
                            <span className={cn(
                              "font-bold whitespace-nowrap transition-all flex items-center gap-0.5",
                              isCenter ? cn("text-2xl", tone) : "text-lg text-muted-foreground"
                            )}>
                              {v !== 0 && "+"}<RiyalSymbol className={isCenter ? undefined : "text-muted-foreground"} /> {v.toFixed(0)}
                            </span>
                          </span>
                          <span className={cn("w-6 h-0.5 rounded-full", isCenter ? "bg-primary" : "bg-transparent")} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {AMOUNT_PRESETS.filter((amt) => amt <= deltaMax).map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDelta(amt)}
                      className={cn(
                        "py-2 rounded-full text-[11px] font-medium border transition-colors flex items-center justify-center gap-0.5",
                        delta === amt ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground"
                      )}
                    >
                      <RiyalSymbol /> {amt.toFixed(2)}
                    </button>
                  ))}
                </div>
              )}
            </CardSection>

            {amountMode !== "unified" && limitSummaryCard}

            {direction === "increase" ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500/20 px-4 py-3 flex items-start gap-3">
                <HandCoins className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-sky-700 dark:text-sky-300 leading-snug">
                  {t("creditLimitAdjustment.increaseNote", { delta: delta.toFixed(2) })}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-3">
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-emerald-700 dark:text-emerald-300 leading-snug">
                  {t("creditLimitAdjustment.decreaseNote", { delta: effectiveDelta.toFixed(2) })}
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
              <SummaryRow label={t("creditLimitAdjustment.currentLimit")} value={<><RiyalSymbol /> {currentLimit.toFixed(2)}</>} />
              <SummaryRow label={t("creditLimitAdjustment.newLimit")} value={<><RiyalSymbol /> {newLimit.toFixed(2)}</>} />
            </CardSection>

            {direction === "increase" && (
              <CardSection title={t("creditLimitAdjustment.paymentMethod")} icon={CreditCard}>
                <div className="space-y-2">
                  <PayOption icon={CreditCard} label={t("activation.checkout.dealerWallet")} description={t("activation.checkout.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE.toFixed(2) })} selected={payMethod === "wallet"} disabled={walletShort} justToppedUp={justToppedUp} onClick={() => setPayMethod("wallet")}>
                    {walletShort && (
                      <WalletShortNotice
                        message={t("creditLimitAdjustment.walletShort", { amount: (delta - DEALER_WALLET_BALANCE).toFixed(2) })}
                        buttonLabel={t("creditLimitAdjustment.topUpWallet")}
                      />
                    )}
                  </PayOption>
                  <PayOption icon={HandCoins} label={t("activation.checkout.posTerminal")} description={t("activation.checkout.posTerminalDesc")} selected={payMethod === "pos"} onClick={() => setPayMethod("pos")} />
                </div>
              </CardSection>
            )}

            <CardSection title={t("creditLimitAdjustment.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("creditLimitAdjustment.otpVerified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("creditLimitAdjustment.sendVerifyOtp")}</Button>
              )}
            </CardSection>
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
              {direction === "increase" ? <>{t("creditLimitAdjustment.pay")} <RiyalSymbol /> {delta.toFixed(2)}</> : t("creditLimitAdjustment.confirmAdjustment")}
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

      {/* Cancel flow (top-right X) */}
      <Drawer open={cancelOpen} onOpenChange={setCancelOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("creditLimitAdjustment.cancelFlowTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("creditLimitAdjustment.cancelFlowDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setCancelOpen(false); resetAll(); navigate("/"); }}>{t("creditLimitAdjustment.yesCancelFlow")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setCancelOpen(false)}>{t("creditLimitAdjustment.keepEditing")}</button>
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
                ? t("creditLimitAdjustment.increasedTo", { limit: newLimit.toFixed(2) })
                : t("creditLimitAdjustment.decreasedTo", { limit: newLimit.toFixed(2), delta: effectiveDelta.toFixed(2) })}
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
