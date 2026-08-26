import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PlanSelector, { Plan } from "@/components/activation/PlanSelector";
import PayOption from "@/components/activation/PayOption";
import PlanCard from "@/components/PlanCard";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import { PREPAID_PLANS, FRIENDI_PLANS, VerifiedBanner } from "@/pages/NewActivation";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import WalletShortNotice from "@/components/WalletShortNotice";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Receipt,
  Wallet,
  CreditCard,
  AlertCircle,
  Check,
  XCircle,
  Phone,
  Search,
  Gauge,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCw,
} from "lucide-react";
import RiyalSymbol from "@/components/RiyalSymbol";

// ---------- Local UI primitives (mirrors SubscriptionMigration.tsx's page-local helpers) ----------
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
interface DemoConsumption {
  dataUsedGB: number;
  /** null = unlimited — no progress bar, just the label. */
  dataTotalGB: number | null;
  minsUsed: number;
  /** null = unlimited — no progress bar, just the label. */
  minsTotal: number | null;
  validUntil: string;
}

interface DemoPrepaidLine {
  msisdn: string;
  status: "active" | "terminated";
  subscriptionType: "prepaid" | "postpaid";
  lineType: "mobile" | "mbb";
  planName: string;
  consumption: DemoConsumption;
}

const DEMO_PREPAID_LINES: DemoPrepaidLine[] = [
  { msisdn: "0501234567", status: "active", subscriptionType: "prepaid", lineType: "mobile", planName: "Baqah 100", consumption: { dataUsedGB: 22, dataTotalGB: 40, minsUsed: 310, minsTotal: 750, validUntil: "20 Sep 2026" } },
  { msisdn: "0501234599", status: "active", subscriptionType: "prepaid", lineType: "mobile", planName: "Virgin Mobile Aman 60", consumption: { dataUsedGB: 4, dataTotalGB: 10, minsUsed: 30, minsTotal: 100, validUntil: "12 Sep 2026" } },
  { msisdn: "0501234512", status: "active", subscriptionType: "prepaid", lineType: "mobile", planName: "Baqah Flex 100", consumption: { dataUsedGB: 12, dataTotalGB: 35, minsUsed: 500, minsTotal: 1000, validUntil: "5 Sep 2026" } },
  { msisdn: "0501234580", status: "active", subscriptionType: "prepaid", lineType: "mbb", planName: "100 GB", consumption: { dataUsedGB: 61, dataTotalGB: 100, minsUsed: 0, minsTotal: null, validUntil: "2 Oct 2026" } },
  // Friendi demo lines — same MSISDN space, only meaningful when the active brand is Friendi.
  { msisdn: "0501234544", status: "active", subscriptionType: "prepaid", lineType: "mobile", planName: "Bundleha 45GB", consumption: { dataUsedGB: 20, dataTotalGB: 45, minsUsed: 0, minsTotal: null, validUntil: "18 Sep 2026" } },
  { msisdn: "0501234555", status: "active", subscriptionType: "prepaid", lineType: "mbb", planName: "Internet 100 GB", consumption: { dataUsedGB: 40, dataTotalGB: 100, minsUsed: 0, minsTotal: null, validUntil: "22 Sep 2026" } },
  { msisdn: "0501234533", status: "terminated", subscriptionType: "prepaid", lineType: "mobile", planName: "Baqah 150", consumption: { dataUsedGB: 0, dataTotalGB: 55, minsUsed: 0, minsTotal: null, validUntil: "—" } },
  { msisdn: "0502234567", status: "active", subscriptionType: "postpaid", lineType: "mobile", planName: "Switch Postpaid 150", consumption: { dataUsedGB: 0, dataTotalGB: null, minsUsed: 0, minsTotal: null, validUntil: "—" } },
];

