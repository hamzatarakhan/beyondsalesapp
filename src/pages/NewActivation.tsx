import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import FlowStepper, { NEW_ACTIVATION_STEPS } from "@/components/FlowStepper";
import SematiVerification from "@/components/SematiVerification";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import PlanCard, { PlanCardData } from "@/components/PlanCard";
import SimCard from "@/components/activation/SimCard";
import PayOption from "@/components/activation/PayOption";
import SourceTab from "@/components/activation/SourceTab";
import PlanSelector, { PLANS as SHARED_PLANS, Plan as SharedPlan } from "@/components/activation/PlanSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Smartphone,
  Wifi,
  Router,
  CreditCard,
  ShieldCheck,
  Pencil,
  Info,
  X as XIcon,
  X,
  ClipboardList,
  Check,
  Phone,
  Sparkles,
  ArrowRightLeft,
  ArrowRight,
  ScanLine,
  Tag,
  Database,
  FileText,
  HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";

// ---------- Types & constants ----------
type Service = "mobile" | "mbb" | "hbb";
type SimType = "psim" | "esim";
type SubType = "sim" | "mnp";
type PayType = "prepaid" | "postpaid";
type PlanMode = "plan" | "topup";
type PayMethod = "card" | "cash" | "apple";

const SERVICES: { value: Service; label: string; desc: string; Icon: typeof Smartphone }[] = [
  { value: "mobile", label: "Mobile", desc: "Prepaid / Postpaid line", Icon: Smartphone },
  { value: "mbb", label: "MBB", desc: "Mobile Broadband — Prepaid 5G Internet", Icon: Wifi },
  { value: "hbb", label: "HBB", desc: "Home Broadband - Postpaid 5G Vnet", Icon: Router },
];

const plans = SHARED_PLANS;
const TOPUP_DENOMS = [10, 20, 50, 100, 200];
const OPERATORS = ["STC", "Mobily", "Zain", "Virgin", "Lebara"];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];

const ESIM_DEVICES = [
  { model: "iPhone XS / XS Max / XR", ios: "iOS 12.1+", emoji: "📱", supported: true },
  { model: "iPhone 11 / Pro / Pro Max", ios: "iOS 13+", emoji: "📱", supported: true },
  { model: "iPhone 12 / Mini / Pro / Pro Max", ios: "iOS 14+", emoji: "📱", supported: true },
  { model: "iPhone 13 series", ios: "iOS 15+", emoji: "📱", supported: true },
  { model: "iPhone 14 series", ios: "iOS 16+", emoji: "📱", supported: true },
  { model: "iPhone 15 series", ios: "iOS 17+", emoji: "📱", supported: true },
  { model: "iPhone 16 series", ios: "iOS 18+", emoji: "📱", supported: true },
  { model: "iPad Pro (2018+)", ios: "iPadOS 12.1+", emoji: "⬛", supported: true },
  { model: "iPad Air (3rd gen+)", ios: "iPadOS 13+", emoji: "⬛", supported: true },
  { model: "iPad Mini (5th gen+)", ios: "iPadOS 13+", emoji: "⬛", supported: true },
];

