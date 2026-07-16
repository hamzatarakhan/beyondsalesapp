import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import SimCard from "@/components/activation/SimCard";
import PayOption from "@/components/activation/PayOption";
import SematiVerification from "@/components/SematiVerification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import {
  DEALER_WALLET_BALANCE,
  VerifiedBanner,
  NATIONALITY_CODES,
  PASSPORT_ID_TYPES,
  BORDER_ID_TYPES,
} from "@/pages/NewActivation";
import {
  Phone,
  RefreshCw,
  Wallet,
  ClipboardList,
  AlertCircle,
  Check,
  XCircle,
  Smartphone,
  QrCode,
  CreditCard,
  HandCoins,
  ChevronDown,
  ScanLine,
  Info,
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
  { msisdn: "0503333311", name: "Mohammed Al-Qahtani", currentSimType: "psim", subscriptionType: "Postpaid", freeReplacementUsed: false, idType: "national-id", nationality: "sa", idNumber: "1029384756" },
  { msisdn: "0503333322", name: "Noura Al-Harbi", currentSimType: "esim", subscriptionType: "Prepaid", freeReplacementUsed: true, idType: "national-id", nationality: "sa", idNumber: "1098765432" },
  { msisdn: "0503333333", name: "Khalid Al-Dossari", currentSimType: "psim", subscriptionType: "Data SIM", freeReplacementUsed: true, idType: "gcc-id", nationality: "ae", idNumber: "2233445566" },
];

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
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [nationalityPickerOpen, setNationalityPickerOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [kit, setKit] = useState("");

  // Step 2 — Checkout
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN auto-lookup ----------
  useEffect(() => {
    setCustomer(null);
    setLookupError(null);
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_REPLACEMENT_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError("Number not found. Please check the MSISDN and try again.");
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
    return () => clearTimeout(timer);
  }, [msisdn]);

  const eligible = !!customer && !lookupError;

  // ---------- Fee logic ----------
  const isChargeable = !!customer?.freeReplacementUsed;
  const fee = newSimType === "psim" ? PHYSICAL_FEE : ESIM_FEE;

  const isKitValid = newSimType === "esim" || /^\d{10}$/.test(kit);

  // ---------- Gates ----------
  const canContinueLookup = eligible;
  const canContinueDetails = idNumber.trim().length > 0 && isKitValid;
  const canConfirm = verified;

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
    setPayMethod("wallet");
  };

  const steps = [
    { label: "Lookup", Icon: Phone },
    { label: "Replacement", Icon: RefreshCw },
    { label: "Checkout", Icon: Wallet },
  ];

  const simTypeLabel = (v: "esim" | "psim") => t(`activation.subscription.${v}`);
  const replacementTypeLabel = customer ? `${simTypeLabel(customer.currentSimType)} → ${simTypeLabel(newSimType)}` : "";

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title="SIM Replacement" showBack onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} />
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup ── */}
        {step === 0 && (
          <>
            <Field label="MSISDN">
              <div className="relative">
                <Input
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="05XXXXXXXX"
                  inputMode="numeric"
                  className="h-12 bg-card rounded-xl pe-10"
                />
                <Phone className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {checking && <p className="text-[11px] text-muted-foreground">Checking number…</p>}
            </Field>

            {customer && (
              <CardSection title="Customer Details" icon={ClipboardList}>
                <SummaryRow label="Customer Name" value={customer.name} />
                <SummaryRow label="Subscription Type" value={customer.subscriptionType} />
                <SummaryRow label="Current SIM Type" value={simTypeLabel(customer.currentSimType)} />
                <SummaryRow
                  label="Free Replacement"
                  value={
                    customer.freeReplacementUsed ? (
                      <span className="text-destructive">Already used</span>
                    ) : (
                      <span className="text-emerald-600">Available</span>
                    )
                  }
                />
              </CardSection>
            )}

            <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="w-3 h-3 text-amber-500 shrink-0" />
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Prototype only — test numbers</p>
              </div>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mb-1.5 leading-snug">
                Use these to try every case. This box won't appear in the real implementation.
              </p>
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80">0503333311 — P-SIM, free replacement available</p>
                <p className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80">0503333322 — E-SIM, free replacement already used</p>
                <p className="text-[10px] font-mono text-amber-600/80 dark:text-amber-400/80">0503333333 — P-SIM, free replacement already used</p>
              </div>
            </div>

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}
          </>
        )}

        {/* ── Step 1: Replacement details ── */}
        {step === 1 && customer && (
          <>
            <CardSection title="Customer Details" icon={ClipboardList}>
              <SummaryRow label="Customer Name" value={customer.name} />
              <SummaryRow label="Current SIM Type" value={simTypeLabel(customer.currentSimType)} />
            </CardSection>

            <Field label="Change To">
              <div className="flex gap-3">
                <SimCard active={newSimType === "psim"} label={t("activation.subscription.psim")} icon={Smartphone} onClick={() => setNewSimType("psim")} />
                <SimCard active={newSimType === "esim"} label={t("activation.subscription.esim")} icon={QrCode} onClick={() => setNewSimType("esim")} />
              </div>
            </Field>

            <div className="space-y-2">
              <div className="px-1">
                <p className="text-sm font-semibold text-foreground">Identity Details</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pre-filled from the customer's record — update if anything has changed.</p>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                <Field label={t("activation.identity.idType")}>
                  <Select value={idType} onValueChange={(v) => { setIdType(v); if (v === "national-id") setNationality("sa"); }}>
                    <SelectTrigger className="w-full bg-card rounded-xl h-12">
                      <SelectValue placeholder={t("activation.identity.idType")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="national-id">{t("activation.identity.idTypes.saudi")}</SelectItem>
                      <SelectItem value="gcc-id">{t("activation.identity.idTypes.gccId")}</SelectItem>
                      <SelectItem value="hajj">{t("activation.identity.idTypes.hajj")}</SelectItem>
                      <SelectItem value="umrah">{t("activation.identity.idTypes.umrah")}</SelectItem>
                      <SelectItem value="gcc-passport">{t("activation.identity.idTypes.gccPassport")}</SelectItem>
                      <SelectItem value="visitor-passport">{t("activation.identity.idTypes.visitorPassport")}</SelectItem>
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
                <Field label={PASSPORT_ID_TYPES.includes(idType) ? t("activation.identity.idPassport") : BORDER_ID_TYPES.includes(idType) ? t("activation.identity.borderIdNumber") : t("activation.identity.idNumber")}>
                  <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={t("activation.identity.idPlaceholder")} className="h-12 bg-card rounded-xl" />
                </Field>

                {newSimType === "psim" && (
                  <Field label="KIT Code">
                    <div className="relative">
                      <Input
                        value={kit}
                        onChange={(e) => setKit(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="KIT Code (10 Digits)"
                        inputMode="numeric"
                        className="h-12 bg-card rounded-xl pe-10"
                      />
                      <button type="button" onClick={() => setKit("1234567890")} className="absolute end-3 top-1/2 -translate-y-1/2 text-primary" aria-label="Scan KIT">
                        <ScanLine className="w-5 h-5" />
                      </button>
                    </div>
                  </Field>
                )}
              </div>
            </div>

          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && customer && (
          <>
            <CardSection title="Replacement Summary" icon={ClipboardList}>
              <SummaryRow label="Customer Name" value={customer.name} />
              <SummaryRow label="Replacement Type" value={replacementTypeLabel} />
              {newSimType === "psim" && <SummaryRow label="KIT Code" value={kit} />}
              <SummaryRow label="Fee" value={isChargeable ? <>{fee} <RiyalSymbol /></> : <span className="text-emerald-600">Free</span>} />
            </CardSection>

            {isChargeable ? (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500/20 px-4 py-3 flex items-start gap-3">
                <HandCoins className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-sky-700 dark:text-sky-300 leading-snug">
                  This customer already used their free replacement. <span className="font-semibold">{fee} SAR</span> will be charged for this {newSimType === "psim" ? "physical SIM" : "eSIM"} replacement.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-3">
                <Wallet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[13px] text-emerald-700 dark:text-emerald-300 leading-snug">
                  This is the customer's free replacement — no payment required.
                </p>
              </div>
            )}

            <CardSection title={t("activation.checkout.customerVerification")} icon={Phone}>
              {verified ? (
                <VerifiedBanner label="Customer Verified" />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setVerifyOpen(true)}>{t("activation.checkout.verifyCustomer")}</Button>
              )}
            </CardSection>

            {isChargeable && (
              <CardSection title="Payment Method" icon={CreditCard}>
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
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueLookup} onClick={() => setStep(1)}>
              Continue
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueDetails} onClick={() => setStep(2)}>
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
              {isChargeable ? `Pay ${fee} SAR` : "Confirm Replacement"}
            </Button>
          )}
        </div>
      </div>

      {/* Customer verification */}
      <SematiVerification open={verifyOpen} audience="customer" onClose={() => setVerifyOpen(false)} onVerified={() => { setVerifyOpen(false); setVerified(true); }} />

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
              <h3 className="text-lg font-bold text-foreground mb-1">Confirm Replacement</h3>
              <p className="text-sm text-muted-foreground">
                {isChargeable
                  ? "Please confirm the payment has been completed using the selected payment method."
                  : "Please confirm you want to process this SIM replacement."}
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveReplacement}>Yes, Confirm</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>Cancel</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">SIM Replacement Complete</h3>
            <p className="text-sm text-muted-foreground text-center">
              {newSimType === "psim"
                ? "The new physical SIM should be active within 30 minutes. A confirmation has also been sent to the customer via SMS and Email."
                : "A new eSIM QR code has been generated below, and also sent to the customer via SMS and Email."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Reference: <span className="font-semibold text-foreground">{orderId}</span>
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
            Done
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
            <h3 className="font-semibold text-foreground text-base mb-1">Replacement Couldn't Be Completed</h3>
            <p className="text-sm text-muted-foreground text-center">Something went wrong while processing this request. No charge was made.</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              Try Again
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => { setFailureOpen(false); }}
            >
              Cancel
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SimReplacement;
