import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PlanSelector, { Plan } from "@/components/activation/PlanSelector";
import PayOption from "@/components/activation/PayOption";
import { PREPAID_PLANS, POSTPAID_PLANS } from "@/pages/NewActivation";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  CreditCard,
  Wallet,
  Receipt,
  Lock,
  AlertCircle,
  Check,
  CheckCircle2,
  XCircle,
  Phone,
} from "lucide-react";

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

const ConsentRow = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) => (
  <section className="bg-card rounded-2xl p-4 shadow-sm">
    <button
      type="button"
      className="flex items-center gap-3 select-none cursor-pointer w-full text-start"
      onClick={onToggle}
    >
      <div
        className={cn(
          "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
          checked ? "bg-primary border-primary" : "border-primary",
        )}
      >
        {checked && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  </section>
);

// ---------- Demo data ----------
type Direction = "pre-to-post" | "post-to-pre";

interface DemoCustomer {
  msisdn: string;
  subscriptionType: "prepaid" | "postpaid";
  planCategory: string;
  planName: string;
  outstandingBalance?: number;
  isWhitelisted?: boolean;
}

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { msisdn: "0501111111", subscriptionType: "prepaid", planCategory: "aman", planName: "Virgin Mobile Aman 60" },
  { msisdn: "0501111122", subscriptionType: "prepaid", planCategory: "base-plan", planName: "Baqah 150", isWhitelisted: true },
  { msisdn: "0501111133", subscriptionType: "prepaid", planCategory: "flex", planName: "Baqah Flex 100" },
  { msisdn: "0501111144", subscriptionType: "prepaid", planCategory: "data", planName: "300 GB (5G MBB)" },
  { msisdn: "0502222211", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 150", outstandingBalance: 245.5 },
  { msisdn: "0502222222", subscriptionType: "postpaid", planCategory: "switch-postpaid", planName: "Switch Postpaid 300", outstandingBalance: 0 },
  { msisdn: "0502222233", subscriptionType: "postpaid", planCategory: "vnet", planName: "Vnet 300 GB" },
];

const ELIGIBLE_PREPAID_CATEGORIES = ["aman", "base-plan", "flex"];

const CATEGORY_LABEL: Record<string, string> = {
  aman: "Aman",
  "base-plan": "Baqah",
  flex: "Baqah Flex",
  data: "5G MBB",
  "switch-postpaid": "Switch Postpaid",
  vnet: "Vnet",
};

const SubscriptionMigration = () => {
  const navigate = useNavigate();

  // ---------- Flow state ----------
  const [direction, setDirection] = useState<Direction | null>(null);
  const [step, setStep] = useState(0);

  // Identity
  const [idType, setIdType] = useState("national-id");
  const [idNumber, setIdNumber] = useState("1324567896");
  const [nationality, setNationality] = useState("sa");
  const [msisdn, setMsisdn] = useState("0501111133");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  // Plan
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [creditCheckAccepted, setCreditCheckAccepted] = useState(false);

  // Checkout — OTP
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);

  // Checkout — payment
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN auto-lookup (mirrors the KIT-code auto-check pattern) ----------
  useEffect(() => {
    setCustomer(null);
    setLookupError(null);
    setDirection(null);
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError("Number not found. Please check the MSISDN and try again.");
        return;
      }
      const dir: Direction = found.subscriptionType === "prepaid" ? "pre-to-post" : "post-to-pre";
      setDirection(dir);
      if (dir === "pre-to-post" && found.planCategory === "data") {
        setLookupError("This number can't migrate — 5G MBB plans aren't eligible for this service.");
        setCustomer(found);
        return;
      }
      if (dir === "post-to-pre" && found.planCategory === "vnet") {
        setLookupError("This number can't migrate — Vnet lines aren't eligible for this service.");
        setCustomer(found);
        return;
      }
      setCustomer(found);
      setIsWhitelisted(!!found.isWhitelisted);
    }, 800);
    return () => clearTimeout(timer);
  }, [msisdn]);

  const eligible = !!customer && !lookupError;

  // ---------- Plan catalogue per direction ----------
  const planList: Plan[] =
    direction === "pre-to-post"
      ? POSTPAID_PLANS.filter((p) => p.categories.includes("switch-postpaid"))
      : PREPAID_PLANS.filter((p) => p.categories.some((c) => ELIGIBLE_PREPAID_CATEGORIES.includes(c)));
  const selectedPlanObj = selectedPlan != null ? planList[selectedPlan] : undefined;

  // ---------- Pricing ----------
  const planPrice = selectedPlanObj?.price ?? 0;
  const deposit = isWhitelisted ? 0 : planPrice;
  const creditLimit = Math.round(planPrice * 0.2 * 100) / 100;
  const outstandingBalance = customer?.outstandingBalance ?? 0;
  const total = direction === "pre-to-post" ? deposit : outstandingBalance;

  // ---------- OTP handlers (same behavior as the SIM Activation checkout OTP) ----------
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
      const el = document.getElementById(`migration-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("migration-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  const canContinueIdentity = !!idType && !!idNumber.trim() && !!nationality && eligible;
  const canContinuePlan =
    selectedPlan != null && termsAccepted && (direction === "post-to-pre" || creditCheckAccepted);
  const canPay = otpVerified;

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
    setIdType("national-id");
    setIdNumber("1324567896");
    setNationality("sa");
    setMsisdn("0501111133");
    setCustomer(null);
    setLookupError(null);
    setIsWhitelisted(false);
    setSelectedPlan(null);
    setTermsAccepted(false);
    setCreditCheckAccepted(false);
    setOtpVerified(false);
    setPayMethod("wallet");
  };

  const steps = [
    { label: "Identity", Icon: ClipboardList },
    { label: "Plan", Icon: Receipt },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title="Subscription Migration" showBack onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} />
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Identity ── */}
        {step === 0 && (
          <>
            <Field label="ID Type">
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="national-id">Saudi ID / Iqama ID</SelectItem>
                  <SelectItem value="gcc-id">GCC ID</SelectItem>
                  <SelectItem value="gcc-passport">GCC Passport</SelectItem>
                  <SelectItem value="visitor-passport">Visitor Passport</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="ID Number">
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter ID number" className="h-12 bg-card rounded-xl" />
            </Field>
            <Field label="Nationality">
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="sa">Saudi</SelectItem>
                  <SelectItem value="om">Omani</SelectItem>
                  <SelectItem value="ae">Emirati</SelectItem>
                  <SelectItem value="eg">Egyptian</SelectItem>
                  <SelectItem value="in">Indian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
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

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}

            {direction === "pre-to-post" && (
              <div
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors cursor-pointer",
                  isWhitelisted ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700" : "bg-card border-border/60",
                )}
                onClick={() => setIsWhitelisted((v) => !v)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isWhitelisted ? "bg-amber-100 dark:bg-amber-800/40" : "bg-muted")}>
                    <Lock className={cn("w-4 h-4", isWhitelisted ? "text-amber-600" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", isWhitelisted ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>Whitelisted Customer</p>
                    <p className="text-[11px] text-muted-foreground">No deposit required for this migration</p>
                  </div>
                </div>
                <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", isWhitelisted ? "bg-amber-500" : "bg-muted-foreground/30")}>
                  <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", isWhitelisted ? "start-5" : "start-0.5")} />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 1: Plan ── */}
        {step === 1 && (
          <>
            {customer && (
              <CardSection title="Subscription" icon={ClipboardList}>
                <SummaryRow label="Subscription Type" value={customer.subscriptionType === "prepaid" ? "Prepaid" : "Postpaid"} />
                <SummaryRow label="Current Plan" value={customer.planName} />
              </CardSection>
            )}
            <h3 className="text-sm font-semibold text-foreground px-1">
              {direction === "pre-to-post" ? "Available Postpaid Plans" : "Available Prepaid Plans"}
            </h3>
            <PlanSelector
              plans={planList}
              selectedPlan={selectedPlan}
              onSelect={(idx) => setSelectedPlan(idx)}
            />
            <ConsentRow label="Terms and Conditions" checked={termsAccepted} onToggle={() => setTermsAccepted((v) => !v)} />
            {direction === "pre-to-post" && (
              <ConsentRow label="Credit Score Check" checked={creditCheckAccepted} onToggle={() => setCreditCheckAccepted((v) => !v)} />
            )}
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && (
          <>
            <CardSection title="OTP Verification" icon={Phone}>
              {otpVerified ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-4 py-3 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Verified</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">This step has been successfully verified.</p>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>Send &amp; verify OTP</Button>
              )}
            </CardSection>

            <CardSection title="Payment Summary" icon={Receipt}>
              {direction === "pre-to-post" ? (
                <>
                  <SummaryRow label="Package Name" value={selectedPlanObj?.title ?? "—"} />
                  <SummaryRow label="Deposit Amount" value={isWhitelisted ? "Waived" : `${deposit} SAR`} />
                  <div className="py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Out-of-Bundle / Credit Limit</span>
                      <span className="text-xs font-semibold text-foreground">{creditLimit} SAR</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Informational only — 20% of the plan price.</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-base font-bold text-primary">{total} SAR</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug pt-1">
                    The customer's prepaid wallet balance will be moved as an advance payment balance on the new line.
                  </p>
                </>
              ) : (
                <>
                  <SummaryRow label="Outstanding Bill" value={`${outstandingBalance} SAR`} />
                  <div className="flex items-center justify-between pt-3 border-t border-border/60">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-base font-bold text-primary">{total} SAR</span>
                  </div>
                </>
              )}
            </CardSection>

            <CardSection title="Payment Method" icon={CreditCard}>
              <div className="space-y-2">
                <PayOption icon={Wallet} label="Dealer Wallet" description="Pay from your wallet (550 SAR balance)" selected={payMethod === "wallet"} onClick={() => setPayMethod("wallet")} />
                <PayOption icon={CreditCard} label="POS Terminal" description="Collect cash or card from the customer" selected={payMethod === "pos"} onClick={() => setPayMethod("pos")} />
              </div>
            </CardSection>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <Button
              className="w-full h-12 text-sm font-semibold rounded-full"
              disabled={step === 0 ? !canContinueIdentity : !canContinuePlan}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setConfirmOpen(true)}>
              Pay {total} SAR
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">Enter Verification Code</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? "The verification code you entered is incorrect. Please try again." : "We sent you a verification code via SMS"}
            </p>
            <div className="flex gap-3">
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
                  Resend the code ?{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">Resend</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  Didn't receive the code?{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  Didn't receive the code?{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">Resend</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirm Payment */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Confirm Payment</h3>
              <p className="text-sm text-muted-foreground">Please confirm the payment has been completed using the selected payment method.</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolvePayment}>Yes, Confirm</Button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">Migration Successful</h3>
            <p className="text-sm text-muted-foreground text-center">
              {direction === "pre-to-post" ? "The customer has been migrated to Postpaid." : "The customer has been migrated to Prepaid."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Reference: <span className="font-semibold text-foreground">{orderId}</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">The customer will receive an SMS confirming this change.</p>
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
            <h3 className="font-semibold text-foreground text-base mb-1">Migration Couldn't Be Completed</h3>
            <p className="text-sm text-muted-foreground text-center">Something went wrong while processing this request. No charge was made.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Reference: <span className="font-semibold text-foreground">{`SM-${Math.floor(100000 + Math.random() * 900000)}`}</span>
            </p>
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

export default SubscriptionMigration;
