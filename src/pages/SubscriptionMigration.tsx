import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PlanSelector, { Plan } from "@/components/activation/PlanSelector";
import PayOption from "@/components/activation/PayOption";
import PlanCard from "@/components/PlanCard";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import { PREPAID_PLANS, POSTPAID_PLANS, FRIENDI_PLANS, ID_TYPE_ORDER, ID_TYPE_RULES, ID_TYPE_VERIFICATION_METHODS, VerifiedBanner, type IdTypeRule } from "@/pages/NewActivation";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import WalletShortNotice from "@/components/WalletShortNotice";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn, formatValidity } from "@/lib/utils";
import {
  ClipboardList,
  CreditCard,
  Wallet,
  Receipt,
  ReceiptText,
  AlertCircle,
  Check,
  XCircle,
  Phone,
  X as XIcon,
  Info,
  UserCheck,
  ArrowLeftRight,
} from "lucide-react";
import RiyalSymbol from "@/components/RiyalSymbol";
import SematiVerification from "@/components/SematiVerification";

// ---------- Local UI primitives (mirrors NewActivation.tsx's page-local helpers) ----------
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
type Direction = "pre-to-post" | "post-to-pre";

interface DemoOldBill {
  number: string;
  cycle: string;
  /** Can go negative when there's an advance payment balance — the total payable (below)
   * clamps at 0 rather than showing a negative amount due. */
  currentBalance: number;
  unbilledAmount: number;
  outOfBundle: number;
}

// Current Balance/Unbilled Amount/Out of Bundle are pre-tax figures — VAT is added once,
// here, to get the actual amount due (mirrors SimTermination's billTotal).
/** VAT-inclusive total payable for a single old-line bill, clamped at 0. */
const oldBillTotal = (b: DemoOldBill) => Math.max(0, Math.round((b.currentBalance + b.unbilledAmount + b.outOfBundle) * 1.15 * 100) / 100);

