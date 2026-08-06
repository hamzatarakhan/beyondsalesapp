import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import SimCard from "@/components/activation/SimCard";
import PayOption from "@/components/activation/PayOption";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import SematiVerification from "@/components/SematiVerification";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import {
  DEALER_WALLET_BALANCE,
  VerifiedBanner,
  NATIONALITY_CODES,
  ESIM_DEVICES,
  ID_TYPE_ORDER,
  ID_TYPE_RULES,
  ID_TYPE_VERIFICATION_METHODS,
  type IdTypeRule,
} from "@/pages/NewActivation";
import {
  Phone,
  RefreshCw,
  Wallet,
  ClipboardList,
  AlertCircle,
  Check,
  CheckCircle2,
  XCircle,
  Smartphone,
  QrCode,
  CreditCard,
  HandCoins,
  ChevronDown,
  ScanLine,
  ArrowRight,
  X,
} from "lucide-react";

// ---------- Local UI primitives (mirrors CreditLimitAdjustment.tsx / NewActivation.tsx) ----------
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
interface DemoReplacementCustomer {
  msisdn: string;
  name: string;
  currentSimType: "esim" | "psim";
  subscriptionType: string;
  freeReplacementUsed: boolean;
  idType: string;
  nationality: string;
  idNumber: string;
}

const DEMO_REPLACEMENT_CUSTOMERS: DemoReplacementCustomer[] = [
  { msisdn: "0503333311", name: "Mohammed Al-Qahtani", currentSimType: "psim", subscriptionType: "Postpaid", freeReplacementUsed: false, idType: "saudi-id", nationality: "sa", idNumber: "1029384756" },
  { msisdn: "0503333322", name: "Noura Al-Harbi", currentSimType: "esim", subscriptionType: "Prepaid", freeReplacementUsed: true, idType: "iqama-id", nationality: "sa", idNumber: "2098765432" },
  { msisdn: "0503333333", name: "Khalid Al-Dossari", currentSimType: "psim", subscriptionType: "Data SIM", freeReplacementUsed: true, idType: "gcc-id", nationality: "ae", idNumber: "2233445566" },
];

// Demo ID number — the leading digit adapts to the selected ID Type's start-digit rule
// (mirrors NewActivation.tsx's demoIdFor) so switching type keeps the field valid.
const DEMO_ID_SUFFIX = "029384756";
const demoIdFor = (rule: IdTypeRule | undefined) => (rule?.startDigits?.[0] ?? "1") + DEMO_ID_SUFFIX;

const PHYSICAL_FEE = 15;
const ESIM_FEE = 10;

