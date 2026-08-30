import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PlanSelector, { Plan } from "@/components/activation/PlanSelector";
import PayOption from "@/components/activation/PayOption";
import PlanCard from "@/components/PlanCard";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import { POSTPAID_PLANS, VerifiedBanner, ID_TYPE_ORDER, ID_TYPE_RULES } from "@/pages/NewActivation";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import WalletShortNotice from "@/components/WalletShortNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronRight,
  X,
} from "lucide-react";
import RiyalSymbol from "@/components/RiyalSymbol";

// ---------- Local UI primitives (mirrors ChangePrepaidBundle.tsx's page-local helpers) ----------
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
interface DemoPostpaidLine {
  msisdn: string;
  status: "active" | "terminated";
  subscriptionType: "prepaid" | "postpaid";
  planName: string;
}

const DEMO_POSTPAID_LINES: DemoPostpaidLine[] = [
  { msisdn: "0503334444", status: "active", subscriptionType: "postpaid", planName: "Switch Postpaid 150" },
  { msisdn: "0503334455", status: "active", subscriptionType: "postpaid", planName: "Switch Postpaid 120" },
  { msisdn: "0503334466", status: "active", subscriptionType: "postpaid", planName: "Switch Postpaid 365" },
  { msisdn: "0503334477", status: "terminated", subscriptionType: "postpaid", planName: "Switch Postpaid 150" },
  { msisdn: "0503334488", status: "active", subscriptionType: "prepaid", planName: "Baqah 150" },
];

const SWITCH_POSTPAID_PLANS: Plan[] = POSTPAID_PLANS.filter((p) => p.categories.includes("switch-postpaid"));

// Only Saudi National ID, Iqama ID and Premium Residency support postpaid (same business
// rule NewActivation.tsx applies via ID_TYPE_RULES[...].postpaidAllowed) — this flow deals
// exclusively with postpaid lines, so the other six ID types are never offered.
const POSTPAID_ID_TYPES = ID_TYPE_ORDER.filter((key) => ID_TYPE_RULES[key].postpaidAllowed);

// Demo ID number — the leading digit adapts to the selected ID Type's start-digit rule
// (mirrors SubscriptionMigration.tsx's demoIdFor) so the prototype hint is always valid.
const DEMO_ID_SUFFIX = "324567896";
const demoIdFor = (rule: { startDigits?: string[] } | undefined) => (rule?.startDigits?.[0] ?? "1") + DEMO_ID_SUFFIX;