// ---------- Small UI helpers ----------
const SegmentedTabs = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}) => (
  <div className="grid gap-1 bg-muted/60 rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map((opt) => (
      <button
        key={opt.value}
        disabled={opt.disabled}
        onClick={() => onChange(opt.value)}
        className={cn(
          "h-9 rounded-lg text-xs font-medium transition-colors",
          value === opt.value
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground",
          opt.disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const SectionCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

// ---------- Summary row ----------
const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-right">{value}</span>
  </div>
);

// ---------- Page ----------
const NewActivation = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Stage 1 — Identity
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [idNumber, setIdNumber] = useState("1324567896");

  // Stage 2 — Service & SIM
  const [service, setService] = useState<Service>("mobile");
  const [simType, setSimType] = useState<SimType>("psim");
  const [kit, setKit] = useState("");
  const [esimInfoOpen, setEsimInfoOpen] = useState(false);

  // Stage 3 — Subscription
  const [subType, setSubType] = useState<SubType>("sim");
  const [phone, setPhone] = useState("0785599574");
  const [portNumber, setPortNumber] = useState("");
  const [portOperator, setPortOperator] = useState("");
  const [portContact, setPortContact] = useState("");
  const [payType, setPayType] = useState<PayType>("prepaid");
  const [planMode, setPlanMode] = useState<PlanMode>("plan");
  const [selectedPlan, setSelectedPlan] = useState<number>(0);
  const [topupDenom, setTopupDenom] = useState<number | null>(50);
  const [topupManual, setTopupManual] = useState("");
  const [addrCity, setAddrCity] = useState("Riyadh");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrEmail, setAddrEmail] = useState("");

  // Stage 4 — Checkout
  const [pay, setPay] = useState<PayMethod>("card");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [customerVerifyOpen, setCustomerVerifyOpen] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerSig, setCustomerSig] = useState<string | null>(null);
  const [dealerSig, setDealerSig] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [sigEditor, setSigEditor] = useState<"customer" | "dealer" | null>(null);

  // Cancel activation dialog state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelOtherText, setCancelOtherText] = useState<string>("");

  // ---------- Conditional rules ----------
  const simOptions = useMemo<{ value: SimType; label: string; disabled?: boolean }[]>(() => {
    if (service === "hbb") return [{ value: "psim", label: "P-SIM" }, { value: "esim", label: "E-SIM", disabled: true }];
    return [{ value: "psim", label: "P-SIM" }, { value: "esim", label: "E-SIM" }];
  }, [service]);

  useEffect(() => {
    if (service === "hbb" && simType === "esim") setSimType("psim");
    if (service === "mbb" && payType === "postpaid") setPayType("prepaid");
    if (service === "hbb" && payType === "prepaid") setPayType("postpaid");
    if (service === "hbb" && planMode === "topup") setPlanMode("plan");
  }, [service, simType, payType, planMode]);

  const payOptions = useMemo<{ value: PayType; label: string; disabled?: boolean }[]>(() => {
    if (service === "mbb") return [{ value: "prepaid", label: "Prepaid" }, { value: "postpaid", label: "Postpaid", disabled: true }];
    if (service === "hbb") return [{ value: "prepaid", label: "Prepaid 5G" }, { value: "postpaid", label: "Postpaid 5G / Vnet" }];
    return [{ value: "prepaid", label: "Prepaid" }, { value: "postpaid", label: "Postpaid" }];
  }, [service]);

  const showTopupOption = service !== "hbb" && service !== "mbb";
  const isKitValid = simType === "esim" || /^\d{10}$/.test(kit);

  // ---------- Stage gating ----------
  const canContinue = useMemo(() => {
    if (step === 0) return !!idType && !!nationality && idNumber.trim().length > 0;
    if (step === 1) return !!service && !!simType && isKitValid;
    if (step === 2) {
      if (subType === "mnp" && (!portNumber || !portOperator || !portContact)) return false;
      if (planMode === "plan" && selectedPlan == null) return false;
      if (planMode === "topup" && !topupDenom && !topupManual) return false;
      return true;
    }
    return true;
  }, [step, idType, nationality, idNumber, service, simType, isKitValid, subType, portNumber, portOperator, portContact, planMode, selectedPlan, topupDenom, topupManual]);

  const selectedPlanObj = plans[selectedPlan];
  const topupAmount = topupManual ? Number(topupManual) : topupDenom ?? 0;
  const subtotal = planMode === "plan" ? selectedPlanObj?.price ?? 0 : topupAmount;
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;

  const canPay = otpVerified && customerVerified && !!customerSig && !!dealerSig && terms;

  // ---------- Handlers ----------
  const onBack = () => {
    if (step === 0) navigate("/");
    else setStep((s) => (s - 1) as 0 | 1 | 2 | 3);
  };

  const onContinue = () => {
    if (step < 3) setStep((s) => (s + 1) as 0 | 1 | 2 | 3);
  };

  const onPay = () => {
    setSuccessOpen(true);
  };

  const orderId = useMemo(() => "NA-" + Math.floor(Math.random() * 900000 + 100000), [successOpen]);

  return (
    <div className="mobile-container bg-background min-h-screen pb-32">
      <AppHeader
        title="New Activation"
        showBack
        onBackClick={onBack}
        rightElement={
          <button
            onClick={() => setCancelOpen(true)}
            aria-label="Cancel activation"
            className="w-10 h-10 flex items-center justify-center -mr-2"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        }
      />
      <FlowStepper current={step} steps={NEW_ACTIVATION_STEPS} />

      <div className="px-4 space-y-4">
        {/* Stage 1 — Identity */}
        {step === 0 && (
          <>
            <Field label="ID Type">
              <Select
                value={idType}
                onValueChange={(v) => {
                  setIdType(v);
                  if (v === "national-id") setNationality("sa");
                }}
              >
                <SelectTrigger className="w-full bg-card rounded-xl h-12 shadow-sm border-0">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="national-id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="resident-card">Resident Card</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Nationality">
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12 shadow-sm border-0">
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
            <Field label="ID Number">
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter the ID Number"
                className="h-12 bg-card rounded-xl shadow-sm border-0"
              />
            </Field>
          </>
        )}

        {/* Stage 2 — Service & SIM */}
        {step === 1 && (
          <>
            <SectionCard title="Service type">
              <div className="grid gap-2">
                {SERVICES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setService(s.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                      service === s.value ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", service === s.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <s.Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </SectionCard>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                SIM Type <span className="text-destructive">*</span>
              </h3>
              {service === "hbb" ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="6" y="3" width="12" height="18" rx="2" /><path d="M10 8h4M10 12h4M10 16h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Physical SIM only</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">HBB routers use P-SIM — eSIM is not supported</p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">Auto-selected</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {simOptions.map((opt) => (
                    <SimCard
                      key={opt.value}
                      active={simType === opt.value}
                      label={opt.label}
                      disabled={opt.disabled}
                      onClick={() => setSimType(opt.value)}
                    />
                  ))}
                </div>
              )}
              {simType === "esim" && (
                <button
                  type="button"
                  onClick={() => setEsimInfoOpen(true)}
                  className="w-full mt-3 flex items-center gap-3 text-left p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/25 hover:border-primary/50 hover:from-primary/15 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">Supported devices &amp; iOS versions</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">iPhone XS and later · iOS 12.1+</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-primary/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </section>

            {simType === "psim" && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  KIT <span className="text-destructive">*</span>
                </h3>
                <div className="relative">
                  <Input
                    value={kit}
                    onChange={(e) => setKit(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="KIT Code (10 Digits)"
                    className="h-12 bg-card border-0 rounded-xl shadow-sm pr-12"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onClick={() => setKit("1234567890")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                    aria-label="Scan KIT"
                  >
                    <ScanLine className="w-5 h-5" />
                  </button>
                </div>
                {kit && !isKitValid && (
                  <p className="text-xs text-destructive mt-1.5">KIT must be 10 digits</p>
                )}
              </section>
            )}
          </>
        )}

        {/* Stage 3 — Subscription details */}
        {step === 2 && (
          <>
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Phone number <span className="text-destructive">*</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setSubType("sim")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-colors",
                    subType === "sim" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  New number
                </button>
                <button
                  onClick={() => setSubType("mnp")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-colors",
                    subType === "mnp" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Port (MNP)
                </button>
              </div>

              {subType === "sim" ? (
                <>
                  <div className="bg-primary/5 rounded-xl py-3 text-center text-lg font-semibold tracking-wide text-foreground mb-3">
                    {phone}
                  </div>
                  {simType === "psim" && (
                    <button
                      onClick={() =>
                        setPhone(
                          "07" + Math.floor(10000000 + Math.random() * 89999999).toString(),
                        )
                      }
                      className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-sm font-semibold"
                    >
                      Pick Different Number <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <Field label="Port number">
                    <Input value={portNumber} onChange={(e) => setPortNumber(e.target.value)} placeholder="05XXXXXXXX" inputMode="numeric" />
                  </Field>
                  <Field label="Current operator">
                    <Select value={portOperator} onValueChange={setPortOperator}>
                      <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
                      <SelectContent>{OPERATORS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Contact number">
                    <Input value={portContact} onChange={(e) => setPortContact(e.target.value)} placeholder="05XXXXXXXX" inputMode="numeric" />
                  </Field>
                  <p className="text-[11px] text-muted-foreground">
                    The number will be transferred from the selected operator after verification.
                  </p>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2">Subscription Type</h3>
              {service === "mbb" ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Prepaid only</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">MBB plans are prepaid by default — postpaid is not available</p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">Auto-selected</span>
                </div>
              ) : service === "hbb" ? (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <HandCoins className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Postpaid only</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Vnet plans are postpaid — prepaid is not available</p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded-lg">Auto-selected</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {payOptions.map((opt) => {
                    const selected = payType === opt.value;
                    const Icon = opt.value === "prepaid" ? FileText : HandCoins;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => !opt.disabled && setPayType(opt.value)}
                        className={cn(
                          "relative rounded-2xl border p-4 flex flex-col items-center justify-center gap-2 transition-colors",
                          selected ? "border-primary bg-primary/10" : "border-border bg-card",
                          opt.disabled && "opacity-50",
                        )}
                      >
                        <span className={cn("absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center", selected ? "border-primary" : "border-muted-foreground/40")}>
                          {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </span>
                        <Icon className={cn("w-6 h-6", selected ? "text-primary" : "text-foreground")} />
                        <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {showTopupOption && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Plan type <span className="text-destructive">*</span></h3>
                <div className="grid grid-cols-2 border-b border-border">
                  <SourceTab
                    active={planMode === "plan"}
                    icon={Tag}
                    label="With plan"
                    onClick={() => setPlanMode("plan")}
                  />
                  <SourceTab
                    active={planMode === "topup"}
                    icon={Database}
                    label="With top-up"
                    onClick={() => setPlanMode("topup")}
                  />
                </div>
              </section>
            )}

            {planMode === "plan" ? (
              <PlanSelector
                selectedPlan={selectedPlan}
                onSelect={(i) => setSelectedPlan(i)}
              />
            ) : (
              <SectionCard title="Top-up">
                <Field label="Denomination">
                  <div className="grid grid-cols-3 gap-2">
                    {TOPUP_DENOMS.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setTopupDenom(d); setTopupManual(""); }}
                        className={cn(
                          "h-10 rounded-lg border text-sm font-medium",
                          topupDenom === d && !topupManual ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground",
                        )}
                      >
                        {d} SAR
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Or enter amount manually">
                  <Input
                    value={topupManual}
                    onChange={(e) => { setTopupManual(e.target.value.replace(/\D/g, "")); setTopupDenom(null); }}
                    placeholder="Amount in SAR"
                    inputMode="numeric"
                  />
                </Field>
              </SectionCard>
            )}

            <SectionCard title="Address details">
              <Field label="City">
                <Select value={addrCity} onValueChange={setAddrCity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Address"><Input value={addrAddress} onChange={(e) => setAddrAddress(e.target.value)} placeholder="Enter full address" /></Field>
              <Field label="Email"><Input value={addrEmail} onChange={(e) => setAddrEmail(e.target.value)} placeholder="example@email.com" inputMode="email" /></Field>
            </SectionCard>
          </>
        )}

        {/* Stage 4 — Checkout */}
        {step === 3 && (
          <>
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Summary</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
              <SummaryRow label="Service" value={SERVICES.find((s) => s.value === service)!.label} />
              <SummaryRow label="SIM Type" value={simType === "psim" ? "P-SIM" : "E-SIM"} />
              {simType === "psim" && <SummaryRow label="KIT" value={kit} />}
              <SummaryRow label="Subscription" value={subType === "sim" ? "SIM Number" : "MNP"} />
              {subType === "mnp" && (
                <>
                  <SummaryRow label="Port number" value={portNumber} />
                  <SummaryRow label="From operator" value={portOperator} />
                </>
              )}
              <SummaryRow label="Subscription type" value={payOptions.find((o) => o.value === payType)!.label} />
              {planMode === "plan" ? (
                <SummaryRow label="Plan" value={`${selectedPlanObj?.title} · ${selectedPlanObj?.price} SAR`} />
              ) : (
                <SummaryRow label="Top-up" value={`${topupAmount} SAR`} />
              )}
              <SummaryRow label="City" value={addrCity} />
              <SummaryRow label="Address" value={addrAddress} />
              <SummaryRow label="Email" value={addrEmail} />
            </section>

            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  Select Payment Method <span className="text-destructive">*</span>
                </p>
              </div>
              <div className="space-y-2">
                <PayOption icon={CreditCard} label="Dealer Wallet" selected={pay === "card"} onClick={() => setPay("card")} />
              </div>
            </section>

            <SectionCard title="OTP Verification">
              {otpVerified ? (
                <p className="text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> OTP verified</p>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>
                  Send &amp; verify OTP
                </Button>
              )}
            </SectionCard>

            <SectionCard title="Customer verification">
              {customerVerified ? (
                <p className="text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Customer verified</p>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!otpVerified}
                  onClick={() => setCustomerVerifyOpen(true)}
                >
                  Verify customer
                </Button>
              )}
              {!otpVerified && (
                <p className="text-xs text-muted-foreground">Complete OTP verification first.</p>
              )}
            </SectionCard>

            <SignatureBox
              title="Customer Signature"
              required
              value={customerSig}
              onEdit={() => setSigEditor("customer")}
              onClear={() => setCustomerSig(null)}
            />
            <SignatureBox
              title="Dealer Signature"
              required
              value={dealerSig}
              onEdit={() => setSigEditor("dealer")}
              onClear={() => setDealerSig(null)}
            />

            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <SummaryRow label="Subtotal" value={`${subtotal} SAR`} />
              <div className="flex items-start justify-between gap-3 py-2">
                <span className="text-[11px] text-muted-foreground">VAT (15%)</span>
                <span className="text-xs font-semibold text-foreground text-right">{vat} SAR</span>
              </div>
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/60">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-primary">{total} SAR</span>
              </div>
            </section>

            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 select-none">
                <input
                  id="terms-checkbox"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-primary text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <Drawer open={termsOpen} onOpenChange={setTermsOpen}>
                  <DrawerTrigger asChild>
                    <button
                      type="button"
                      className="text-sm text-foreground text-left"
                    >
                      Terms and Conditions
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                      <X className="h-5 w-5 text-foreground" />
                      <span className="sr-only">Close</span>
                    </DrawerClose>
                    <DrawerHeader className="text-center">
                      <DrawerTitle>Terms and Conditions</DrawerTitle>
                      <DrawerDescription>
                        Please read and accept our terms and conditions to continue.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3">
                      <p>
                        By activating this line, you agree to our service terms,
                        including fair usage policies, payment obligations, and applicable
                        regulatory requirements.
                      </p>
                      <p>
                        All provided information must be accurate. The SIM/eSIM and selected
                        number are subject to availability and approval.
                      </p>
                      <p>
                        Plans, top-ups, and vanity fees are non-refundable once the activation
                        is completed. VAT is included where stated.
                      </p>
                    </div>
                    <DrawerFooter className="flex-col gap-3">
                      <DrawerClose asChild>
                        <Button
                          onClick={() => setTerms(true)}
                          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
                        >
                          Accept
                        </Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <button
                          type="button"
                          className="text-sm font-semibold text-primary"
                        >
                          Cancel
                        </button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Sticky bottom action */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 3 ? (
            <Button className="w-full h-12 text-sm font-semibold" disabled={!canContinue} onClick={onContinue}>
              Continue
            </Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold" disabled={!canPay} onClick={onPay}>
              Pay {total} SAR
            </Button>
          )}
        </div>
      </div>

      {/* Customer verification on checkout */}
      <SematiVerification
        open={customerVerifyOpen}
        audience="customer"
        onClose={() => setCustomerVerifyOpen(false)}
        onVerified={() => { setCustomerVerifyOpen(false); setCustomerVerified(true); }}
      />

      {/* eSIM devices drawer */}
      <Drawer open={esimInfoOpen} onOpenChange={setEsimInfoOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[88vh] flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-9 h-1 bg-muted-foreground/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 pb-4">
            <h2 className="text-lg font-bold text-foreground">Compatible Devices</h2>
            <p className="text-xs text-muted-foreground mt-0.5">iPhone XS and later support eSIM</p>
          </div>

          <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-5">
            {/* iPhone SVG illustration */}
            <div className="flex justify-center py-2">
              <svg width="160" height="220" viewBox="0 0 160 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Phone body */}
                <rect x="18" y="4" width="124" height="212" rx="24" fill="#1C1C1E"/>
                {/* Highlight edge */}
                <rect x="18" y="4" width="124" height="212" rx="24" stroke="#3A3A3C" strokeWidth="1.5"/>
                {/* Screen */}
                <rect x="24" y="10" width="112" height="200" rx="20" fill="#F2F2F7"/>
                {/* Dynamic Island */}
                <rect x="56" y="18" width="48" height="14" rx="7" fill="#1C1C1E"/>
                {/* Status bar time */}
                <text x="32" y="28" fontFamily="system-ui" fontSize="8" fontWeight="600" fill="#1C1C1E">9:41</text>
                {/* Settings header */}
                <rect x="24" y="38" width="112" height="22" fill="#F2F2F7"/>
                <text x="80" y="53" fontFamily="system-ui" fontSize="9" fontWeight="600" fill="#1C1C1E" textAnchor="middle">Cellular</text>
                {/* Divider */}
                <line x1="24" y1="60" x2="136" y2="60" stroke="#C6C6C8" strokeWidth="0.5"/>
                {/* eSIM row - highlighted */}
                <rect x="30" y="65" width="100" height="26" rx="8" fill="#007AFF" opacity="0.12"/>
                <rect x="30" y="65" width="100" height="26" rx="8" stroke="#007AFF" strokeWidth="0.8"/>
                <circle cx="44" cy="78" r="6" fill="#007AFF"/>
                <text x="55" y="82" fontFamily="system-ui" fontSize="8" fontWeight="600" fill="#007AFF">Add eSIM</text>
                {/* Chevron */}
                <path d="M122 75 L126 78 L122 81" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                {/* Regular rows */}
                <rect x="30" y="97" width="100" height="22" rx="6" fill="white"/>
                <text x="42" y="112" fontFamily="system-ui" fontSize="7.5" fill="#1C1C1E">Primary — STC</text>
                <circle cx="124" cy="108" r="3" fill="#34C759"/>
                <rect x="30" y="124" width="100" height="22" rx="6" fill="white"/>
                <text x="42" y="139" fontFamily="system-ui" fontSize="7.5" fill="#8E8E93">Secondary</text>
                <text x="105" y="139" fontFamily="system-ui" fontSize="7" fill="#C7C7CC">Off</text>
                {/* Hint text */}
                <text x="80" y="165" fontFamily="system-ui" fontSize="7" fill="#8E8E93" textAnchor="middle">Tap "Add eSIM" to scan QR</text>
                {/* Home bar */}
                <rect x="60" y="198" width="40" height="3" rx="1.5" fill="#1C1C1E" opacity="0.2"/>
                {/* Side buttons */}
                <rect x="14" y="68" width="4" height="18" rx="2" fill="#3A3A3C"/>
                <rect x="14" y="92" width="4" height="28" rx="2" fill="#3A3A3C"/>
                <rect x="142" y="80" width="4" height="32" rx="2" fill="#3A3A3C"/>
              </svg>
            </div>

            {/* Device list */}
            <div className="rounded-2xl bg-muted/40 overflow-hidden divide-y divide-border/50">
              {ESIM_DEVICES.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1">{d.model}</span>
                  <span className="text-[10px] text-muted-foreground">{d.ios}</span>
                </div>
              ))}
            </div>

            {/* Note */}
            <p className="text-[11px] text-muted-foreground text-center px-4">
              Device must be <span className="text-foreground font-medium">unlocked</span> with an active internet connection.
            </p>
          </div>

          <div className="px-5 pb-6 pt-2">
            <Button className="w-full rounded-xl" onClick={() => setEsimInfoOpen(false)}>
              Got it
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl">
          <DrawerHeader>
            <DrawerTitle className="text-center">OTP Verification</DrawerTitle>
            <DrawerDescription className="text-center text-xs">
              Enter the 4-digit code sent to the customer's number
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-6 space-y-3">
            <Input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              inputMode="numeric"
              className="text-center tracking-[0.5em] text-lg"
            />
            <p className="text-xs text-muted-foreground text-center">Demo: any 4 digits will work</p>
            <Button
              className="w-full"
              disabled={otpCode.length !== 4}
              onClick={() => { setOtpVerified(true); setOtpOpen(false); setOtpCode(""); }}
            >
              Verify
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Terms drawer */}
      <Drawer open={termsOpen} onOpenChange={setTermsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-5 w-5 text-foreground" />
            <span className="sr-only">Close</span>
          </DrawerClose>
          <DrawerHeader className="text-center">
            <DrawerTitle>Terms and Conditions</DrawerTitle>
            <DrawerDescription>
              Please read and accept our terms and conditions to continue.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3">
            <p>By proceeding, the customer agrees to the service agreement, billing terms, and acceptable use policy.</p>
            <p>All activations are subject to identity verification and regulatory approval. The customer acknowledges receipt of the SIM/eSIM and authorizes the selected plan or top-up amount.</p>
            <p>Refunds, replacements, and cancellations follow the standard policy available in the merchant portal.</p>
          </div>
          <DrawerFooter className="flex-col gap-3">
            <DrawerClose asChild>
              <Button
                onClick={() => setTerms(true)}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                Accept
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <button type="button" className="text-sm font-semibold text-primary">
                Cancel
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Signature pad sheet */}
      <SignaturePadSheet
        open={sigEditor !== null}
        title={sigEditor === "customer" ? "Customer Signature" : "Dealer Signature"}
        initial={sigEditor === "customer" ? customerSig : sigEditor === "dealer" ? dealerSig : null}
        onClose={() => setSigEditor(null)}
        onSave={(dataUrl) => {
          if (sigEditor === "customer") setCustomerSig(dataUrl);
          if (sigEditor === "dealer") setDealerSig(dataUrl);
          setSigEditor(null);
        }}
      />

      {/* Success */}
      <SuccessBottomSheet open={successOpen} onClose={() => { setSuccessOpen(false); navigate("/"); }} orderId={orderId}>
        <div className="rounded-xl border border-border p-3 space-y-1.5">
          <Row label="Service" value={SERVICES.find((s) => s.value === service)!.label} />
          <Row label="SIM" value={simType === "psim" ? "P-SIM" : "E-SIM"} />
          {planMode === "plan"
            ? <Row label="Plan" value={`${selectedPlanObj?.title}`} />
            : <Row label="Top-up" value={`${topupAmount} SAR`} />}
          <Row label="Total" value={`${total} SAR`} />
        </div>
      </SuccessBottomSheet>

      {/* Cancel activation — requires a reason */}
      <Dialog
        open={cancelOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCancelOpen(false);
            setCancelReason("");
            setCancelOtherText("");
          }
        }}
      >
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel activation</DialogTitle>
            <DialogDescription>
              Please tell us why you're cancelling this activation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Cancel reason <span className="text-destructive">*</span>
              </label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="h-12 px-4 bg-white border border-border/60 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60 rounded-xl">
                  <SelectItem value="customer-changed-mind">Customer changed mind</SelectItem>
                  <SelectItem value="missing-documents">Missing documents</SelectItem>
                  <SelectItem value="price-too-high">Price too high</SelectItem>
                  <SelectItem value="system-issue">System issue</SelectItem>
                  <SelectItem value="wrong-plan-selected">Wrong plan selected</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cancelReason === "other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-semibold text-foreground">
                  Please specify <span className="text-destructive">*</span>
                </label>
                <Textarea
                  value={cancelOtherText}
                  onChange={(e) => setCancelOtherText(e.target.value)}
                  placeholder="Describe the reason in detail..."
                  className="min-h-[100px] px-4 py-3 bg-white border border-border/60 rounded-xl text-sm resize-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              disabled={
                !cancelReason ||
                (cancelReason === "other" && !cancelOtherText.trim())
              }
              onClick={() => {
                setCancelOpen(false);
                setCancelReason("");
                setCancelOtherText("");
                navigate("/");
              }}
              className="w-full h-11 rounded-full"
            >
              Confirm cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCancelOpen(false);
                setCancelReason("");
                setCancelOtherText("");
              }}
              className="w-full h-11 rounded-full border-primary text-primary"
            >
              Keep editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right max-w-[60%] truncate">{value}</span>
  </div>
);

export default NewActivation;