const SimReplacement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  // Step 0 — Lookup
  const [msisdn, setMsisdn] = useState("0503333311");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoReplacementCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Step 1 — Replacement details
  const [newSimType, setNewSimType] = useState<"esim" | "psim">("psim");
  const [idType, setIdType] = useState("saudi-id");
  const [nationality, setNationality] = useState("sa");
  const [nationalityPickerOpen, setNationalityPickerOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [kit, setKit] = useState("");
  // eSIM supported-devices sheet (same as SIM Activation's).
  const [esimInfoOpen, setEsimInfoOpen] = useState(false);
  const [esimDeviceSearch, setEsimDeviceSearch] = useState("");

  // Step 2 — Checkout
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsChain, setTermsChain] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN lookup — triggered by the Search button, not on every keystroke ----------
  const handleSearch = () => {
    if (!/^\d{10}$/.test(msisdn)) return;
    setCustomer(null);
    setLookupError(null);
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = DEMO_REPLACEMENT_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError(t("simReplacement.lookupErrorNotFound"));
        return;
      }
      setCustomer(found);
      setNewSimType(found.currentSimType);
      // Identity is already on file for an existing subscriber — pre-fill it
      // from the lookup instead of making the dealer retype it from scratch.
      setIdType(found.idType);
      setNationality(found.nationality);
      setIdNumber(found.idNumber);
      setKit("");
    }, 800);
  };

  const eligible = !!customer && !lookupError;

  // ---------- Fee logic ----------
  const isChargeable = !!customer?.freeReplacementUsed;
  const fee = newSimType === "psim" ? PHYSICAL_FEE : ESIM_FEE;

  const isKitValid = newSimType === "esim" || /^\d{10}$/.test(kit);

  // ---------- OTP handlers (same behavior as SIM Activation / Subscription Migration checkout OTP) ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", ""]);
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
      if (d && i === 3) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "1111") {
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
    if (d && i < 3) {
      const el = document.getElementById(`sim-replacement-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("sim-replacement-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  // ID Number must match the selected ID Type's full rule (start digit(s) + exact length),
  // same as SIM Activation's Identity step.
  const idNumberRule = ID_TYPE_RULES[idType];
  const idNumberValid = (() => {
    const v = idNumber.trim();
    if (v.length === 0) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();
  const canContinueDetails = eligible && idNumberValid && isKitValid;
  const canConfirm = verified && otpVerified && terms;

  const resolveReplacement = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`SR-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMsisdn("0503333311");
    setCustomer(null);
    setLookupError(null);
    setNewSimType("psim");
    setVerified(false);
    setOtpVerified(false);
    setTerms(false);
    setPayMethod("wallet");
  };

  const simTypeLabel = (v: "esim" | "psim") => t(`activation.subscription.${v}`);
  const replacementTypeLabel = customer ? `${simTypeLabel(customer.currentSimType)} → ${simTypeLabel(newSimType)}` : "";

  // Hidden per UX decision: a 2-stage stepper adds chrome without adding real progress info.
  // Kept in source in case we want it back — just uncomment the FlowStepper line below.
  const steps = [
    { label: "Replacement", Icon: RefreshCw },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("simReplacement.title")} showBack onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} />
      {/* <FlowStepper current={step} steps={steps} /> */}

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup + Replacement details (merged) ── */}
        {step === 0 && (
          <>
            <Field label={t("simReplacement.msisdn")}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={msisdn}
                    onChange={(e) => { setMsisdn(e.target.value.replace(/\D/g, "").slice(0, 10)); setCustomer(null); setLookupError(null); }}
                    placeholder={t("simReplacement.msisdnPlaceholder")}
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
                  {t("simReplacement.search")}
                </Button>
              </div>
            </Field>

            <PrototypeTestBox
              heading={t("simReplacement.testNumbersHeading")}
              description={t("simReplacement.testDescription")}
              items={[
                { value: "0503333311", note: t("simReplacement.testNotePsimFree") },
                { value: "0503333322", note: t("simReplacement.testNoteEsimUsed") },
                { value: "0503333333", note: t("simReplacement.testNotePsimUsed") },
                { value: "0503333399", note: t("simReplacement.testNoteNotFound") },
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
                <CardSection title={t("simReplacement.customerDetails")} icon={ClipboardList}>
                  <SummaryRow label={t("simReplacement.customerName")} value={customer.name} />
                  <SummaryRow label={t("simReplacement.currentSimType")} value={simTypeLabel(customer.currentSimType)} />
                </CardSection>

                <Field label={t("simReplacement.changeTo")}>
                  <div className="flex gap-3">
                    <SimCard active={newSimType === "psim"} label={t("activation.subscription.psim")} icon={Smartphone} onClick={() => setNewSimType("psim")} />
                    <SimCard active={newSimType === "esim"} label={t("activation.subscription.esim")} icon={QrCode} onClick={() => setNewSimType("esim")} />
                  </div>
                  {newSimType === "esim" && (
                    <button type="button" onClick={() => setEsimInfoOpen(true)} className="w-full mt-3 flex items-center gap-3 text-start p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/25 hover:border-primary/50 transition-all group">
                      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <Smartphone className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{t("activation.subscription.esimSupportedDevices")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{t("activation.subscription.esimSupportedNote")}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-primary/60 shrink-0 rtl:rotate-180" />
                    </button>
                  )}
                  {newSimType === "psim" && (
                    <div className="relative mt-3">
                      <Input
                        value={kit}
                        onChange={(e) => setKit(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder={t("simReplacement.kitCodePlaceholder")}
                        inputMode="numeric"
                        className="h-12 bg-card rounded-xl pe-10"
                      />
                      <button type="button" onClick={() => setKit("1234567890")} className="absolute end-3 top-1/2 -translate-y-1/2 text-primary" aria-label={t("simReplacement.scanKitAria")}>
                        <ScanLine className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </Field>

                <div className="space-y-2">
                  <div className="px-1">
                    <p className="text-sm font-semibold text-foreground">{t("simReplacement.identityDetails")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t("simReplacement.identityDetailsSub")}</p>
                  </div>
                  <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
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
                        className="flex items-center justify-between w-full h-12 bg-card rounded-xl border border-input px-3 text-sm rtl:flex-row-reverse"
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
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Step 1: Checkout ── */}
        {step === 1 && customer && (
          <>
            <CardSection title={t("simReplacement.replacementSummary")} icon={ClipboardList}>
              <SummaryRow label={t("simReplacement.customerName")} value={customer.name} />
              <SummaryRow label={t("simReplacement.replacementType")} value={replacementTypeLabel} />
              {newSimType === "psim" && <SummaryRow label={t("simReplacement.kitCode")} value={kit} />}
              <SummaryRow label={t("simReplacement.fee")} value={isChargeable ? <><RiyalSymbol /> {fee}</> : <span className="text-emerald-600">{t("simReplacement.free")}</span>} />
            </CardSection>

            {isChargeable ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500/20 px-4 py-3 flex items-start gap-3">
                <HandCoins className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-sky-700 dark:text-sky-300 leading-snug">
                  {t(newSimType === "psim" ? "simReplacement.chargeableNotePsim" : "simReplacement.chargeableNoteEsim", { fee })}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-3">
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-emerald-700 dark:text-emerald-300 leading-snug">
                  {t("simReplacement.freeReplacementNote")}
                </p>
              </div>
            )}

            <CardSection title={t("activation.checkout.customerVerification")} icon={Phone}>
              {verified ? (
                <VerifiedBanner label={t("simReplacement.customerVerified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setVerifyOpen(true)}>{t("activation.checkout.verifyCustomer")}</Button>
              )}
            </CardSection>

            <CardSection title={t("activation.checkout.otp")} icon={Phone}>
              {otpVerified ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-4 py-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t("activation.checkout.verifiedTitle")}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">{t("activation.checkout.verifiedDesc")}</p>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("activation.checkout.sendOtp")}</Button>
              )}
            </CardSection>

            {/* Terms & Conditions + Privacy Policy — same combined consent as SIM Activation */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 select-none">
                <div
                  role="checkbox"
                  aria-checked={terms}
                  tabIndex={0}
                  onClick={() => { if (terms) { setTerms(false); } else { setTermsChain(true); setTermsOpen(true); } }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (terms) { setTerms(false); } else { setTermsChain(true); setTermsOpen(true); } } }}
                  className={cn(
                    "w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer",
                    terms ? "bg-primary border-primary" : "border-primary",
                  )}
                >
                  {terms && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <p className="text-sm text-foreground text-start flex-1 leading-snug">
                  {t("activation.checkout.agreeTo")}{" "}
                  <button type="button" onClick={() => setTermsOpen(true)} className="text-primary font-semibold">
                    {t("activation.checkout.terms")}
                  </button>{" "}
                  {t("activation.checkout.consentMiddle")}{" "}
                  <button type="button" onClick={() => setPrivacyOpen(true)} className="text-primary font-semibold">
                    {t("activation.checkout.privacyPolicy")}
                  </button>.
                </p>
              </div>
            </section>

            {isChargeable && (
              <CardSection title={t("simReplacement.paymentMethod")} icon={CreditCard}>
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
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueDetails} onClick={() => setStep(1)}>
              {t("simReplacement.continue")}
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
              {isChargeable ? t("simReplacement.payAmountSar", { amount: fee }) : t("simReplacement.confirmReplacement")}
            </Button>
          )}
        </div>
      </div>

      {/* Customer verification */}
      <SematiVerification open={verifyOpen} audience="customer" allowedMethods={ID_TYPE_VERIFICATION_METHODS[idType]} onClose={() => setVerifyOpen(false)} onVerified={() => { setVerifyOpen(false); setVerified(true); }} />

      {/* OTP verification */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("activation.otpSheet.title")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("activation.otpSheet.errorSubtitle") : t("activation.otpSheet.subtitle")}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`sim-replacement-otp-${i}`}
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
                  {t("activation.otpSheet.resendLabel")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("activation.otpSheet.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("activation.otpSheet.noCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("activation.otpSheet.noCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("activation.otpSheet.resend")}</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Terms drawer */}
      <Drawer open={termsOpen} onOpenChange={setTermsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose className="absolute end-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
            <X className="h-5 w-5 text-foreground" />
          </DrawerClose>
          <DrawerHeader className="text-center">
            <DrawerTitle>{t("activation.termsSheet.title")}</DrawerTitle>
            <DrawerDescription>{t("activation.termsSheet.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3 rtl:text-right">
            <p>{t("activation.termsSheet.p1")}</p>
            <p>{t("activation.termsSheet.p2")}</p>
            <p>{t("activation.termsSheet.p3")}</p>
          </div>
          <DrawerFooter className="flex-col gap-3">
            <DrawerClose asChild>
              <Button onClick={() => { setTermsOpen(false); if (termsChain) { setPrivacyOpen(true); } else { setTerms(true); } }} className="w-full h-12 rounded-full">
                {t("activation.termsSheet.accept")}
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <button type="button" className="text-sm font-semibold text-primary">
                {t("activation.termsSheet.cancel")}
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Privacy Policy drawer */}
      <Drawer open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose className="absolute end-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
            <X className="h-5 w-5 text-foreground" />
          </DrawerClose>
          <DrawerHeader className="text-center">
            <DrawerTitle>{t("activation.privacySheet.title")}</DrawerTitle>
            <DrawerDescription>{t("activation.privacySheet.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3 rtl:text-right">
            <p>{t("activation.privacySheet.p1")}</p>
            <p>{t("activation.privacySheet.p2")}</p>
            <p>{t("activation.privacySheet.p3")}</p>
          </div>
          <DrawerFooter className="flex-col gap-3">
            <DrawerClose asChild>
              <Button onClick={() => { if (termsChain) { setTerms(true); setTermsChain(false); } }} className="w-full h-12 rounded-full">
                {t("activation.privacySheet.close")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* eSIM devices drawer — same content as SIM Activation's */}
      <Drawer open={esimInfoOpen} onOpenChange={(o) => { setEsimInfoOpen(o); if (!o) setEsimDeviceSearch(""); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[88vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="px-5 pt-3 pb-4">
            <h2 className="text-lg font-bold text-foreground">{t("activation.checkout.esimDevicesTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("activation.checkout.esimDevicesNote")}</p>
          </div>
          <div className="px-5 mb-1">
            <div className="relative">
              <input
                value={esimDeviceSearch}
                onChange={(e) => setEsimDeviceSearch(e.target.value)}
                placeholder={t("activation.checkout.search")}
                className="w-full h-11 bg-white rounded-xl ps-4 pe-10 text-base outline-none border border-input rtl:text-right"
                style={{ fontSize: "16px" }}
              />
              <svg className="absolute end-3 top-3 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 px-5 pb-6 pt-3 space-y-4">
            {(() => {
              const filteredDevices = ESIM_DEVICES.filter((d) => d.model.toLowerCase().includes(esimDeviceSearch.trim().toLowerCase()));
              return filteredDevices.length > 0 ? (
                <div className="rounded-2xl bg-muted/40 border border-border/50 overflow-hidden divide-y divide-border/50">
                  {filteredDevices.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-sm text-foreground flex-1">{d.model}</span>
                      <span className="text-[10px] text-muted-foreground">{d.ios}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">{t("activation.checkout.noDevicesFound")}</p>
              );
            })()}
            <p className="text-[11px] text-muted-foreground text-center px-4">{t("activation.checkout.esimUnlocked")}</p>
          </div>
          <div className="px-5 pb-6 pt-2">
            <Button className="w-full rounded-xl" onClick={() => setEsimInfoOpen(false)}>{t("activation.checkout.gotIt")}</Button>
          </div>
        </DrawerContent>
      </Drawer>

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

      {/* Confirm */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("simReplacement.confirmReplacement")}</h3>
              <p className="text-sm text-muted-foreground">
                {isChargeable
                  ? t("simReplacement.confirmPaymentDesc")
                  : t("simReplacement.confirmProcessDesc")}
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveReplacement}>{t("simReplacement.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("simReplacement.cancel")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("simReplacement.replacementCompleteTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {newSimType === "psim"
                ? t("simReplacement.physicalSimNote")
                : t("simReplacement.esimNote")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("simReplacement.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
            {newSimType === "esim" && (
              <div className="mt-4 p-3 bg-white rounded-2xl border border-border">
                <QrCode className="w-40 h-40 text-foreground" strokeWidth={1} />
              </div>
            )}
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("simReplacement.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("simReplacement.replacementFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("simReplacement.replacementFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("simReplacement.tryAgain")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => { setFailureOpen(false); }}
            >
              {t("simReplacement.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default SimReplacement;