const ChangePostpaidPlan = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { balance: DEALER_WALLET_BALANCE, justToppedUp } = useWalletBalance();

  // Plain-English labels for the shared ID_TYPE_RULES keys — translated via changePostpaidPlan.idType_*
  const ID_TYPE_LABELS: Record<string, string> = {
    saudiId: t("changePostpaidPlan.idType_saudiId"),
    iqamaId: t("changePostpaidPlan.idType_iqamaId"),
    premiumResidency: t("changePostpaidPlan.idType_premiumResidency"),
  };
  const ID_FIELD_LABELS: Record<string, string> = {
    idNumber: t("changePostpaidPlan.idField_idNumber"),
  };

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  const [idType, setIdType] = useState("saudi-id");
  const [idNumber, setIdNumber] = useState("1324567896");
  const [nationality, setNationality] = useState("sa");
  const [msisdn, setMsisdn] = useState("0503334444");
  const [checking, setChecking] = useState(false);
  const [line, setLine] = useState<DemoPostpaidLine | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [planSearch, setPlanSearch] = useState("");

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

  // ---------- MSISDN auto-lookup (mirrors Prepaid Change Bundle / Subscription Migration) ----------
  useEffect(() => {
    setLine(null);
    setLookupError(null);
    setSelectedPlan(null);
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_POSTPAID_LINES.find((l) => l.msisdn === msisdn);
      if (!found) {
        setLookupError(t("changePostpaidPlan.lookupErrorNotFound"));
        return;
      }
      if (found.subscriptionType !== "postpaid") {
        setLookupError(t("changePostpaidPlan.lookupErrorNotPostpaid"));
        return;
      }
      if (found.status === "terminated") {
        setLookupError(t("changePostpaidPlan.lookupErrorTerminated"));
        return;
      }
      setLine(found);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn]);

  const eligible = !!line && !lookupError;

  // ID Number must match the selected ID Type's full rule (start digit(s) + exact length),
  // enforced silently — same as SubscriptionMigration.tsx's Identity step.
  const idNumberRule = ID_TYPE_RULES[idType];
  const idNumberValid = (() => {
    const v = idNumber.trim();
    if (v.length === 0) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();

  const planList = SWITCH_POSTPAID_PLANS;
  const selectedPlanObj = selectedPlan != null ? planList[selectedPlan] : undefined;
  const currentPlanObj = line ? planList.find((p) => p.title === line.planName) : undefined;

  // Picking up a selection made on the "View all plans" page — same round trip as Prepaid
  // Change Bundle / Subscription Migration's own AllPlans pages.
  const [pendingPlanPick, setPendingPlanPick] = useState<string | null>(null);
  useEffect(() => {
    const state = location.state as { pickPlan?: { msisdn: string; title: string } } | null;
    const pick = state?.pickPlan;
    if (!pick) return;
    setMsisdn(pick.msisdn);
    setPendingPlanPick(pick.title);
    setStep(1);
    navigate(location.pathname + location.search, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    if (!pendingPlanPick || !line) return;
    const idx = planList.findIndex((p) => p.title === pendingPlanPick);
    setSelectedPlan(idx >= 0 ? idx : null);
    setPendingPlanPick(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPlanPick, line]);

  // Same plan can't be selected at all — only a genuine upgrade or downgrade is offered.
  const onSelectPlan = (idx: number, plan: Plan) => {
    if (currentPlanObj && plan.title === currentPlanObj.title) return;
    setSelectedPlan(idx);
  };

  const changeType: "upgrade" | "downgrade" | null =
    !currentPlanObj || !selectedPlanObj
      ? null
      : selectedPlanObj.price > currentPlanObj.price
      ? "upgrade"
      : "downgrade";

  // ---------- Pricing — deposit fee is the plan price difference, no VAT, upgrade only ----------
  const priceDiff = Math.round(((selectedPlanObj?.price ?? 0) - (currentPlanObj?.price ?? 0)) * 100) / 100;
  const total = changeType === "upgrade" ? priceDiff : 0;
  const walletShort = total > DEALER_WALLET_BALANCE;

  // ---------- OTP handlers (same behavior as every other flow's checkout OTP) ----------
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
      const el = document.getElementById(`change-postpaid-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("change-postpaid-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  const canContinueNumber = eligible && idNumberValid;
  const canContinuePlan = selectedPlan != null;
  const canPay = otpVerified && !(total > 0 && payMethod === "wallet" && walletShort);

  const resolvePayment = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`CPP-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setIdType("saudi-id");
    setIdNumber("1324567896");
    setNationality("sa");
    setMsisdn("0503334444");
    setLine(null);
    setLookupError(null);
    setSelectedPlan(null);
    setPlanSearch("");
    setOtpVerified(false);
    setPayMethod("wallet");
  };

  const steps = [
    { label: t("changePostpaidPlan.stepNumber", "Number"), Icon: Phone },
    { label: t("changePostpaidPlan.stepPlan", "Plan"), Icon: Receipt },
    { label: t("changePostpaidPlan.stepCheckout", "Checkout"), Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("changePostpaidPlan.title")}
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
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Number ── */}
        {step === 0 && (
          <>
            <Field label={t("changePostpaidPlan.idType")}>
              <Select value={idType} onValueChange={(v) => { setIdType(v); if (v === "saudi-id") setNationality("sa"); setIdNumber(demoIdFor(ID_TYPE_RULES[v])); }}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder={t("changePostpaidPlan.idTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {POSTPAID_ID_TYPES.map((key) => (
                    <SelectItem key={key} value={key}>{ID_TYPE_LABELS[ID_TYPE_RULES[key].labelKey]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={ID_FIELD_LABELS[idNumberRule?.fieldLabelKey ?? "idNumber"]}>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={t("changePostpaidPlan.idNumberPlaceholder")}
                className={cn("h-12 bg-card rounded-xl", idNumber.trim().length > 0 && !idNumberValid && "border-destructive focus-visible:ring-destructive")}
              />
              {idNumber.trim().length > 0 && !idNumberValid && idNumberRule && (
                <p className="text-xs text-destructive">
                  {idNumberRule.startDigits
                    ? t("changePostpaidPlan.idNumberRuleStart", { digits: idNumberRule.startDigits.join(", "), length: idNumberRule.length })
                    : t("changePostpaidPlan.idNumberRuleLength", { length: idNumberRule.length })}
                </p>
              )}
            </Field>
            <Field label={t("changePostpaidPlan.nationality")}>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder={t("changePostpaidPlan.nationalityPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="sa">{t("changePostpaidPlan.nationalitySaudi")}</SelectItem>
                  <SelectItem value="om">{t("changePostpaidPlan.nationalityOmani")}</SelectItem>
                  <SelectItem value="ae">{t("changePostpaidPlan.nationalityEmirati")}</SelectItem>
                  <SelectItem value="eg">{t("changePostpaidPlan.nationalityEgyptian")}</SelectItem>
                  <SelectItem value="in">{t("changePostpaidPlan.nationalityIndian")}</SelectItem>
                  <SelectItem value="other">{t("changePostpaidPlan.nationalityOther")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("changePostpaidPlan.msisdn")}>
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} icon={<Phone className="w-4 h-4" />} />
              {checking && <p className="text-[11px] text-muted-foreground">{t("changePostpaidPlan.checkingNumber")}</p>}
            </Field>

            <PrototypeTestBox
              heading={t("changePostpaidPlan.testNumbersHeading")}
              description={t("changePostpaidPlan.testNumbersDescription")}
              items={[
                { value: "0503334444", note: t("changePostpaidPlan.testNoteMidTier"), group: t("changePostpaidPlan.testGroupValid") },
                { value: "0503334455", note: t("changePostpaidPlan.testNoteLowTier"), group: t("changePostpaidPlan.testGroupValid") },
                { value: "0503334466", note: t("changePostpaidPlan.testNoteTopTier"), group: t("changePostpaidPlan.testGroupValid") },
                { value: "0503334477", note: t("changePostpaidPlan.testNoteTerminated"), group: t("changePostpaidPlan.testGroupErrors") },
                { value: "0503334488", note: t("changePostpaidPlan.testNoteNotPostpaid"), group: t("changePostpaidPlan.testGroupErrors") },
                { value: "0509999999", note: t("changePostpaidPlan.testNoteNotFound"), group: t("changePostpaidPlan.testGroupErrors") },
              ]}
              onSelect={(v) => {
                setMsisdn(v);
                setIdNumber(demoIdFor(idNumberRule));
              }}
            />
          </>
        )}

        {/* ── Step 1: Plan ── */}
        {step === 1 && (
          <>
            {currentPlanObj && (
              <div>
                <div className="flex items-center justify-between gap-2 px-1 mb-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">{t("changePostpaidPlan.currentPlan")}</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                    <ClipboardList className="w-3 h-3" />
                    {currentPlanObj.title}
                  </span>
                </div>
                <PlanCard
                  plan={{ ...currentPlanObj, badge: undefined }}
                  selected
                  active
                  onSelect={() => {}}
                  hideRadio
                  minsLabel={t("activation.plan.localMins")}
                  layout="postpaid"
                />
              </div>
            )}

            <h3 className="text-sm font-semibold text-foreground px-1">{t("changePostpaidPlan.availablePlans")}</h3>

            {/* Search + View all plans, side by side — same pattern used across the app's
                other plan-catalog steps (Prepaid Change Bundle, Subscription Migration). */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  placeholder={t("changePostpaidPlan.searchPlans")}
                  className="h-11 bg-card rounded-xl ps-9"
                />
              </div>
              <button
                type="button"
                onClick={() => navigate("/change-postpaid-plan/plans", {
                  state: {
                    selectedPlanTitle: selectedPlanObj?.title,
                    msisdn,
                    backSearch: location.search,
                  },
                })}
                className="h-11 px-4 rounded-xl bg-card border border-border/60 shadow-sm text-primary text-sm font-semibold whitespace-nowrap shrink-0 flex items-center gap-1"
              >
                {t("changePostpaidPlan.allPlansBtn")}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>

            <PlanSelector
              plans={planList}
              selectedPlan={selectedPlan}
              onSelect={onSelectPlan}
              searchQuery={planSearch}
            />

            {changeType && (
              <div className="flex justify-center">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
                    changeType === "upgrade"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
                  )}
                >
                  {changeType === "upgrade" ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                  {changeType === "upgrade" ? t("changePostpaidPlan.changeTypeUpgrade") : t("changePostpaidPlan.changeTypeDowngrade")}
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && (
          <>
            <CardSection title={t("changePostpaidPlan.planChangeSummary")} icon={ClipboardList}>
              <SummaryRow label={t("changePostpaidPlan.msisdn")} value={line?.msisdn ?? t("changePostpaidPlan.dash")} />
              <SummaryRow label={t("changePostpaidPlan.currentPlan")} value={currentPlanObj?.title ?? t("changePostpaidPlan.dash")} />
              <SummaryRow label={t("changePostpaidPlan.newPlan")} value={selectedPlanObj?.title ?? t("changePostpaidPlan.dash")} />
              <SummaryRow
                label={t("changePostpaidPlan.changeType")}
                value={changeType === "upgrade" ? t("changePostpaidPlan.changeTypeUpgrade") : changeType === "downgrade" ? t("changePostpaidPlan.changeTypeDowngrade") : t("changePostpaidPlan.dash")}
              />
            </CardSection>

            <CardSection title={t("changePostpaidPlan.paymentSummary")} icon={Receipt}>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[11px] text-muted-foreground">{t("changePostpaidPlan.depositFee")}</span>
                <span className="text-xs font-semibold text-foreground">
                  {total > 0 ? <><RiyalSymbol /> {total.toFixed(2)}</> : t("changePostpaidPlan.free")}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-sm font-semibold text-foreground">{t("changePostpaidPlan.total")}</span>
                <span className="text-base font-bold text-primary">
                  {total > 0 ? <><RiyalSymbol /> {total.toFixed(2)}</> : t("changePostpaidPlan.free")}
                </span>
              </div>
            </CardSection>

            {total > 0 && (
              <CardSection title={t("changePostpaidPlan.paymentMethod")} icon={CreditCard}>
                <div className="space-y-2">
                  <PayOption
                    icon={Wallet}
                    label={t("changePostpaidPlan.dealerWallet")}
                    description={t("changePostpaidPlan.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE.toFixed(2) })}
                    selected={payMethod === "wallet"}
                    disabled={walletShort}
                    justToppedUp={justToppedUp}
                    onClick={() => setPayMethod("wallet")}
                  >
                    {walletShort && (
                      <WalletShortNotice
                        message={t("changePostpaidPlan.walletShort", { amount: (total - DEALER_WALLET_BALANCE).toFixed(2) })}
                        buttonLabel={t("changePostpaidPlan.topUpWallet")}
                      />
                    )}
                  </PayOption>
                  <PayOption
                    icon={CreditCard}
                    label={t("changePostpaidPlan.posTerminal")}
                    description={t("changePostpaidPlan.posTerminalDesc")}
                    selected={payMethod === "pos"}
                    onClick={() => setPayMethod("pos")}
                  />
                </div>
              </CardSection>
            )}

            <CardSection title={t("changePostpaidPlan.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("changePostpaidPlan.verified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>
                  {t("changePostpaidPlan.sendVerifyOtp")}
                </Button>
              )}
            </CardSection>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <>
              {step === 1 && (
                <div className="flex items-center justify-center gap-1.5 -mt-0.5 mb-2 px-3.5 py-1 rounded-full bg-primary/5 border border-primary/15 w-fit mx-auto leading-none">
                  <Wallet className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] text-muted-foreground">{t("changePostpaidPlan.walletBalanceLabel")}</span>
                  <span className="text-[12px] font-bold text-primary"><RiyalSymbol /> {DEALER_WALLET_BALANCE.toFixed(2)}</span>
                </div>
              )}
              <Button
                className="w-full h-12 text-sm font-semibold rounded-full"
                disabled={step === 0 ? !canContinueNumber : !canContinuePlan}
                onClick={() => setStep((s) => s + 1)}
              >
                {t("changePostpaidPlan.continue")}
              </Button>
            </>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setConfirmOpen(true)}>
              {total > 0 ? <>{t("changePostpaidPlan.pay")} <RiyalSymbol /> {total.toFixed(2)}</> : t("changePostpaidPlan.submit")}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("changePostpaidPlan.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("changePostpaidPlan.otpIncorrect") : t("changePostpaidPlan.otpSentViaSms")}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`change-postpaid-otp-${i}`}
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
                  {t("changePostpaidPlan.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("changePostpaidPlan.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("changePostpaidPlan.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("changePostpaidPlan.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("changePostpaidPlan.resend")}</button>
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
              <h3 className="text-lg font-bold text-foreground mb-1">{t("changePostpaidPlan.confirmTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("changePostpaidPlan.confirmDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolvePayment}>{t("changePostpaidPlan.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("changePostpaidPlan.cancel")}</button>
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
              <h3 className="text-lg font-bold text-foreground mb-1">{t("changePostpaidPlan.cancelFlowTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("changePostpaidPlan.cancelFlowDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setCancelOpen(false); resetAll(); navigate("/"); }}>{t("changePostpaidPlan.yesCancelFlow")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setCancelOpen(false)}>{t("changePostpaidPlan.keepEditing")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("changePostpaidPlan.changeSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("changePostpaidPlan.appliedNextCycle")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("changePostpaidPlan.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}>
            {t("changePostpaidPlan.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("changePostpaidPlan.changeFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("changePostpaidPlan.changeFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("changePostpaidPlan.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setFailureOpen(false)}>
              {t("changePostpaidPlan.cancel")}
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
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("changePostpaidPlan.lookupErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button
            onClick={() => setLookupError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("changePostpaidPlan.gotIt")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangePostpaidPlan;