const PrepaidChangeBundle = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { brand } = useBrand();
  const isFriendi = brand === "friendi";
  const { balance: DEALER_WALLET_BALANCE, justToppedUp } = useWalletBalance();

  const CATEGORY_LABEL: Record<string, string> = {
    aman: t("prepaidChangeBundle.categoryAman"),
    "base-plan": t("prepaidChangeBundle.categoryBaqah"),
    flex: t("prepaidChangeBundle.categoryBaqahFlex"),
    data: t("prepaidChangeBundle.category5gMbb"),
    combo: t("prepaidChangeBundle.categoryCombo"),
    flexi: t("prepaidChangeBundle.categoryFlexi"),
  };

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  const [msisdn, setMsisdn] = useState("0501234567");
  const [checking, setChecking] = useState(false);
  const [line, setLine] = useState<DemoPrepaidLine | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [planSearch, setPlanSearch] = useState("");
  const [planTypeChip, setPlanTypeChip] = useState("all");

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

  // ---------- MSISDN auto-lookup (mirrors SubscriptionMigration's debounced lookup) ----------
  useEffect(() => {
    setLine(null);
    setLookupError(null);
    setSelectedPlan(null);
    setPlanTypeChip("all");
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_PREPAID_LINES.find((l) => l.msisdn === msisdn);
      if (!found) {
        setLookupError(t("prepaidChangeBundle.lookupErrorNotFound"));
        return;
      }
      if (found.subscriptionType !== "prepaid") {
        setLookupError(t("prepaidChangeBundle.lookupErrorNotPrepaid"));
        return;
      }
      if (found.status === "terminated") {
        setLookupError(t("prepaidChangeBundle.lookupErrorTerminated"));
        return;
      }
      setLine(found);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn]);

  const eligible = !!line && !lookupError;

  // ---------- Plan catalogue ----------
  const planCatalog = isFriendi ? FRIENDI_PLANS : PREPAID_PLANS;
  const MOBILE_PREPAID_CATEGORIES = isFriendi ? ["combo", "flexi"] : ["aman", "base-plan", "flex"];
  const planList: Plan[] =
    line?.lineType === "mbb"
      ? planCatalog.filter((p) => p.categories.includes("data"))
      : planCatalog.filter((p) => p.categories.some((c) => MOBILE_PREPAID_CATEGORIES.includes(c)));
  const selectedPlanObj = selectedPlan != null ? planList[selectedPlan] : undefined;
  const currentPlanObj = line ? planCatalog.find((p) => p.title === line.planName) : undefined;

  const changeType: "upgrade" | "downgrade" | "renew" | null =
    !currentPlanObj || !selectedPlanObj
      ? null
      : selectedPlanObj.title === currentPlanObj.title
      ? "renew"
      : selectedPlanObj.price < currentPlanObj.price
      ? "downgrade"
      : "upgrade";

  const layoutFor = (categories: string[] = []) =>
    categories.includes("switch-postpaid") ? "postpaid" as const
    : categories.includes("combo") ? "combo" as const
    : categories.includes("flexi") ? "combo" as const
    : categories.includes("aman") ? "aman" as const
    : categories.includes("base-plan") ? "baqa" as const
    : "flex" as const;

  // ---------- Pricing — full plan price + VAT, no deposit/proration ----------
  const planPrice = selectedPlanObj?.price ?? 0;
  const vat = Math.round(planPrice * 0.15 * 100) / 100;
  const total = Math.round((planPrice + vat) * 100) / 100;
  const walletShort = total > DEALER_WALLET_BALANCE;

  // ---------- OTP handlers (same behavior as SubscriptionMigration's checkout OTP) ----------
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
      const el = document.getElementById(`prepaid-change-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("prepaid-change-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  const canContinueNumber = eligible;
  const canContinuePlan = selectedPlan != null;
  const canPay = otpVerified && !(payMethod === "wallet" && walletShort);

  const resolvePayment = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`PCB-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMsisdn("0501234567");
    setLine(null);
    setLookupError(null);
    setSelectedPlan(null);
    setPlanSearch("");
    setPlanTypeChip("all");
    setOtpVerified(false);
    setPayMethod("wallet");
  };

  const steps = [
    { label: t("prepaidChangeBundle.stepNumber", "Number"), Icon: Phone },
    { label: t("prepaidChangeBundle.stepPlan", "Plan"), Icon: Receipt },
    { label: t("prepaidChangeBundle.stepCheckout", "Checkout"), Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("prepaidChangeBundle.title")}
        showBack
        onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))}
      />
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Number ── */}
        {step === 0 && (
          <>
            <Field label={t("prepaidChangeBundle.msisdn")}>
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} icon={<Phone className="w-4 h-4" />} />
              {checking && <p className="text-[11px] text-muted-foreground">{t("prepaidChangeBundle.checkingNumber")}</p>}
            </Field>

            <PrototypeTestBox
              heading={t("prepaidChangeBundle.testNumbersHeading")}
              description={t("prepaidChangeBundle.testNumbersDescription")}
              items={[
                { value: "0501234567", note: t("prepaidChangeBundle.testNoteMobilePrepaid"), group: t("prepaidChangeBundle.testGroupValid") },
                { value: "0501234580", note: t("prepaidChangeBundle.testNoteMbb"), group: t("prepaidChangeBundle.testGroupValid") },
                { value: "0501234544", note: t("prepaidChangeBundle.testNoteFriendiCombo"), group: t("prepaidChangeBundle.testGroupValid") },
                { value: "0501234533", note: t("prepaidChangeBundle.testNoteTerminated"), group: t("prepaidChangeBundle.testGroupErrors") },
                { value: "0502234567", note: t("prepaidChangeBundle.testNoteNotPrepaid"), group: t("prepaidChangeBundle.testGroupErrors") },
                { value: "0509999999", note: t("prepaidChangeBundle.testNoteNotFound"), group: t("prepaidChangeBundle.testGroupErrors") },
              ]}
              onSelect={setMsisdn}
            />
          </>
        )}

        {/* ── Step 1: Plan ── */}
        {step === 1 && (
          <>
            {currentPlanObj && (
              <div>
                <div className="flex items-center justify-between gap-2 px-1 mb-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">{t("prepaidChangeBundle.currentPlan")}</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                    <ClipboardList className="w-3 h-3" />
                    {line?.lineType === "mbb" ? t("prepaidChangeBundle.category5gMbb") : t("prepaidChangeBundle.mobilePrepaid")} · {currentPlanObj.title}
                  </span>
                </div>
                <PlanCard
                  plan={{ ...currentPlanObj, badge: undefined }}
                  selected
                  active
                  onSelect={() => {}}
                  hideRadio
                  layout={layoutFor(currentPlanObj.categories)}
                />
              </div>
            )}

            <h3 className="text-sm font-semibold text-foreground px-1">
              {line?.lineType === "mbb" ? t("prepaidChangeBundle.availableMbbPlans") : t("prepaidChangeBundle.availableMobilePlans")}
            </h3>

            {line?.lineType === "mobile" && (
              <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(isFriendi
                  ? [
                      { value: "all", label: t("prepaidChangeBundle.chipAll") },
                      { value: "combo", label: t("prepaidChangeBundle.categoryCombo") },
                      { value: "flexi", label: t("prepaidChangeBundle.categoryFlexi") },
                    ]
                  : [
                      { value: "all", label: t("prepaidChangeBundle.chipAll") },
                      { value: "aman", label: t("prepaidChangeBundle.categoryAman") },
                      { value: "base-plan", label: t("prepaidChangeBundle.categoryBaqah") },
                      { value: "flex", label: t("prepaidChangeBundle.categoryBaqahFlex") },
                    ]
                ).map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => {
                      setPlanTypeChip(chip.value);
                      setSelectedPlan(null);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors",
                      planTypeChip === chip.value ? "bg-primary text-white" : "bg-card text-foreground shadow-sm",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={planSearch}
                onChange={(e) => setPlanSearch(e.target.value)}
                placeholder={t("prepaidChangeBundle.searchPlans")}
                className="h-11 bg-card rounded-xl ps-9"
              />
            </div>

            <PlanSelector
              key={`${brand}-${line?.lineType}-${planTypeChip}`}
              plans={planList}
              selectedPlan={selectedPlan}
              onSelect={(idx) => setSelectedPlan(idx)}
              categoryFilter={line?.lineType === "mobile" ? planTypeChip : undefined}
              searchQuery={planSearch}
            />

            {changeType && (
              <div className="flex justify-center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                    changeType === "upgrade" && "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
                    changeType === "downgrade" && "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
                    changeType === "renew" && "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
                  )}
                >
                  {changeType === "upgrade" && <ArrowUpCircle className="w-3.5 h-3.5" />}
                  {changeType === "downgrade" && <ArrowDownCircle className="w-3.5 h-3.5" />}
                  {changeType === "renew" && <RotateCw className="w-3.5 h-3.5" />}
                  {t(`prepaidChangeBundle.changeType${changeType[0].toUpperCase()}${changeType.slice(1)}`)}
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && (
          <>
            <CardSection title={t("prepaidChangeBundle.planChangeSummary")} icon={ClipboardList}>
              <SummaryRow label={t("prepaidChangeBundle.msisdn")} value={line?.msisdn ?? t("prepaidChangeBundle.dash")} />
              <SummaryRow label={t("prepaidChangeBundle.currentPlan")} value={currentPlanObj?.title ?? t("prepaidChangeBundle.dash")} />
              <SummaryRow label={t("prepaidChangeBundle.newPlan")} value={selectedPlanObj?.title ?? t("prepaidChangeBundle.dash")} />
              <SummaryRow
                label={t("prepaidChangeBundle.changeType")}
                value={changeType ? t(`prepaidChangeBundle.changeType${changeType[0].toUpperCase()}${changeType.slice(1)}`) : t("prepaidChangeBundle.dash")}
              />
            </CardSection>

            <CardSection title={t("prepaidChangeBundle.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("prepaidChangeBundle.verified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>
                  {t("prepaidChangeBundle.sendVerifyOtp")}
                </Button>
              )}
            </CardSection>

            {line && (
              <CardSection title={t("prepaidChangeBundle.currentConsumption")} icon={Gauge}>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{t("prepaidChangeBundle.dataUsedLabel")}</span>
                      <span className="font-semibold text-foreground">
                        {line.consumption.dataTotalGB == null
                          ? t("prepaidChangeBundle.unlimited")
                          : `${line.consumption.dataUsedGB} / ${line.consumption.dataTotalGB} GB`}
                      </span>
                    </div>
                    {line.consumption.dataTotalGB != null && (
                      <Progress value={Math.min(100, Math.round((line.consumption.dataUsedGB / line.consumption.dataTotalGB) * 100))} className="h-2" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{t("prepaidChangeBundle.minutesUsedLabel")}</span>
                      <span className="font-semibold text-foreground">
                        {line.consumption.minsTotal == null
                          ? t("prepaidChangeBundle.unlimited")
                          : `${line.consumption.minsUsed} / ${line.consumption.minsTotal} ${t("prepaidChangeBundle.min")}`}
                      </span>
                    </div>
                    {line.consumption.minsTotal != null && (
                      <Progress value={Math.min(100, Math.round((line.consumption.minsUsed / line.consumption.minsTotal) * 100))} className="h-2" />
                    )}
                  </div>
                  <SummaryRow label={t("prepaidChangeBundle.validUntil")} value={line.consumption.validUntil} />
                </div>
              </CardSection>
            )}

            <CardSection title={t("prepaidChangeBundle.paymentSummary")} icon={Receipt}>
              <div className="space-y-2 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{t("prepaidChangeBundle.plan")}</span>
                  <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {planPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{t("prepaidChangeBundle.vat")}</span>
                  <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {vat.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-sm font-semibold text-foreground">{t("prepaidChangeBundle.total")}</span>
                <span className="text-base font-bold text-primary"><RiyalSymbol /> {total.toFixed(2)}</span>
              </div>
            </CardSection>

            <CardSection title={t("prepaidChangeBundle.paymentMethod")} icon={CreditCard}>
              <div className="space-y-2">
                <PayOption
                  icon={Wallet}
                  label={t("prepaidChangeBundle.dealerWallet")}
                  description={t("prepaidChangeBundle.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE.toFixed(2) })}
                  selected={payMethod === "wallet"}
                  disabled={walletShort}
                  justToppedUp={justToppedUp}
                  onClick={() => setPayMethod("wallet")}
                >
                  {walletShort && (
                    <WalletShortNotice
                      message={t("prepaidChangeBundle.walletShort", { amount: (total - DEALER_WALLET_BALANCE).toFixed(2) })}
                      buttonLabel={t("prepaidChangeBundle.topUpWallet")}
                    />
                  )}
                </PayOption>
                <PayOption
                  icon={CreditCard}
                  label={t("prepaidChangeBundle.posTerminal")}
                  description={t("prepaidChangeBundle.posTerminalDesc")}
                  selected={payMethod === "pos"}
                  onClick={() => setPayMethod("pos")}
                />
              </div>
            </CardSection>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <Button
              className="w-full h-12 text-sm font-semibold rounded-full"
              disabled={step === 0 ? !canContinueNumber : !canContinuePlan}
              onClick={() => setStep((s) => s + 1)}
            >
              {t("prepaidChangeBundle.continue")}
            </Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setConfirmOpen(true)}>
              {t("prepaidChangeBundle.pay")} <RiyalSymbol /> {total.toFixed(2)}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("prepaidChangeBundle.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("prepaidChangeBundle.otpIncorrect") : t("prepaidChangeBundle.otpSentViaSms")}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`prepaid-change-otp-${i}`}
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
                  {t("prepaidChangeBundle.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("prepaidChangeBundle.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("prepaidChangeBundle.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("prepaidChangeBundle.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("prepaidChangeBundle.resend")}</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirm Payment — lose-benefits warning, per the client's spec copy */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("prepaidChangeBundle.confirmTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("prepaidChangeBundle.confirmDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolvePayment}>{t("prepaidChangeBundle.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("prepaidChangeBundle.cancel")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("prepaidChangeBundle.changeSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("prepaidChangeBundle.appliedImmediately")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("prepaidChangeBundle.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}>
            {t("prepaidChangeBundle.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("prepaidChangeBundle.changeFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("prepaidChangeBundle.changeFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("prepaidChangeBundle.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setFailureOpen(false)}>
              {t("prepaidChangeBundle.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Lookup error — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => { if (!o) setLookupError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("prepaidChangeBundle.lookupErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button
            onClick={() => setLookupError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("prepaidChangeBundle.gotIt")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrepaidChangeBundle;
