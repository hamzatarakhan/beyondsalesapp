import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import SematiVerification from "@/components/SematiVerification";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import {
  VerifiedBanner,
  NATIONALITY_CODES,
  ID_TYPE_ORDER,
  ID_TYPE_RULES,
  ID_TYPE_VERIFICATION_METHODS,
  type IdTypeRule,
} from "@/pages/NewActivation";
import {
  Phone,
  ClipboardList,
  AlertCircle,
  Check,
  XCircle,
  ChevronDown,
  ScanLine,
  FileText,
  Wallet,
  UserCheck,
  Coins,
  CreditCard,
  Ban,
  X,
} from "lucide-react";

// ---------- Local UI primitives (mirrors SimReplacement.tsx / UpdateCustomerId.tsx) ----------
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

// Vertical icon-over-label tile — SimCard's horizontal layout is built for two wide
// cards side by side; a third one here would cramp a longer label like "Recharge Card".
const OptionTile = ({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: typeof Coins;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors",
      active ? "border-primary bg-primary/10" : "border-border bg-card",
    )}
  >
    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", active ? "bg-primary/15" : "bg-muted")}>
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
    </div>
    <p className={cn("text-[11px] font-semibold text-center leading-tight", active ? "text-foreground" : "text-muted-foreground")}>{label}</p>
  </button>
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
// Prototype-only — no backend to source real KIT inventory from yet.
interface DemoKit {
  code: string;
  status: "unused" | "used";
}
const DEMO_KITS: DemoKit[] = [
  { code: "1234567890", status: "unused" },
  { code: "2234567890", status: "unused" },
  { code: "9999999990", status: "used" },
];

// Demo ID number — the leading digit adapts to the selected ID Type's start-digit rule
// (mirrors NewActivation.tsx's demoIdFor) so switching type keeps the field valid.
const DEMO_ID_SUFFIX = "029384756";
const demoIdFor = (rule: IdTypeRule | undefined) => (rule?.startDigits?.[0] ?? "1") + DEMO_ID_SUFFIX;

// ponytail: the client ticket says the Booking Code "Should be XX Digits" without naming
// the actual count — defaulting to 6 so the field can be format-validated; change this
// constant once the real length is confirmed.
const BOOKING_CODE_LENGTH = 6;

// Values pending Waley — placeholder list so the dropdown isn't empty until the real
// subscription types are shared.
const SUBSCRIPTION_TYPES = ["Basic", "Baqa", "Aman", "Flex"];

// Same preset amounts as the Top Up flow.
const TOPUP_PRESETS = [10, 20, 30, 50, 100, 200];