interface DemoCustomer {
  msisdn: string;
  subscriptionType: "prepaid" | "postpaid";
  planCategory: string;
  planName: string;
  /** Only set for postpaid customers with something left to pay on the old line — newest
   * cycle first. A line can carry more than one open bill. */
  outstandingBills?: DemoOldBill[];
  isWhitelisted?: boolean;
  /** 100% deposit fee waived — only set for specific whitelisted customers. */
  depositWaiver?: boolean;
  /** SIM-inventory cap reached on the customer's account — blocks the migration regardless
   * of the line's own plan eligibility. "max-total" applies to either direction; the other
   * two only block the direction that would add another SIM of that type. */
  simLimitReason?: "max-postpaid" | "max-prepaid" | "max-total";
}

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { msisdn: "0501111111", subscriptionType: "prepaid", planCategory: "aman", planName: "Virgin Mobile Aman 60" },
  { msisdn: "0501111122", subscriptionType: "prepaid", planCategory: "base-plan", planName: "Baqah 150", isWhitelisted: true },
  { msisdn: "0501111133", subscriptionType: "prepaid", planCategory: "flex", planName: "Baqah Flex 100" },
  { msisdn: "0501111144", subscriptionType: "prepaid", planCategory: "data", planName: "300 GB (5G MBB)" },
  { msisdn: "0501111155", subscriptionType: "prepaid", planCategory: "base-plan", planName: "Baqah 150", isWhitelisted: true, depositWaiver: true },
  { msisdn: "0501111166", subscriptionType: "prepaid", planCategory: "base-plan", planName: "Baqah 150", simLimitReason: "max-postpaid" },
  { msisdn: "0501111177", subscriptionType: "prepaid", planCategory: "base-plan", planName: "Baqah 150", simLimitReason: "max-total" },
  // Client's canonical "Unpaid" breakdown: 300 current + 150 unbilled + 50 OOB = 500
  // subtotal, 575 total once VAT is applied (see oldBillTotal above).
  { msisdn: "0502222211", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 150", outstandingBills: [{ number: "BL-2026-07-2201", cycle: "1st July – 31st July, 2026", currentBalance: 300, unbilledAmount: 150, outOfBundle: 50 }] },
  { msisdn: "0502222222", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 300" },
  { msisdn: "0502222233", subscriptionType: "postpaid", planCategory: "vnet", planName: "Vnet 300 GB" },
  { msisdn: "0502222244", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 150", simLimitReason: "max-prepaid" },
  { msisdn: "0502222255", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 150", simLimitReason: "max-total" },
  // Two open cycles — the bottom sheet lists both, each collapsed by default.
  { msisdn: "0502222266", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 150", outstandingBills: [
    { number: "BL-2026-07-5590", cycle: "1st July – 31st July, 2026", currentBalance: 245, unbilledAmount: 0, outOfBundle: 0 },
    { number: "BL-2026-06-5218", cycle: "1st June – 30th June, 2026", currentBalance: 130, unbilledAmount: 0, outOfBundle: 0 },
  ] },
];

const ELIGIBLE_PREPAID_CATEGORIES = ["aman", "base-plan", "flex"];
// Friendi has no postpaid product — post-to-pre is the only direction its catalog can ever
// appear in. Calls (international minutes) and PAYG aren't plan-swap targets, so excluded.
const FM_MIGRATION_CATEGORIES = ["combo", "flexi", "data"];

// Demo ID number — the leading digit adapts to the selected ID Type's start-digit rule
// (mirrors NewActivation.tsx's demoIdFor) so the prototype hint is always valid.
const DEMO_ID_SUFFIX = "324567896";
const demoIdFor = (rule: IdTypeRule | undefined) => (rule?.startDigits?.[0] ?? "1") + DEMO_ID_SUFFIX;

const SubscriptionMigration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { brand } = useBrand();
  const isFriendi = brand === "friendi";
  const { balance: DEALER_WALLET_BALANCE, justToppedUp } = useWalletBalance();
  const [searchParams] = useSearchParams();
  // "Option 1" (no param) keeps today's behavior — direction is auto-detected from
  // whichever number the dealer looks up. "Option 2" is two separate Home entry points,
  // each locked to one direction; looking up a number that doesn't match that direction
  // is treated as ineligible rather than silently switching direction.
  const directionParam = searchParams.get("direction");
  const lockedDirection: Direction | null =
    directionParam === "pre-to-post" || directionParam === "post-to-pre" ? directionParam : null;

  // Plain-English labels for the shared ID_TYPE_RULES keys — translated via subscriptionMigration.idType_*
  const ID_TYPE_LABELS: Record<string, string> = {
    saudiId: t("subscriptionMigration.idType_saudiId"),
    iqamaId: t("subscriptionMigration.idType_iqamaId"),
    borderVisa: t("subscriptionMigration.idType_borderVisa"),
    gccId: t("subscriptionMigration.idType_gccId"),
    visitorVisa: t("subscriptionMigration.idType_visitorVisa"),
    umrahVisa: t("subscriptionMigration.idType_umrahVisa"),
    hajVisa: t("subscriptionMigration.idType_hajVisa"),
    gccPassport: t("subscriptionMigration.idType_gccPassport"),
    premiumResidency: t("subscriptionMigration.idType_premiumResidency"),
  };
  const ID_FIELD_LABELS: Record<string, string> = {
    idNumber: t("subscriptionMigration.idField_idNumber"),
    borderNumber: t("subscriptionMigration.idField_borderNumber"),
    gccIdNumber: t("subscriptionMigration.idField_gccIdNumber"),
    visaNumber: t("subscriptionMigration.idField_visaNumber"),
    gccPassportNumber: t("subscriptionMigration.idField_gccPassportNumber"),
  };
  const CATEGORY_LABEL: Record<string, string> = {
    aman: t("subscriptionMigration.categoryAman"),
    "base-plan": t("subscriptionMigration.categoryBaqah"),
    flex: t("subscriptionMigration.categoryBaqahFlex"),
    data: t("subscriptionMigration.category5gMbb"),
    "switch-postpaid": t("subscriptionMigration.categorySwitchPostpaid"),
    vnet: t("subscriptionMigration.categoryVnet"),
  };
  // Friendi's own category labels — "data" collides with Virgin's "5G MBB" meaning above,
  // so this is looked up separately when the active brand is Friendi.
  const FM_CATEGORY_LABEL: Record<string, string> = {
    combo: t("subscriptionMigration.categoryCombo"),
    flexi: t("subscriptionMigration.categoryFlexi"),
    data: t("subscriptionMigration.categoryData"),
  };

  // ---------- Flow state ----------
  const [direction, setDirection] = useState<Direction | null>(null);
  const [step, setStep] = useState(0);

  // Identity
  const [idType, setIdType] = useState("saudi-id");
  const [idNumber, setIdNumber] = useState("1324567896");
  const [nationality, setNationality] = useState("sa");
  // A number carried over from the other direction-locked service's "wrong number" modal
  // (see wrongDirectionModalOpen below) takes priority; otherwise default to a demo number
  // that actually matches this service's locked direction, so a fresh Option-2 entry point
  // never opens straight into its own mismatch error.
  const [msisdn, setMsisdn] = useState<string>(
    (location.state as { msisdn?: string } | null)?.msisdn ?? (lockedDirection === "post-to-pre" ? "0502222211" : "0501111133")
  );
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  // Ineligible line type (5G MBB / Vnet) — surfaced in a modal on Continue, not inline.
  const [ineligibleReason, setIneligibleReason] = useState<string | null>(null);
  const [ineligibleModalOpen, setIneligibleModalOpen] = useState(false);
  // Locked-service lookup found a number of the wrong direction — offer a CTA straight to
  // the other direction's service instead of leaving the dealer to find it themselves.
  const [wrongDirectionModalOpen, setWrongDirectionModalOpen] = useState(false);
  // Max postpaid/prepaid SIMs reached — modal with a CTA to change the existing plan on the
  // maxed-out line type instead of adding a new one. Max-total has no alternative action, so
  // it stays inline-only (see lookupError below), never opening this modal.
  const [simLimitCase, setSimLimitCase] = useState<"max-postpaid" | "max-prepaid" | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [depositWaiver, setDepositWaiver] = useState(false);

  // Plan
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [planTypeChip, setPlanTypeChip] = useState<string>("all");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsChain, setTermsChain] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Checkout — OTP
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);

  // Checkout — Customer Verification (ID via Semati) — gates OTP + Pay
  const [customerVerifyOpen, setCustomerVerifyOpen] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);

  // Checkout — payment
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  // Post-to-pre only — the old line's outstanding bill card shows only the essentials
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN auto-lookup (mirrors the KIT-code auto-check pattern) ----------
  useEffect(() => {
    setCustomer(null);
    setLookupError(null);
    setIneligibleReason(null);
    setWrongDirectionModalOpen(false);
    setSimLimitCase(null);
    setDirection(null);
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError(t("subscriptionMigration.lookupErrorNotFound"));
        return;
      }
      const dir: Direction = found.subscriptionType === "prepaid" ? "pre-to-post" : "post-to-pre";
      if (lockedDirection && dir !== lockedDirection) {
        setLookupError(
          lockedDirection === "pre-to-post"
            ? t("subscriptionMigration.lookupErrorWrongDirectionPreToPost")
            : t("subscriptionMigration.lookupErrorWrongDirectionPostToPre")
        );
        setWrongDirectionModalOpen(true);
        return;
      }
      // SIM inventory caps — checked before plan eligibility, since a maxed-out account
      // blocks the migration outright regardless of whether the line itself is eligible.
      // Max-total is inline-only (no alternative action to offer); max-postpaid/prepaid pop
      // a modal with a CTA to change the existing plan on the maxed-out line type.
      if (found.simLimitReason === "max-total") {
        setLookupError(t("subscriptionMigration.lookupErrorMaxTotalSim"));
        return;
      }
      if (dir === "pre-to-post" && found.simLimitReason === "max-postpaid") {
        setLookupError(t("subscriptionMigration.lookupErrorMaxPostpaidSim"));
        setSimLimitCase("max-postpaid");
        return;
      }
      if (dir === "post-to-pre" && found.simLimitReason === "max-prepaid") {
        setLookupError(t("subscriptionMigration.lookupErrorMaxPrepaidSim"));
        setSimLimitCase("max-prepaid");
        return;
      }
      setDirection(dir);
      // Ineligible line types don't get an inline banner — the reason is surfaced in a
      // modal when the dealer presses Continue (same pattern as SIM Activation's
      // "Email Not Registered" dialog).
      if (dir === "pre-to-post" && found.planCategory === "data") {
        setIneligibleReason(t("subscriptionMigration.ineligibleDataReason"));
        setCustomer(found);
        return;
      }
      if (dir === "post-to-pre" && found.planCategory === "vnet") {
        setIneligibleReason(t("subscriptionMigration.ineligibleVnetReason"));
        setCustomer(found);
        return;
      }
      setCustomer(found);
      setIsWhitelisted(!!found.isWhitelisted);
      setDepositWaiver(!!found.depositWaiver);
    }, 800);
    return () => clearTimeout(timer);
    // lockedDirection is a real dependency, not just msisdn — the wrong-direction modal's
    // CTA navigates between the two locked services without unmounting this component (same
    // route, only the query param changes), so without it here the lookup would never
    // re-run against the new lockedDirection and the modal would show stale, contradictory
    // text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn, lockedDirection]);

  const eligible = !!customer && !lookupError;

  // ---------- Plan catalogue per direction ----------
  const planList: Plan[] =
    direction === "pre-to-post"
      ? POSTPAID_PLANS.filter((p) => p.categories.includes("switch-postpaid"))
      : isFriendi
      ? FRIENDI_PLANS.filter((p) => p.categories.some((c) => FM_MIGRATION_CATEGORIES.includes(c)))
      : PREPAID_PLANS.filter((p) => p.categories.some((c) => ELIGIBLE_PREPAID_CATEGORIES.includes(c)));
  const selectedPlanObj = selectedPlan != null ? planList[selectedPlan] : undefined;

  // ---------- Pricing ----------
  const planPrice = selectedPlanObj?.price ?? 0;
  // Whitelisted postpaid migration: no VAT, customer pays the deposit fee (= plan price) —
  // unless the specific customer also has a 100% deposit waiver, in which case it's free.
  const deposit = depositWaiver ? 0 : planPrice;
  const creditLimit = Math.round(planPrice * 0.2 * 100) / 100;
  const outstandingBills = customer?.outstandingBills ?? [];
  const outstandingBalance = outstandingBills.reduce((sum, b) => sum + oldBillTotal(b), 0);
  const vat = Math.round(planPrice * 0.15 * 100) / 100;
  // Actual amount charged — pre-to-post is deposit-only (no VAT); post-to-pre is plan +
  // VAT + any outstanding bill on the old line.
  const total = direction === "pre-to-post" ? deposit : Math.round((planPrice + vat + outstandingBalance) * 100) / 100;
  const walletShort = total > DEALER_WALLET_BALANCE;

  // ---------- OTP handlers (same behavior as the SIM Activation checkout OTP) ----------
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
      const el = document.getElementById(`migration-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("migration-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  // ID Number must match the selected ID Type's full rule (start digit(s) + exact length),
  // enforced silently — no visible hint, matching SIM Activation's Identity step.
  const idNumberRule = ID_TYPE_RULES[idType];
  const idNumberValid = (() => {
    const v = idNumber.trim();
    if (v.length === 0) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();
  const canContinueIdentity = !!idType && !!nationality && eligible && idNumberValid;
  const canContinuePlan = selectedPlan != null;

  const onContinueStep0 = () => {
    if (ineligibleReason) {
      setIneligibleModalOpen(true);
      return;
    }
    setStep((s) => s + 1);
  };
  const canPay =
    (direction === "post-to-pre" || customerVerified) &&
    otpVerified &&
    termsAccepted &&
    (direction === "pre-to-post" && isWhitelisted ? true : !(payMethod === "wallet" && walletShort));

  const resolvePayment = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`SM-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setDirection(null);
    setStep(0);
    setIdType("saudi-id");
    setIdNumber("1324567896");
    setNationality("sa");
    setMsisdn("0501111133");
    setCustomer(null);
    setLookupError(null);
    setIneligibleReason(null);
    setIsWhitelisted(false);
    setDepositWaiver(false);
    setSelectedPlan(null);
    setTermsAccepted(false);
    setOtpVerified(false);
    setPayMethod("wallet");
    setCustomerVerified(false);
  };

  const steps = [
    { label: "Identity", Icon: ClipboardList },
    { label: "Plan", Icon: Receipt },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={
          lockedDirection === "pre-to-post" ? t("subscriptionMigration.migrationPreToPost")
          : lockedDirection === "post-to-pre" ? t("subscriptionMigration.migrationPostToPre")
          : t("subscriptionMigration.title")
        }
        showBack
        onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))}
      />
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Identity ── */}
        {step === 0 && (
          <>
            <Field label={t("subscriptionMigration.idType")}>
              <Select value={idType} onValueChange={(v) => { setIdType(v); if (v === "saudi-id") setNationality("sa"); setIdNumber(demoIdFor(ID_TYPE_RULES[v])); }}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder={t("subscriptionMigration.idTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {ID_TYPE_ORDER.map((key) => (
                    <SelectItem key={key} value={key}>{ID_TYPE_LABELS[ID_TYPE_RULES[key].labelKey]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={ID_FIELD_LABELS[idNumberRule?.fieldLabelKey ?? "idNumber"]}>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={t("subscriptionMigration.idNumberPlaceholder")}
                className={cn("h-12 bg-card rounded-xl", idNumber.trim().length > 0 && !idNumberValid && "border-destructive focus-visible:ring-destructive")}
              />
              {idNumber.trim().length > 0 && !idNumberValid && idNumberRule && (
                <p className="text-xs text-destructive">
                  {idNumberRule.startDigits
                    ? t("subscriptionMigration.idNumberRuleStart", { digits: idNumberRule.startDigits.join(", "), length: idNumberRule.length })
                    : t("subscriptionMigration.idNumberRuleLength", { length: idNumberRule.length })}
                </p>
              )}
            </Field>
            <Field label={t("subscriptionMigration.nationality")}>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder={t("subscriptionMigration.nationalityPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="sa">{t("subscriptionMigration.nationalitySaudi")}</SelectItem>
                  <SelectItem value="om">{t("subscriptionMigration.nationalityOmani")}</SelectItem>
                  <SelectItem value="ae">{t("subscriptionMigration.nationalityEmirati")}</SelectItem>
                  <SelectItem value="eg">{t("subscriptionMigration.nationalityEgyptian")}</SelectItem>
                  <SelectItem value="in">{t("subscriptionMigration.nationalityIndian")}</SelectItem>
                  <SelectItem value="other">{t("subscriptionMigration.nationalityOther")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("subscriptionMigration.msisdn")}>
              <PhoneNumberInput
                value={msisdn}
                onChange={setMsisdn}
                icon={<Phone className="w-4 h-4" />}
              />
              {checking && <p className="text-[11px] text-muted-foreground">{t("subscriptionMigration.checkingNumber")}</p>}
            </Field>

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}

            <PrototypeTestBox
              heading={t("subscriptionMigration.testNumbersHeading")}
              description={t("subscriptionMigration.testNumbersDescription")}
              items={[
                { value: "0501111133", note: t("subscriptionMigration.testNoteNormalCustomer"), group: t("subscriptionMigration.testGroupPreToPost"), direction: "pre-to-post" as const },
                { value: "0501111155", note: t("subscriptionMigration.testNoteWhitelistedWaiver"), group: t("subscriptionMigration.testGroupPreToPost"), direction: "pre-to-post" as const },
                { value: "0502222222", note: t("subscriptionMigration.testNoteNormalCustomer"), group: t("subscriptionMigration.testGroupPostToPre"), direction: "post-to-pre" as const },
                { value: "0502222211", note: t("subscriptionMigration.testNoteOutstandingBills"), group: t("subscriptionMigration.testGroupPostToPre"), direction: "post-to-pre" as const },
                // Two-bill case (0502222266) hidden from this list for now per request — the
                // demo data and multi-bill rendering stay in place, just not advertised.
                { value: "0501111144", note: t("subscriptionMigration.testNoteDataIneligible"), group: t("subscriptionMigration.testGroupIneligible"), direction: "pre-to-post" as const },
                { value: "0502222233", note: t("subscriptionMigration.testNoteVnetIneligible"), group: t("subscriptionMigration.testGroupIneligible"), direction: "post-to-pre" as const },
                { value: "0501111166", note: t("subscriptionMigration.testNoteMaxPostpaidSim"), group: t("subscriptionMigration.testGroupSimLimit"), direction: "pre-to-post" as const },
                { value: "0501111177", note: t("subscriptionMigration.testNoteMaxTotalSim"), group: t("subscriptionMigration.testGroupSimLimit"), direction: "pre-to-post" as const },
                { value: "0502222244", note: t("subscriptionMigration.testNoteMaxPrepaidSim"), group: t("subscriptionMigration.testGroupSimLimit"), direction: "post-to-pre" as const },
                { value: "0502222255", note: t("subscriptionMigration.testNoteMaxTotalSim"), group: t("subscriptionMigration.testGroupSimLimit"), direction: "post-to-pre" as const },
                // Only meaningful on the locked services — an opposite-direction number to
                // demonstrate the wrong-direction modal + CTA. "direction" here is tagged as
                // the CURRENT lockedDirection (not the number's real type) purely so the
                // filter below keeps it visible on whichever locked page it applies to.
                ...(lockedDirection
                  ? [{
                      value: lockedDirection === "pre-to-post" ? "0502222222" : "0501111133",
                      note: t("subscriptionMigration.testNoteWrongDirection"),
                      group: t("subscriptionMigration.testGroupWrongDirection"),
                      direction: lockedDirection,
                    }]
                  : []),
              ].filter((item) => !lockedDirection || item.direction === null || item.direction === lockedDirection)}
              onSelect={(v) => {
                setMsisdn(v);
                // Refresh the ID Number to a valid demo value for whichever ID Type is
                // currently selected — don't override the dealer's ID Type choice.
                setIdNumber(demoIdFor(idNumberRule));
              }}
            />
          </>
        )}

        {/* ── Step 1: Plan ── */}
        {step === 1 && (
          <>
            {customer && (() => {
              const all = [...PREPAID_PLANS, ...POSTPAID_PLANS];
              const p = all.find((x) => x.title === customer.planName);
              if (!p) return null;
              const cats = p.categories ?? [];
              const layout: "flex" | "postpaid" | "baqa" | "aman" = cats.includes("switch-postpaid")
                ? "postpaid"
                : cats.includes("aman")
                ? "aman"
                : cats.includes("base-plan")
                ? "baqa"
                : "flex";
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 px-1 mb-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{t("subscriptionMigration.currentPlan")}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                      <ClipboardList className="w-3 h-3" />
                      {customer.subscriptionType === "prepaid" ? t("subscriptionMigration.prepaid") : t("subscriptionMigration.postpaid")} · {customer.planName}
                    </span>
                  </div>
                  <PlanCard
                    plan={{ ...p, badge: undefined }}
                    selected
                    active
                    onSelect={() => {}}
                    hideRadio
                    minsLabel={cats.includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                    layout={layout}
                  />
                </div>
              );
            })()}
            <h3 className="text-sm font-semibold text-foreground px-1">
              {direction === "pre-to-post" ? t("subscriptionMigration.availablePostpaidPlans") : t("subscriptionMigration.availablePrepaidPlans")}
            </h3>
            {direction === "post-to-pre" && (
              <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {(isFriendi ? [
                  { value: "all", label: t("subscriptionMigration.chipAll") },
                  { value: "combo", label: t("subscriptionMigration.categoryCombo") },
                  { value: "flexi", label: t("subscriptionMigration.categoryFlexi") },
                  { value: "data", label: t("subscriptionMigration.categoryData") },
                ] : [
                  { value: "all", label: t("subscriptionMigration.chipAll") },
                  { value: "aman", label: t("subscriptionMigration.categoryAman") },
                  { value: "base-plan", label: t("subscriptionMigration.categoryBaqah") },
                  { value: "flex", label: t("subscriptionMigration.categoryBaqahFlex") },
                ]).map((chip) => (
                  <button
                    key={chip.value}
                    onClick={() => {
                      setPlanTypeChip(chip.value);
                      setSelectedPlan(null);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors",
                      planTypeChip === chip.value
                        ? "bg-primary text-white"
                        : "bg-card text-foreground shadow-sm",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
            <PlanSelector
              key={direction === "post-to-pre" ? planTypeChip : "pre-to-post"}
              plans={planList}
              selectedPlan={selectedPlan}
              onSelect={(idx) => setSelectedPlan(idx)}
              categoryFilter={direction === "post-to-pre" ? planTypeChip : undefined}
            />
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && (
          <>
            <CardSection title={t("subscriptionMigration.subscriptionDetails")} icon={ClipboardList}>
              <SummaryRow
                label={t("subscriptionMigration.migrationType")}
                value={direction === "pre-to-post" ? t("subscriptionMigration.migrationPreToPost") : t("subscriptionMigration.migrationPostToPre")}
              />
              {customer && (
                <SummaryRow label={t("subscriptionMigration.msisdn")} value={customer.msisdn} />
              )}
              <SummaryRow
                label={t("subscriptionMigration.subscriptionType")}
                value={direction === "pre-to-post" ? t("subscriptionMigration.postpaid") : t("subscriptionMigration.prepaid")}
              />
              <SummaryRow
                label={t("subscriptionMigration.planType")}
                value={
                  selectedPlanObj?.categories?.[0]
                    ? (isFriendi ? FM_CATEGORY_LABEL : CATEGORY_LABEL)[selectedPlanObj.categories[0]] ?? t("subscriptionMigration.dash")
                    : t("subscriptionMigration.dash")
                }
              />
              <SummaryRow label={t("subscriptionMigration.planName")} value={selectedPlanObj?.title ?? t("subscriptionMigration.dash")} />
              <SummaryRow label={t("subscriptionMigration.planValidity")} value={selectedPlanObj?.validityLabel ? formatValidity(selectedPlanObj.validityLabel) : t("subscriptionMigration.dash")} />
              <SummaryRow label={t("subscriptionMigration.idNumber")} value={idNumber || t("subscriptionMigration.dash")} />
            </CardSection>

            {direction === "pre-to-post" && (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="text-[12px] leading-snug">
                  <p className="text-blue-600 font-semibold">
                    {t("subscriptionMigration.creditLimitEligible", { limit: creditLimit.toFixed(2) })}
                  </p>
                  <p className="text-blue-900/70 mt-0.5">
                    {t("subscriptionMigration.creditLimitDesc")}
                  </p>
                </div>
              </div>
            )}

            {/* Outstanding Bill — its own section before Payment Summary, same pattern as
                SIM Termination's separate "Outstanding Bill" / "Payment" cards. */}
            {direction === "post-to-pre" && outstandingBalance > 0 && (
              <CardSection title={t("subscriptionMigration.outstandingBill")} icon={ReceiptText}>
                {/* Breakdown shows by default now — no "View Details" tap-through needed. */}
                <div className="space-y-3">
                  {outstandingBills.map((b) => {
                    const total = oldBillTotal(b);
                    return (
                      <div key={b.number}>
                        {outstandingBills.length > 1 && (
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-foreground">{b.number}</p>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                              {t("subscriptionMigration.notPaid")}
                            </span>
                          </div>
                        )}
                        <SummaryRow label={t("subscriptionMigration.currentBalance")} value={<><RiyalSymbol /> {b.currentBalance.toFixed(2)}</>} />
                        <SummaryRow label={t("subscriptionMigration.unbilledAmount")} value={<><RiyalSymbol /> {b.unbilledAmount.toFixed(2)}</>} />
                        <SummaryRow label={t("subscriptionMigration.oobUsage")} value={<><RiyalSymbol /> {b.outOfBundle.toFixed(2)}</>} />
                        <SummaryRow label={t("subscriptionMigration.totalOutstanding")} value={<><RiyalSymbol /> {total.toFixed(2)}</>} />
                      </div>
                    );
                  })}
                </div>
              </CardSection>
            )}

            <CardSection title={t("subscriptionMigration.paymentSummary")} icon={Receipt}>
              {direction === "pre-to-post" ? (() => {
                // Prepaid accounts don't carry a postpaid-style outstanding bill — that concept
                // only applies when migrating away from postpaid (see the post-to-pre branch).
                // Migrating from prepaid: no VAT applies, the customer only ever owes the deposit fee.
                const subtotal = deposit;
                const grand = subtotal;
                return (
                  <>
                    <div className="space-y-2 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("subscriptionMigration.depositFee")}</span>
                        <span className="text-xs font-semibold text-foreground">{depositWaiver ? t("subscriptionMigration.waived") : t("subscriptionMigration.amountSar", { amount: deposit.toFixed(2) })}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/60 space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("subscriptionMigration.subtotal")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-sm font-semibold text-foreground">{t("subscriptionMigration.total")}</span>
                      <span className="text-base font-bold text-primary"><RiyalSymbol /> {grand.toFixed(2)}</span>
                    </div>
                  </>
                );
              })() : (() => {
                const subtotal = planPrice;
                const vat = Math.round(subtotal * 0.15 * 100) / 100;
                const grand = Math.round((subtotal + vat + outstandingBalance) * 100) / 100;
                return (
                  <>
                    <div className="space-y-2 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("subscriptionMigration.plan")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {planPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/60 space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("subscriptionMigration.subtotal")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("subscriptionMigration.vat")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {vat.toFixed(2)}</span>
                      </div>
                      {outstandingBalance > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{t("subscriptionMigration.outstandingBill")}</span>
                          <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {outstandingBalance.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-sm font-semibold text-foreground">{t("subscriptionMigration.total")}</span>
                      <span className="text-base font-bold text-primary"><RiyalSymbol /> {grand.toFixed(2)}</span>
                    </div>
                  </>
                );
              })()}
            </CardSection>

            {!(direction === "pre-to-post" && isWhitelisted) && (
              <CardSection title={t("subscriptionMigration.paymentMethod")} icon={CreditCard}>
                <div className="space-y-2">
                  <PayOption icon={Wallet} label={t("subscriptionMigration.dealerWallet")} description={t("subscriptionMigration.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE.toFixed(2) })} selected={payMethod === "wallet"} disabled={walletShort} justToppedUp={justToppedUp} onClick={() => setPayMethod("wallet")}>
                    {walletShort && (
                      <WalletShortNotice
                        message={t("subscriptionMigration.walletShort", { amount: (total - DEALER_WALLET_BALANCE).toFixed(2) })}
                        buttonLabel={t("subscriptionMigration.topUpWallet")}
                      />
                    )}
                  </PayOption>
                  <PayOption icon={CreditCard} label={t("subscriptionMigration.posTerminal")} description={t("subscriptionMigration.posTerminalDesc")} selected={payMethod === "pos"} onClick={() => setPayMethod("pos")} />
                </div>
              </CardSection>
            )}

            {direction !== "post-to-pre" && (
            <CardSection title={t("subscriptionMigration.customerVerification")} icon={UserCheck}>
              {customerVerified ? (
                <VerifiedBanner label={t("subscriptionMigration.customerVerified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setCustomerVerifyOpen(true)}>{t("subscriptionMigration.verifyCustomer")}</Button>
              )}
            </CardSection>
            )}

            <CardSection title={t("subscriptionMigration.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("subscriptionMigration.verified")} />
              ) : (
                <>
                  <Button variant="outline" className="w-full" disabled={direction === "pre-to-post" && !customerVerified} onClick={() => setOtpOpen(true)}>{t("subscriptionMigration.sendVerifyOtp")}</Button>
                  {direction === "pre-to-post" && !customerVerified && (
                    <p className="text-[11px] text-muted-foreground mt-2">{t("subscriptionMigration.completeCustomerVerificationFirst")}</p>
                  )}
                </>
              )}
            </CardSection>

            {/* Terms & Conditions + Privacy Policy — same combined consent as SIM Activation */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 select-none">
                <div
                  role="checkbox"
                  aria-checked={termsAccepted}
                  tabIndex={0}
                  onClick={() => { if (termsAccepted) { setTermsAccepted(false); } else { setTermsChain(true); setTermsOpen(true); } }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (termsAccepted) { setTermsAccepted(false); } else { setTermsChain(true); setTermsOpen(true); } } }}
                  className={cn(
                    "w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer",
                    termsAccepted ? "bg-primary border-primary" : "border-primary",
                  )}
                >
                  {termsAccepted && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <p className="text-sm text-foreground text-start flex-1 leading-snug">
                  {t("subscriptionMigration.agreeToThe")}{" "}
                  <button type="button" onClick={() => setTermsOpen(true)} className="text-primary font-semibold">
                    {t("subscriptionMigration.termsAndConditions")}
                  </button>{" "}
                  {t("subscriptionMigration.andAcknowledge")}{" "}
                  <button type="button" onClick={() => setPrivacyOpen(true)} className="text-primary font-semibold">
                    {t("subscriptionMigration.privacyPolicy")}
                  </button>.
                </p>
              </div>
            </section>
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
                  <span className="text-[12px] text-muted-foreground">{t("subscriptionMigration.walletBalanceLabel")}</span>
                  <span className="text-[12px] font-bold text-primary"><RiyalSymbol /> {DEALER_WALLET_BALANCE.toFixed(2)}</span>
                </div>
              )}
              <Button
                className="w-full h-12 text-sm font-semibold rounded-full"
                disabled={step === 0 ? !canContinueIdentity : !canContinuePlan}
                onClick={step === 0 ? onContinueStep0 : () => setStep((s) => s + 1)}
              >
                {t("subscriptionMigration.continue")}
              </Button>
            </>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setConfirmOpen(true)}>
              {direction === "pre-to-post" && isWhitelisted ? t("subscriptionMigration.submit") : <>{t("subscriptionMigration.pay")} <RiyalSymbol /> {total.toFixed(2)}</>}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("subscriptionMigration.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("subscriptionMigration.otpIncorrect") : t("subscriptionMigration.otpSentViaSms")}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`migration-otp-${i}`}
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
                  {t("subscriptionMigration.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("subscriptionMigration.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("subscriptionMigration.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("subscriptionMigration.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("subscriptionMigration.resend")}</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Terms & Conditions */}
      <Drawer open={termsOpen} onOpenChange={setTermsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose className="absolute end-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
            <XIcon className="h-5 w-5 text-foreground" />
          </DrawerClose>
          <DrawerHeader className="text-center">
            <DrawerTitle>{t("subscriptionMigration.termsAndConditions")}</DrawerTitle>
            <DrawerDescription>{t("subscriptionMigration.termsDrawerDesc")}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3 rtl:text-right">
            <p>{t("subscriptionMigration.termsParagraph1")}</p>
            <p>{t("subscriptionMigration.termsParagraph2")}</p>
            <p>{t("subscriptionMigration.termsParagraph3")}</p>
          </div>
          <DrawerFooter className="flex-col gap-3">
            <DrawerClose asChild>
              <Button onClick={() => { setTermsOpen(false); if (termsChain) { setPrivacyOpen(true); } else { setTermsAccepted(true); } }} className="w-full h-12 rounded-full">
                {t("subscriptionMigration.accept")}
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <button type="button" className="text-sm font-semibold text-primary">
                {t("subscriptionMigration.cancel")}
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Privacy Policy */}
      <Drawer open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose className="absolute end-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
            <XIcon className="h-5 w-5 text-foreground" />
          </DrawerClose>
          <DrawerHeader className="text-center">
            <DrawerTitle>{t("subscriptionMigration.privacyPolicy")}</DrawerTitle>
            <DrawerDescription>{t("subscriptionMigration.privacyDrawerDesc")}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3 rtl:text-right">
            <p>{t("subscriptionMigration.privacyParagraph1")}</p>
            <p>{t("subscriptionMigration.privacyParagraph2")}</p>
            <p>{t("subscriptionMigration.privacyParagraph3")}</p>
          </div>
          <DrawerFooter className="flex-col gap-3">
            <DrawerClose asChild>
              <Button onClick={() => { if (termsChain) { setTermsAccepted(true); setTermsChain(false); } }} className="w-full h-12 rounded-full">
                {t("subscriptionMigration.close")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>


      {/* Ineligible line type — shown when Continue is pressed, not inline (mirrors SIM
          Activation's "Email Not Registered" dialog pattern) */}
      <Dialog open={ineligibleModalOpen} onOpenChange={setIneligibleModalOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("subscriptionMigration.notEligible")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{ineligibleReason}</p>
          <button
            onClick={() => setIneligibleModalOpen(false)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("subscriptionMigration.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      {/* Max postpaid/prepaid SIMs reached — CTA points at changing the existing plan on the
          maxed-out line type instead of adding a new one. No real "change plan" flow exists
          in this prototype yet, so the CTA lands on the shared Coming Soon stub (see
          Menu.tsx). */}
      <Dialog open={simLimitCase !== null} onOpenChange={(o) => !o && setSimLimitCase(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("subscriptionMigration.simLimitTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          {/* Wrapped in a div — DialogContent's [&>button]:hidden (meant only for Radix's
              auto-injected close button) would otherwise also hide this direct-child button. */}
          <div>
            <button
              onClick={() => {
                const feature = simLimitCase === "max-postpaid"
                  ? t("subscriptionMigration.changePrepaidPlan")
                  : t("subscriptionMigration.changePostpaidPlan");
                setSimLimitCase(null);
                navigate("/coming-soon", { state: { feature } });
              }}
              className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
            >
              {simLimitCase === "max-postpaid"
                ? t("subscriptionMigration.changePrepaidPlan")
                : t("subscriptionMigration.changePostpaidPlan")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Locked-service wrong-direction lookup (Option 2 only) — offers a direct CTA to the
          other direction's service instead of leaving the dealer to find it themselves,
          carrying the number they already typed over so they don't have to retype it. */}
      <Dialog open={wrongDirectionModalOpen} onOpenChange={setWrongDirectionModalOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowLeftRight className="w-7 h-7 text-primary" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-foreground mb-1 text-lg">{t("subscriptionMigration.wrongDirectionTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {lockedDirection === "pre-to-post"
              ? t("subscriptionMigration.lookupErrorWrongDirectionPreToPost")
              : t("subscriptionMigration.lookupErrorWrongDirectionPostToPre")}
          </p>
          {/* Wrapped in a div — DialogContent's [&>button]:hidden (meant only for Radix's
              auto-injected close button) would otherwise also hide this direct-child button. */}
          <div>
            <button
              onClick={() => {
                const otherDirection: Direction = lockedDirection === "pre-to-post" ? "post-to-pre" : "pre-to-post";
                navigate(`/subscription-migration?direction=${otherDirection}`, { state: { msisdn } });
              }}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("subscriptionMigration.wrongDirectionCta", {
                service: lockedDirection === "pre-to-post" ? t("subscriptionMigration.migrationPostToPre") : t("subscriptionMigration.migrationPreToPost"),
              })}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Payment */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("subscriptionMigration.confirmPaymentTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("subscriptionMigration.confirmPaymentDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolvePayment}>{t("subscriptionMigration.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("subscriptionMigration.cancel")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("subscriptionMigration.migrationSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {direction === "pre-to-post" ? t("subscriptionMigration.migratedToPostpaid") : t("subscriptionMigration.migratedToPrepaid")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("subscriptionMigration.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">{t("subscriptionMigration.smsConfirmation")}</p>
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("subscriptionMigration.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("subscriptionMigration.migrationFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("subscriptionMigration.migrationFailedDesc")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("subscriptionMigration.reference")} <span className="font-semibold text-foreground">{`SM-${Math.floor(100000 + Math.random() * 900000)}`}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("subscriptionMigration.tryAgain")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => { setFailureOpen(false); }}
            >
              {t("subscriptionMigration.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <SematiVerification
        open={customerVerifyOpen}
        audience="customer"
        allowedMethods={ID_TYPE_VERIFICATION_METHODS[idType]}
        onClose={() => setCustomerVerifyOpen(false)}
        onVerified={() => { setCustomerVerifyOpen(false); setCustomerVerified(true); }}
      />
    </div>
  );
};

export default SubscriptionMigration;
