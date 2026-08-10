import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PayOption from "@/components/activation/PayOption";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import SematiVerification from "@/components/SematiVerification";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
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
import { Drawer, DrawerContent, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import {
  DEALER_WALLET_BALANCE,
  VerifiedBanner,
  NATIONALITY_CODES,
  ID_TYPE_ORDER,
  ID_TYPE_RULES,
  ID_TYPE_VERIFICATION_METHODS,
  type IdTypeRule,
} from "@/pages/NewActivation";
import {
  Phone,
  Wallet,
  ClipboardList,
  ReceiptText,
  CreditCard,
  HandCoins,
  AlertCircle,
  Check,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
} from "lucide-react";

// ---------- Local UI primitives (mirrors SimReplacement.tsx / BillPayment.tsx) ----------
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

// ---------- Domain types ----------
type LineType = "prepaid" | "switch-postpaid" | "vnet";

interface TerminationBill {
  status: "Paid" | "Unpaid";
  /** VAT-inclusive total currently due. */
  totalOutstanding: number;
  currentBalance: number;
  outstandingBalance: number;
  outOfBundleUsage: number;
}

interface DemoTerminationLine {
  msisdn: string;
  lineType: LineType;
  /** Vnet lines aren't voice-reachable — their OTP goes to this associated contact number. */
  contactNumber?: string;
  /** Only set for switch-postpaid/vnet — prepaid lines have nothing outstanding to show. */
  bill?: TerminationBill;
}

// Demo ID number — the leading digit adapts to the selected ID Type's start-digit rule
// (mirrors SimReplacement.tsx's demoIdFor) so switching type keeps the field valid, and
// pre-filling it (rather than leaving it blank) speeds through the demo.
const DEMO_ID_SUFFIX = "029384756";
const demoIdFor = (rule: IdTypeRule | undefined) => (rule?.startDigits?.[0] ?? "1") + DEMO_ID_SUFFIX;

// ---------- Demo data ----------
const DEMO_TERMINATION_LINES: DemoTerminationLine[] = [
  { msisdn: "0501110001", lineType: "prepaid" },
  { msisdn: "0501110002", lineType: "prepaid" },
  {
    msisdn: "0501110003",
    lineType: "switch-postpaid",
    bill: { status: "Unpaid", totalOutstanding: 345, currentBalance: 300, outstandingBalance: 45, outOfBundleUsage: 20 },
  },
  {
    msisdn: "0501110004",
    lineType: "vnet",
    contactNumber: "0501110099",
    bill: { status: "Unpaid", totalOutstanding: 512.5, currentBalance: 460, outstandingBalance: 52.5, outOfBundleUsage: 20 },
  },
  // Friendi does carry a couple of legacy Switch Postpaid lines even though new activation is
  // prepaid/basic-postpaid only — this one has nothing left to pay, so it skips the payment step.
  {
    msisdn: "0501110005",
    lineType: "switch-postpaid",
    bill: { status: "Paid", totalOutstanding: 0, currentBalance: 0, outstandingBalance: 0, outOfBundleUsage: 0 },
  },
];

const money = (n: number) => n.toFixed(2);

const SimTermination = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const LINE_TYPE_LABEL: Record<LineType, string> = {
    prepaid: t("simTermination.lineTypePrepaid"),
    "switch-postpaid": t("simTermination.lineTypeSwitchPostpaid"),
    vnet: t("simTermination.lineTypeVnet"),
  };

  const REASON_LABEL: Record<string, string> = {
    "switching-provider": t("simTermination.reasonSwitchingProvider"),
    "no-longer-needed": t("simTermination.reasonNoLongerNeeded"),
    "poor-service": t("simTermination.reasonPoorService"),
    relocating: t("simTermination.reasonRelocating"),
    other: t("simTermination.reasonOther"),
  };

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  // Step 0 — Lookup
  const [msisdn, setMsisdn] = useState("0501110001");
  const [checking, setChecking] = useState(false);
  const [line, setLine] = useState<DemoTerminationLine | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Step 0 — Termination form
  const [idType, setIdType] = useState("saudi-id");
  const [nationality, setNationality] = useState("sa");
  const [nationalityPickerOpen, setNationalityPickerOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [reason, setReason] = useState("");

  // Step 1 — Checkout
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  const [payChoice, setPayChoice] = useState<"pay" | "skip" | null>(null);
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsChain, setTermsChain] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN lookup — triggered by the Search button, not on every keystroke ----------
  const handleSearch = () => {
    if (!/^\d{10}$/.test(msisdn)) return;
    setLine(null);
    setLookupError(null);
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = DEMO_TERMINATION_LINES.find((l) => l.msisdn === msisdn);
      if (!found) {
        setLookupError(t("simTermination.lookupErrorNotFound"));
        return;
      }
      setLine(found);
      setIdType("saudi-id");
      setNationality("sa");
      setIdNumber(demoIdFor(ID_TYPE_RULES["saudi-id"]));
      setReason("");
    }, 800);
  };

  const lineType = line?.lineType ?? "prepaid";
  const isPostpaid = lineType !== "prepaid";
  const bill = line?.bill;
  const needsPayment = isPostpaid && !!bill && bill.totalOutstanding > 0;

  // ---------- Identity validation (same rule set as SIM Activation's Identity step) ----------
  const idNumberRule = ID_TYPE_RULES[idType];
  const idNumberValid = (() => {
    const v = idNumber.trim();
    if (v.length === 0) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();
  const canContinueDetails = !!line && !lookupError && idNumberValid && !!reason;

  // ---------- OTP handlers (same pattern as BillPayment.tsx / NewActivation.tsx checkout OTP) ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
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
      (document.getElementById(`sim-termination-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    (document.getElementById("sim-termination-otp-0") as HTMLInputElement | null)?.focus();
  };

  const otpTarget = lineType === "vnet" ? t("simTermination.otpTargetContact", { number: line?.contactNumber }) : t("simTermination.otpTargetEntered", { number: msisdn });

  // ---------- Gates ----------
  const canConfirm = verified && otpVerified && terms && (!needsPayment || payChoice === "skip" || (payChoice === "pay" && !!payMethod));

  // ---------- Confirm / Success / Failure copy ----------
  const confirmMessage = !needsPayment
    ? t("simTermination.confirmMsgNoPayment")
    : payChoice === "pay"
    ? t("simTermination.confirmMsgPay")
    : t("simTermination.confirmMsgSkip");

  const successMessage = !needsPayment
    ? t("simTermination.successMsgNoPayment")
    : payChoice === "pay"
    ? t("simTermination.successMsgPay", { amount: money(bill!.totalOutstanding) })
    : t("simTermination.successMsgSkip", { amount: money(bill!.totalOutstanding) });

  const resolveTermination = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`ST-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMsisdn("0501110001");
    setLine(null);
    setLookupError(null);
    setIdType("saudi-id");
    setNationality("sa");
    setIdNumber("");
    setReason("");
    setVerified(false);
    setOtpVerified(false);
    setPayChoice(null);
    setPayMethod("wallet");
    setTerms(false);
  };

  // Hidden per UX decision: a 2-stage stepper adds chrome without adding real progress info.
  // Kept in source in case we want it back — just uncomment the FlowStepper line below.
  const steps = [
    { label: "Details", Icon: ClipboardList },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("simTermination.title")} showBack onBackClick={() => (step === 0 ? navigate("/") : setStep(0))} />
      {/* <FlowStepper current={step} steps={steps} /> */}

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup + Termination form ── */}
        {step === 0 && (
          <>
            <Field label={t("simTermination.msisdn")}>
              <div className="flex gap-2">
                <PhoneNumberInput
                  value={msisdn}
                  onChange={(v) => { setMsisdn(v); setLine(null); setLookupError(null); }}
                  icon={<Phone className="w-4 h-4" />}
                  className="flex-1"
                />
                <Button
                  type="button"
                  className="h-12 w-20 rounded-xl shrink-0"
                  disabled={!/^\d{10}$/.test(msisdn) || checking}
                  onClick={handleSearch}
                >
                  {t("simTermination.search")}
                </Button>
              </div>
            </Field>

            <PrototypeTestBox
              heading={t("simTermination.testNumbersHeading")}
              description={t("simTermination.testDescription")}
              items={[
                { value: "0501110001", note: t("simTermination.testNoteVirginPrepaid") },
                { value: "0501110002", note: t("simTermination.testNoteFriendiPrepaid") },
                { value: "0501110003", note: t("simTermination.testNoteVirginPostpaidUnpaid") },
                { value: "0501110004", note: t("simTermination.testNoteVirginVnet") },
                { value: "0501110005", note: t("simTermination.testNoteFriendiPostpaidPaid") },
                { value: "0501119999", note: t("simTermination.testNoteNotFound") },
              ]}
              onSelect={(v) => { setMsisdn(v); setLine(null); setLookupError(null); }}
            />

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}

            {line && (
              <>
                <CardSection title={t("simTermination.lineDetails")} icon={Phone}>
                  <SummaryRow label={t("simTermination.msisdn")} value={line.msisdn} />
                  <SummaryRow label={t("simTermination.subscriptionType")} value={LINE_TYPE_LABEL[line.lineType]} />
                </CardSection>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground px-1">{t("simTermination.identityDetails")}</p>
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
                  </div>
                </div>

                <Field label={t("simTermination.terminationReason")}>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="w-full bg-card rounded-xl h-12">
                      <SelectValue placeholder={t("simTermination.selectReasonPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="switching-provider">{t("simTermination.reasonSwitchingProvider")}</SelectItem>
                      <SelectItem value="no-longer-needed">{t("simTermination.reasonNoLongerNeeded")}</SelectItem>
                      <SelectItem value="poor-service">{t("simTermination.reasonPoorService")}</SelectItem>
                      <SelectItem value="relocating">{t("simTermination.reasonRelocating")}</SelectItem>
                      <SelectItem value="other">{t("simTermination.reasonOther")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
          </>
        )}

        {/* ── Step 1: Checkout ── */}
        {step === 1 && line && (
          <>
            <CardSection title={t("simTermination.terminationSummary")} icon={ClipboardList}>
              <SummaryRow label={t("simTermination.msisdn")} value={line.msisdn} />
              <SummaryRow label={t("simTermination.subscriptionType")} value={LINE_TYPE_LABEL[line.lineType]} />
              <SummaryRow label={t("simTermination.terminationReason")} value={REASON_LABEL[reason] ?? reason} />
            </CardSection>

            <CardSection title={t("activation.checkout.customerVerification")} icon={Phone}>
              {verified ? (
                <VerifiedBanner label={t("simTermination.customerVerified")} />
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
                <>
                  <Button variant="outline" className="w-full disabled:opacity-50" disabled={!verified} onClick={() => setOtpOpen(true)}>{t("activation.checkout.sendOtp")}</Button>
                  {verified ? (
                    <p className="text-[11px] text-muted-foreground mt-2">{t("simTermination.codeSentTo", { target: otpTarget })}</p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-2">{t("simTermination.completeVerificationFirst")}</p>
                  )}
                </>
              )}
            </CardSection>

            {isPostpaid && otpVerified && bill && (
              <>
                <CardSection title={t("simTermination.outstandingBill")} icon={ReceiptText}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">{t("simTermination.status")}</span>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                      bill.status === "Paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                    )}>
                      {bill.status === "Paid" ? t("simTermination.statusPaid") : t("simTermination.statusUnpaid")}
                    </span>
                  </div>
                  <SummaryRow label={t("simTermination.totalOutstandingVat")} value={<><RiyalSymbol /> {money(bill.totalOutstanding)}</>} />
                  <SummaryRow label={t("simTermination.currentBalance")} value={<><RiyalSymbol /> {money(bill.currentBalance)}</>} />
                  <SummaryRow label={t("simTermination.outstandingBalance")} value={<><RiyalSymbol /> {money(bill.outstandingBalance)}</>} />
                  <SummaryRow label={t("simTermination.outOfBundleUsage")} value={<><RiyalSymbol /> {money(bill.outOfBundleUsage)}</>} />
                </CardSection>

                {needsPayment && (
                  <CardSection title={t("simTermination.payment")} icon={CreditCard}>
                    <div className="space-y-2">
                      <PayOption icon={Wallet} label={t("simTermination.payBillNow")} description={t("simTermination.payBillNowDesc")} selected={payChoice === "pay"} onClick={() => setPayChoice("pay")} />
                      <PayOption icon={XCircle} label={t("simTermination.terminateWithoutPaying")} description={t("simTermination.terminateWithoutPayingDesc")} selected={payChoice === "skip"} onClick={() => setPayChoice("skip")} />
                    </div>
                    {payChoice === "pay" && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{t("simTermination.paymentMethod")}</p>
                        <PayOption icon={CreditCard} label={t("activation.checkout.dealerWallet")} description={t("activation.checkout.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE.toFixed(2) })} selected={payMethod === "wallet"} onClick={() => setPayMethod("wallet")} />
                        <PayOption icon={HandCoins} label={t("activation.checkout.posTerminal")} description={t("activation.checkout.posTerminalDesc")} selected={payMethod === "pos"} onClick={() => setPayMethod("pos")} />
                      </div>
                    )}
                  </CardSection>
                )}
              </>
            )}

            {/* Terms & Conditions + Privacy Policy — same combined consent as SIM Activation / SIM Replacement */}
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
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueDetails} onClick={() => setStep(1)}>
              {t("simTermination.continue")}
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
              {needsPayment && payChoice === "pay" ? t("simTermination.payAndTerminate", { amount: money(bill!.totalOutstanding) }) : t("simTermination.confirmTermination")}
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
              {otpError ? t("activation.otpSheet.errorSubtitle") : t("simTermination.otpSentTo", { target: otpTarget })}
            </p>
            <div className="flex gap-2" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`sim-termination-otp-${i}`}
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
              {otpError || otpSecondsLeft === 0 ? (
                <>
                  {t("activation.otpSheet.resendLabel")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("activation.otpSheet.resend")}</button>
                </>
              ) : (
                <>
                  {t("activation.otpSheet.noCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
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
              <h3 className="text-lg font-bold text-foreground mb-1">{t("simTermination.confirmTermination")}</h3>
              <p className="text-sm text-muted-foreground">{confirmMessage}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveTermination}>{t("simTermination.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("simTermination.cancel")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("simTermination.terminatedSuccessfullyTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{successMessage}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("simTermination.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("simTermination.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("simTermination.terminationFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("simTermination.terminationFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("simTermination.tryAgain")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => { setFailureOpen(false); }}
            >
              {t("simTermination.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default SimTermination;