const ActivateVanityNumber = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);
  // Once past step 0, going back to it no longer offers an easy back-to-Home — only
  // Close (with the cancel-reason prompt), so real progress can't be discarded silently.
  const [everProgressed, setEverProgressed] = useState(false);
  useEffect(() => { if (step > 0) setEverProgressed(true); }, [step]);

  // Step 0 — KIT Code, then (once valid/unused) Identity + Booking Code
  const [kit, setKit] = useState("");
  const [checkingKit, setCheckingKit] = useState(false);
  const [kitUnused, setKitUnused] = useState(false);
  const [kitError, setKitError] = useState<string | null>(null);
  const kitFormatValid = /^\d{10}$/.test(kit);

  const [idType, setIdType] = useState("saudi-id");
  const [nationality, setNationality] = useState("sa");
  const [nationalityPickerOpen, setNationalityPickerOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [idNumber, setIdNumber] = useState(demoIdFor(ID_TYPE_RULES["saudi-id"]));
  const [bookingCode, setBookingCode] = useState("");

  // Step 1 — Details
  const [msisdn, setMsisdn] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("unpaid");
  const [price, setPrice] = useState("");
  const [subscriptionType, setSubscriptionType] = useState(SUBSCRIPTION_TYPES[0]);
  const [isPrimary, setIsPrimary] = useState(true);
  const [showOption, setShowOption] = useState<"topup" | "recharge-card" | "none">("none");
  const [topupAmount, setTopupAmount] = useState<number | null>(null);
  const [rechargeCardCode, setRechargeCardCode] = useState("");

  // Step 2 — Checkout
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [idVerifyOpen, setIdVerifyOpen] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  // Separate from ID/OTP verification themselves — an explicit sign-off that the dealer
  // has verified the customer, same as the ticket calls out as its own checkbox.
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [orderId, setOrderId] = useState("");
  // Top-right X, shown from stage 2 onward only — nothing to lose yet on stage 1.
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherText, setCancelOtherText] = useState("");

  // ---------- KIT Code check — triggered by the Check button, same pattern as other
  // flows' Search button instead of auto-triggering on keystroke. ----------
  const checkKit = () => {
    if (!kitFormatValid) return;
    setCheckingKit(true);
    setKitUnused(false);
    setKitError(null);
    setTimeout(() => {
      setCheckingKit(false);
      const found = DEMO_KITS.find((k) => k.code === kit);
      if (!found) {
        setKitError(t("activateVanityNumber.kitErrorNotFound"));
        return;
      }
      if (found.status === "used") {
        setKitError(t("activateVanityNumber.kitErrorUsed"));
        return;
      }
      setKitUnused(true);
    }, 800);
  };

  // ---------- Gates ----------
  const idNumberRule = ID_TYPE_RULES[idType];
  const idNumberValid = (() => {
    const v = idNumber.trim();
    if (v.length === 0) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();
  const bookingCodeValid = new RegExp(`^\\d{${BOOKING_CODE_LENGTH}}$`).test(bookingCode);
  const canContinueKit = kitUnused && idNumberValid && bookingCodeValid;

  const msisdnValid = /^\d{10}$/.test(msisdn);
  const priceValid = price.trim().length > 0 && Number.isFinite(Number(price)) && Number(price) >= 0;
  const showOptionValid =
    showOption === "none" ||
    (showOption === "topup" && topupAmount != null) ||
    (showOption === "recharge-card" && rechargeCardCode.trim().length > 0);
  const canContinueDetails = msisdnValid && priceValid && showOptionValid;

  const canSubmit = idVerified && otpVerified && verificationConfirmed && contactNumber.trim().length > 0 && address.trim().length > 0;

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
      (document.getElementById(`activate-vanity-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    (document.getElementById("activate-vanity-otp-0") as HTMLInputElement | null)?.focus();
  };

  const resolveSubmit = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`VN-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureReason(t("activateVanityNumber.failureReasonGeneric"));
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setKit("");
    setKitUnused(false);
    setKitError(null);
    setIdType("saudi-id");
    setNationality("sa");
    setIdNumber(demoIdFor(ID_TYPE_RULES["saudi-id"]));
    setBookingCode("");
    setMsisdn("");
    setPaymentStatus("unpaid");
    setPrice("");
    setSubscriptionType(SUBSCRIPTION_TYPES[0]);
    setIsPrimary(true);
    setShowOption("none");
    setTopupAmount(null);
    setRechargeCardCode("");
    setContactNumber("");
    setEmail("");
    setAddress("");
    setIdVerified(false);
    setOtpVerified(false);
    setVerificationConfirmed(false);
  };

  const STEPS = [
    { label: t("activateVanityNumber.stepIdentity", "Identity"), Icon: ScanLine },
    { label: t("activateVanityNumber.stepDetails", "Details"), Icon: FileText },
    { label: t("activateVanityNumber.stepCheckout", "Checkout"), Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("activateVanityNumber.title")}
        showBack={step > 0 || !everProgressed}
        onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))}
        rightElement={
          (step > 0 || everProgressed) ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      <FlowStepper current={step} steps={STEPS} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: KIT Code, then Identity + Booking Code once it's valid/unused ── */}
        {step === 0 && (
          <>
            <Field label={t("activateVanityNumber.kitCode")}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={kit}
                    onChange={(e) => { setKit(e.target.value.replace(/\D/g, "").slice(0, 10)); setKitUnused(false); setKitError(null); }}
                    placeholder={t("activateVanityNumber.kitCodePlaceholder")}
                    inputMode="numeric"
                    className="h-12 bg-card rounded-xl pe-10"
                  />
                  <button type="button" onClick={() => setKit("1234567890")} className="absolute end-3 top-1/2 -translate-y-1/2 text-primary" aria-label={t("activateVanityNumber.scanKitAria")}>
                    <ScanLine className="w-5 h-5" />
                  </button>
                </div>
                <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!kitFormatValid || checkingKit} onClick={checkKit}>
                  {t("activateVanityNumber.check")}
                </Button>
              </div>
              {kitUnused && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{t("activateVanityNumber.kitValidNote")}</p>
              )}
            </Field>

            <PrototypeTestBox
              heading={t("activateVanityNumber.testKitsHeading")}
              description={t("activateVanityNumber.testDescription")}
              items={[
                { value: "1234567890", note: t("activateVanityNumber.testNoteUnused") },
                { value: "9999999990", note: t("activateVanityNumber.testNoteUsed") },
                { value: "0000000000", note: t("activateVanityNumber.testNoteNotFound") },
              ]}
              onSelect={(v) => { setKit(v); setKitUnused(false); setKitError(null); }}
            />

            {/* Only revealed once the KIT Code checks out — exactly what the client's
                ticket calls for ("Only if the KIT Code is valid/unused show the
                following fields"). */}
            {kitUnused && (
              <>
                <h3 className="text-sm font-semibold text-foreground px-1">{t("activateVanityNumber.identityDetails")}</h3>
                <Field label={t("activation.identity.idType")}>
                    <Select value={idType} onValueChange={(v) => { setIdType(v); if (v === "saudi-id") setNationality("sa"); setIdNumber(demoIdFor(ID_TYPE_RULES[v])); }}>
                      <SelectTrigger className="w-full bg-card rounded-xl h-12">
                        <SelectValue placeholder={t("activation.identity.idType")} />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {ID_TYPE_ORDER.map((key) => (
                          <SelectItem key={key} value={key}>{t(`activation.identity.idTypes.${ID_TYPE_RULES[key].labelKey}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={t("activation.identity.nationality")}>
                    <button
                      type="button"
                      onClick={() => setNationalityPickerOpen(true)}
                      className="flex items-center justify-between w-full h-12 bg-card rounded-xl border border-input px-3 text-sm"
                    >
                      <span>{t(`activation.identity.nationalities.${nationality}`)}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                  </Field>
                  <Field label={t(`activation.identity.idFieldLabels.${idNumberRule?.fieldLabelKey ?? "idNumber"}`)}>
                    <Input
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder={t("activation.identity.idPlaceholder")}
                      className={cn("h-12 bg-card rounded-xl", idNumber.trim().length > 0 && !idNumberValid && "border-destructive focus-visible:ring-destructive")}
                    />
                    {idNumber.trim().length > 0 && !idNumberValid && idNumberRule && (
                      <p className="text-xs text-destructive">
                        {idNumberRule.startDigits
                          ? t("activation.identity.idNumberErrors.startAndLength", { digits: idNumberRule.startDigits.join(", "), length: idNumberRule.length })
                          : t("activation.identity.idNumberErrors.lengthOnly", { length: idNumberRule.length })}
                      </p>
                    )}
                  </Field>
                  <Field label={t("activateVanityNumber.bookingCode")}>
                    <Input
                      value={bookingCode}
                      onChange={(e) => setBookingCode(e.target.value.replace(/\D/g, "").slice(0, BOOKING_CODE_LENGTH))}
                      placeholder={t("activateVanityNumber.bookingCodePlaceholder", { count: BOOKING_CODE_LENGTH })}
                      inputMode="numeric"
                      className={cn("h-12 bg-card rounded-xl", bookingCode.length > 0 && !bookingCodeValid && "border-destructive focus-visible:ring-destructive")}
                    />
                    {bookingCode.length > 0 && !bookingCodeValid && (
                      <p className="text-xs text-destructive">{t("activateVanityNumber.bookingCodeError", { count: BOOKING_CODE_LENGTH })}</p>
                    )}
                  </Field>
              </>
            )}
          </>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <>
            <Field label={t("activateVanityNumber.msisdn")}>
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} icon={<Phone className="w-4 h-4" />} />
            </Field>

            <Field label={t("activateVanityNumber.paymentStatus")}>
              <Select value={paymentStatus} onValueChange={(v: "paid" | "unpaid") => setPaymentStatus(v)}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="paid">{t("activateVanityNumber.paid")}</SelectItem>
                  <SelectItem value="unpaid">{t("activateVanityNumber.unpaid")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("activateVanityNumber.price")}>
              <div className="relative">
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
                  placeholder="0.00"
                  inputMode="decimal"
                  className="h-12 bg-card rounded-xl ps-10"
                />
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  <RiyalSymbol />
                </span>
              </div>
            </Field>

            <Field label={t("activateVanityNumber.subscriptionType")}>
              <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {SUBSCRIPTION_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <section className="bg-card rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{t("activateVanityNumber.isPrimary")}</p>
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            </section>

            {/* Show Option — Top Up / Recharge Card / None, mutually exclusive. */}
            <section className="space-y-2">
              <div className="px-1">
                <h3 className="text-sm font-semibold text-foreground">{t("activateVanityNumber.showOption")}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t("activateVanityNumber.showOptionSub")}</p>
              </div>
              <div className="flex gap-2">
                <OptionTile active={showOption === "topup"} label={t("activateVanityNumber.topUp")} icon={Coins} onClick={() => setShowOption("topup")} />
                <OptionTile active={showOption === "recharge-card"} label={t("activateVanityNumber.rechargeCard")} icon={CreditCard} onClick={() => setShowOption("recharge-card")} />
                <OptionTile active={showOption === "none"} label={t("activateVanityNumber.none")} icon={Ban} onClick={() => { setShowOption("none"); setTopupAmount(null); setRechargeCardCode(""); }} />
              </div>

              {showOption === "topup" && (
                <div className="bg-card rounded-2xl p-4 shadow-sm">
                  <div className="h-12 rounded-xl border border-border/60 flex items-center justify-center mb-3">
                    {topupAmount != null
                      ? <span className="text-base font-bold text-foreground"><RiyalSymbol /> {topupAmount.toFixed(2)}</span>
                      : <span className="text-sm text-muted-foreground">{t("activation.subscription.topupSelectAmount")}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {TOPUP_PRESETS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setTopupAmount(v)}
                        className={cn(
                          "py-2 rounded-full text-[11px] font-medium border transition-colors flex items-center justify-center gap-0.5",
                          topupAmount === v ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground",
                        )}
                      >
                        <RiyalSymbol /> {v.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showOption === "recharge-card" && (
                <div className="bg-card rounded-2xl p-4 shadow-sm">
                  <Field label={t("activateVanityNumber.rechargeCardCode")}>
                    <Input
                      value={rechargeCardCode}
                      onChange={(e) => setRechargeCardCode(e.target.value.replace(/\D/g, "").slice(0, 16))}
                      placeholder={t("activateVanityNumber.rechargeCardCodePlaceholder")}
                      inputMode="numeric"
                      className="h-12 bg-background rounded-xl"
                    />
                    <p className="text-[11px] text-muted-foreground">{t("activateVanityNumber.rechargeCardCodeHint")}</p>
                  </Field>
                </div>
              )}

              {showOption === "none" && (
                <p className="text-[11px] text-muted-foreground px-1">{t("activateVanityNumber.noneSelectedNote")}</p>
              )}
            </section>
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && (
          <>
            <CardSection title={t("activateVanityNumber.summary")} icon={ClipboardList}>
              <SummaryRow label={t("activateVanityNumber.kitCode")} value={kit} />
              <SummaryRow label={t("activateVanityNumber.bookingCode")} value={bookingCode} />
              <SummaryRow label={t("activateVanityNumber.msisdn")} value={msisdn} />
              <SummaryRow label={t("activateVanityNumber.subscriptionType")} value={subscriptionType} />
              <SummaryRow label={t("activateVanityNumber.price")} value={<><RiyalSymbol /> {Number(price || 0).toFixed(2)}</>} />
            </CardSection>

            {/* Contact Information — same boxed Contact Number + Email pairing as Raise
                Customer Complaint, instead of two separate unboxed fields. */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("activateVanityNumber.contactInformation")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
                <Field label={t("activateVanityNumber.contactNumber")}>
                  <Input
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                    inputMode="numeric"
                    className="h-12 bg-background rounded-xl"
                  />
                </Field>
                <Field label={t("activateVanityNumber.email")}>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder={t("activateVanityNumber.emailPlaceholder")}
                    className="h-12 bg-background rounded-xl"
                  />
                </Field>
              </div>
            </div>

            <Field label={t("activateVanityNumber.address")}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("activateVanityNumber.addressPlaceholder")}
                className="h-12 bg-card rounded-xl"
              />
            </Field>

            {/* Same "Customer Verification" step every other flow uses for this exact
                SematiVerification call (NewActivation/SimReplacement/SimTermination) —
                not a bespoke "ID Verification" label for the same underlying component. */}
            <CardSection title={t("activation.checkout.customerVerification")} icon={UserCheck}>
              {idVerified ? (
                <VerifiedBanner label={t("activateVanityNumber.verified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setIdVerifyOpen(true)}>
                  {t("activation.checkout.verifyCustomer")}
                </Button>
              )}
            </CardSection>

            <CardSection title={t("activateVanityNumber.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("activateVanityNumber.verified")} />
              ) : (
                <Button variant="outline" className="w-full" disabled={!idVerified} onClick={() => setOtpOpen(true)}>
                  {t("activateVanityNumber.sendVerifyOtp")}
                </Button>
              )}
              {!idVerified && (
                <p className="text-[11px] text-muted-foreground mt-2">{t("activateVanityNumber.completeIdVerificationFirst")}</p>
              )}
            </CardSection>

            {/* Separate confirmation checkbox, as its own explicit step beyond ID/OTP
                verification themselves. */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 select-none">
                <div
                  role="checkbox"
                  aria-checked={verificationConfirmed}
                  tabIndex={0}
                  onClick={() => setVerificationConfirmed((v) => !v)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setVerificationConfirmed((v) => !v); } }}
                  className={cn(
                    "w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer",
                    verificationConfirmed ? "bg-primary border-primary" : "border-primary",
                  )}
                >
                  {verificationConfirmed && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <p className="text-sm text-foreground text-start flex-1 leading-snug">
                  {t("activateVanityNumber.confirmVerification")}
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
            <Button
              className="w-full h-12 text-sm font-semibold rounded-full"
              disabled={step === 0 ? !canContinueKit : !canContinueDetails}
              onClick={() => setStep((s) => s + 1)}
            >
              {t("activateVanityNumber.continue")}
            </Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
              {t("activateVanityNumber.submit")}
            </Button>
          )}
        </div>
      </div>

      {/* KIT Code error — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!kitError} onOpenChange={(o) => { if (!o) setKitError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("activateVanityNumber.kitErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{kitError}</p>
          <button onClick={() => setKitError(null)} className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm">
            {t("activateVanityNumber.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      {/* Nationality picker drawer */}
      <Drawer open={nationalityPickerOpen} onOpenChange={(o) => { setNationalityPickerOpen(o); if (!o) setNationalitySearch(""); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[88vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between px-5 pt-3 pb-4">
            <h2 className="text-lg font-bold text-foreground">{t("activation.identity.selectNationality")}</h2>
            <button onClick={() => setNationalityPickerOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 mb-3">
            <div className="relative">
              <input
                value={nationalitySearch}
                onChange={(e) => setNationalitySearch(e.target.value)}
                placeholder={t("activation.checkout.search")}
                className="w-full h-11 bg-white rounded-xl ps-4 pe-10 text-sm outline-none border border-input rtl:text-right"
              />
              <svg className="absolute end-3 top-3 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-5 pb-6">
            <div className="rounded-2xl bg-muted/40 border border-border/50 overflow-hidden divide-y divide-border/50">
              {NATIONALITY_CODES
                .filter((code) => t(`activation.identity.nationalities.${code}`).toLowerCase().includes(nationalitySearch.trim().toLowerCase()))
                .map((code) => (
                  <button
                    key={code}
                    onClick={() => { setNationality(code); setNationalityPickerOpen(false); }}
                    className="w-full text-start px-4 py-3.5 hover:bg-muted/30 transition-colors text-base text-foreground"
                  >
                    {t(`activation.identity.nationalities.${code}`)}
                  </button>
                ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ID Verification */}
      <SematiVerification
        open={idVerifyOpen}
        audience="customer"
        allowedMethods={ID_TYPE_VERIFICATION_METHODS[idType]}
        onClose={() => setIdVerifyOpen(false)}
        onVerified={() => { setIdVerifyOpen(false); setIdVerified(true); }}
      />

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("activateVanityNumber.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("activateVanityNumber.otpIncorrect") : t("activateVanityNumber.otpSentViaSms")}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`activate-vanity-otp-${i}`}
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
                  {t("activateVanityNumber.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("activateVanityNumber.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("activateVanityNumber.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("activateVanityNumber.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("activateVanityNumber.resend")}</button>
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
              <h3 className="text-lg font-bold text-foreground mb-1">{t("activateVanityNumber.confirmTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("activateVanityNumber.confirmDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveSubmit}>{t("activateVanityNumber.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("activateVanityNumber.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Cancel flow (top-right X) — same cancel-reason sheet used across activation flows. */}
      <Drawer open={cancelOpen} onOpenChange={(o) => { setCancelOpen(o); if (!o) { setCancelReason(""); setCancelOtherText(""); } }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <DrawerHeader className="text-start px-0 pb-4">
            <DrawerTitle>{t("activateVanityNumber.cancelSheet.title")}</DrawerTitle>
            <DrawerDescription>{t("activateVanityNumber.cancelSheet.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{t("activateVanityNumber.cancelSheet.reasonLabel")} <span className="text-destructive">*</span></label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="h-12 px-4 bg-white border border-border/60 rounded-xl text-sm">
                  <SelectValue placeholder={t("activateVanityNumber.cancelSheet.selectReason")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60 rounded-xl">
                  <SelectItem value="customer-changed-mind">{t("activateVanityNumber.cancelSheet.reasons.customerChangedMind")}</SelectItem>
                  <SelectItem value="missing-documents">{t("activateVanityNumber.cancelSheet.reasons.missingDocuments")}</SelectItem>
                  <SelectItem value="kit-not-available">{t("activateVanityNumber.cancelSheet.reasons.kitNotAvailable")}</SelectItem>
                  <SelectItem value="system-issue">{t("activateVanityNumber.cancelSheet.reasons.systemIssue")}</SelectItem>
                  <SelectItem value="other">{t("activateVanityNumber.cancelSheet.reasons.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cancelReason === "other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-semibold text-foreground">{t("activateVanityNumber.cancelSheet.specify")} <span className="text-destructive">*</span></label>
                <Textarea value={cancelOtherText} onChange={(e) => setCancelOtherText(e.target.value)} placeholder={t("activateVanityNumber.cancelSheet.specifyPlaceholder")} className="min-h-[100px] px-4 py-3 bg-white border border-border/60 rounded-xl text-sm resize-none rtl:text-right" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <Button disabled={!cancelReason || (cancelReason === "other" && !cancelOtherText.trim())} onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); resetAll(); navigate("/"); }} className="w-full h-11 rounded-full">{t("activateVanityNumber.cancelSheet.confirm")}</Button>
            <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); }} className="w-full h-11 rounded-full border-primary text-primary">{t("activateVanityNumber.cancelSheet.keepEditing")}</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success — "the customer should get connected" per the ticket. */}
      <Drawer open={successOpen} onOpenChange={(o) => !o && (setSuccessOpen(false), resetAll(), navigate("/"))}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("activateVanityNumber.connectedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("activateVanityNumber.connectedDesc")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("activateVanityNumber.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}>
            {t("activateVanityNumber.done")}
          </Button>
        </DrawerContent>
      </Drawer>

      {/* Failure — with a shown failure reason, per the ticket. */}
      <Drawer open={failureOpen} onOpenChange={setFailureOpen}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-destructive/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("activateVanityNumber.failedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{failureReason}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("activateVanityNumber.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setFailureOpen(false)}>
              {t("activateVanityNumber.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checkingKit} />
    </div>
  );
};

export default ActivateVanityNumber;
