import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import FlowStepper, { NEW_ACTIVATION_STEPS } from "@/components/FlowStepper";
import SematiVerification from "@/components/SematiVerification";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import PlanCard, { PlanCardData } from "@/components/PlanCard";
import SimCard from "@/components/activation/SimCard";
import PayOption from "@/components/activation/PayOption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/drawer";
import {
  Smartphone,
  Wifi,
  Router,
  CreditCard,
  Banknote,
  ShieldCheck,
  Pencil,
  Eraser,
  Info,
  X as XIcon,
  Check,
  Phone,
  Sparkles,
  ArrowRightLeft,
  ArrowRight,
  ScanLine,
  Apple,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  { value: "hbb", label: "HBB", desc: "Home Broadband — 5G / Vnet", Icon: Router },
];

const PLAN_TYPES = ["All", "Voice", "Data", "Bundle"];
const plans: (PlanCardData & { id: number })[] = [
  {
    id: 1,
    title: "Smart 50",
    internet: "20 GB",
    mins: "200",
    sms: "500",
    social: "Unlimited",
    price: 50,
    validityLabel: "Valid 30 days",
    discount: "Discount 20%",
    features: ["5G access", "Unlimited social apps"],
  },
  {
    id: 2,
    title: "Power 100",
    internet: "60 GB",
    mins: "Unlimited",
    sms: "Unlimited",
    social: "Unlimited",
    price: 100,
    validityLabel: "Valid 30 days",
    discount: null,
    features: ["5G+ priority access", "Free roaming in GCC"],
  },
  {
    id: 3,
    title: "Ultra 200",
    internet: "Unlimited",
    mins: "Unlimited",
    sms: "Unlimited",
    social: "Unlimited",
    price: 200,
    validityLabel: "Valid 30 days",
    discount: "Discount 10%",
    features: ["Premium 24/7 support", "Free 100 international min"],
  },
];
const TOPUP_DENOMS = [10, 20, 50, 100, 200];
const OPERATORS = ["STC", "Mobily", "Zain", "Virgin", "Lebara"];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];

const ESIM_DEVICES = [
  "iPhone XS, XS Max, XR",
  "iPhone 11 / 11 Pro / 11 Pro Max",
  "iPhone 12 series and newer",
  "iPad Pro (2018) and newer",
  "Requires iOS 12.1 or later",
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

// ---------- Signature pad ----------
function SignaturePad({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = value;
    }
  }, []);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    drawingRef.current = true;
    lastRef.current = pos(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current!.x, lastRef.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  };
  const up = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const c = canvasRef.current!;
    onChange(c.toDataURL("image/png"));
  };
  const clear = () => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        />
        {!value && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs text-muted-foreground">
            <Pencil className="w-4 h-4 mr-1.5" /> Sign here
          </div>
        )}
      </div>
      {value && (
        <button type="button" onClick={clear} className="text-xs text-primary inline-flex items-center gap-1">
          <Eraser className="w-3.5 h-3.5" /> Clear
        </button>
      )}
    </div>
  );
}

// ---------- Page ----------
const NewActivation = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  // Stage 1 — Identity
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [idNumber, setIdNumber] = useState("");

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
  const [planType, setPlanType] = useState("All");
  const [selectedPlan, setSelectedPlan] = useState<number>(plans[0].id);
  const [topupDenom, setTopupDenom] = useState<number | null>(50);
  const [topupManual, setTopupManual] = useState("");
  const [addrCity, setAddrCity] = useState("Riyadh");
  const [addrStreet, setAddrStreet] = useState("King Fahd Rd");
  const [addrBuilding, setAddrBuilding] = useState("123");

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

  // ---------- Conditional rules ----------
  const simOptions = useMemo<{ value: SimType; label: string; disabled?: boolean }[]>(() => {
    if (service === "hbb") return [{ value: "psim", label: "P-SIM" }, { value: "esim", label: "E-SIM", disabled: true }];
    return [{ value: "psim", label: "P-SIM" }, { value: "esim", label: "E-SIM" }];
  }, [service]);

  useEffect(() => {
    if (service === "hbb" && simType === "esim") setSimType("psim");
    if (service === "mbb" && payType === "postpaid") setPayType("prepaid");
    if (service === "hbb" && planMode === "topup") setPlanMode("plan");
  }, [service, simType, payType, planMode]);

  const payOptions = useMemo<{ value: PayType; label: string; disabled?: boolean }[]>(() => {
    if (service === "mbb") return [{ value: "prepaid", label: "Prepaid" }, { value: "postpaid", label: "Postpaid", disabled: true }];
    if (service === "hbb") return [{ value: "prepaid", label: "Prepaid 5G" }, { value: "postpaid", label: "Postpaid 5G / Vnet" }];
    return [{ value: "prepaid", label: "Prepaid" }, { value: "postpaid", label: "Postpaid" }];
  }, [service]);

  const showTopupOption = service !== "hbb";
  const isKitValid = simType === "esim" || /^\d{10}$/.test(kit);

  // ---------- Stage gating ----------
  const canContinue = useMemo(() => {
    if (step === 0) return !!idType && !!nationality && idNumber.trim().length > 0;
    if (step === 1) return !!service && !!simType && isKitValid;
    if (step === 2) {
      if (subType === "mnp" && (!portNumber || !portOperator || !portContact)) return false;
      if (planMode === "plan" && !selectedPlan) return false;
      if (planMode === "topup" && !topupDenom && !topupManual) return false;
      return true;
    }
    return true;
  }, [step, idType, nationality, idNumber, service, simType, isKitValid, subType, portNumber, portOperator, portContact, planMode, selectedPlan, topupDenom, topupManual]);

  const selectedPlanObj = plans.find((p) => p.id === selectedPlan);
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
      <AppHeader title="New Activation" showBack onBackClick={onBack} />
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
              {simType === "esim" && (
                <button
                  type="button"
                  onClick={() => setEsimInfoOpen(true)}
                  className="w-full mt-3 flex items-center gap-2 text-left p-3 rounded-xl bg-primary/5 border border-primary/20"
                >
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-foreground flex-1">
                    View supported devices &amp; iOS versions
                  </span>
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

            <SectionCard title="Payment type">
              <SegmentedTabs value={payType} onChange={(v) => setPayType(v as PayType)} options={payOptions} />
            </SectionCard>

            <SectionCard title="Plan">
              <SegmentedTabs
                value={planMode}
                onChange={(v) => setPlanMode(v as PlanMode)}
                options={[
                  { value: "plan", label: "With Plan" },
                  ...(showTopupOption ? [{ value: "topup", label: "With Topup" }] : []),
                ]}
              />
              {planMode === "plan" ? (
                <div className="space-y-3 pt-1">
                  <Field label="Plan Type">
                    <Select value={planType} onValueChange={setPlanType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PLAN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="grid gap-2">
                    {plans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-left transition-colors",
                          selectedPlan === p.id ? "border-primary bg-primary/5" : "border-border bg-card",
                        )}
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.data} · {p.mins} · {p.validity}</p>
                        </div>
                        <p className="text-sm font-bold text-primary">{p.price} SAR</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
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
                </div>
              )}
            </SectionCard>

            <SectionCard title="Address details">
              <Field label="City">
                <Select value={addrCity} onValueChange={setAddrCity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Street"><Input value={addrStreet} onChange={(e) => setAddrStreet(e.target.value)} /></Field>
              <Field label="Building / unit"><Input value={addrBuilding} onChange={(e) => setAddrBuilding(e.target.value)} /></Field>
            </SectionCard>
          </>
        )}

        {/* Stage 4 — Checkout */}
        {step === 3 && (
          <>
            <SectionCard title="Summary">
              <Row label="Service" value={SERVICES.find((s) => s.value === service)!.label} />
              <Row label="SIM Type" value={simType === "psim" ? "P-SIM" : "E-SIM"} />
              {simType === "psim" && <Row label="KIT" value={kit} />}
              <Row label="Subscription" value={subType === "sim" ? "SIM Number" : "MNP"} />
              {subType === "mnp" && (
                <>
                  <Row label="Port number" value={portNumber} />
                  <Row label="From operator" value={portOperator} />
                </>
              )}
              <Row label="Payment type" value={payOptions.find((o) => o.value === payType)!.label} />
              {planMode === "plan" ? (
                <Row label="Plan" value={`${selectedPlanObj?.name} · ${selectedPlanObj?.price} SAR`} />
              ) : (
                <Row label="Top-up" value={`${topupAmount} SAR`} />
              )}
              <Row label="Address" value={`${addrBuilding}, ${addrStreet}, ${addrCity}`} />
            </SectionCard>

            <SectionCard title="Payment method">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "card" as const, label: "Card", Icon: CreditCard },
                  { v: "cash" as const, label: "Cash", Icon: Banknote },
                  { v: "apple" as const, label: "Apple Pay", Icon: CreditCard },
                ].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setPay(o.v)}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-medium",
                      pay === o.v ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground",
                    )}
                  >
                    <o.Icon className="w-4 h-4" />
                    {o.label}
                  </button>
                ))}
              </div>
            </SectionCard>

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

            <SectionCard title="Signatures">
              <Field label="Customer signature"><SignaturePad value={customerSig} onChange={setCustomerSig} /></Field>
              <Field label="Dealer signature"><SignaturePad value={dealerSig} onChange={setDealerSig} /></Field>
            </SectionCard>

            <SectionCard title="Price details">
              <Row label="Subtotal" value={`${subtotal} SAR`} />
              <Row label="VAT (15%)" value={`${vat} SAR`} />
              <div className="pt-2 mt-1 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-primary">{total} SAR</span>
              </div>
            </SectionCard>

            <div className="flex items-start gap-2 px-1">
              <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(!!v)} />
              <label htmlFor="terms" className="text-xs text-foreground leading-tight">
                I agree to the{" "}
                <button type="button" onClick={() => setTermsOpen(true)} className="text-primary font-medium">
                  Terms and Conditions
                </button>
              </label>
            </div>
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
        <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-center">Supported eSIM devices</DrawerTitle>
            <DrawerDescription className="text-center text-xs">
              Make sure the customer's device supports eSIM
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-6 space-y-2">
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center text-xs text-muted-foreground">
              iPhone reference screenshots will appear here once uploaded.
            </div>
            <ul className="space-y-2 pt-2">
              {ESIM_DEVICES.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
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
        <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-center">Terms and Conditions</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-6 space-y-3 overflow-y-auto text-sm text-muted-foreground">
            <p>By proceeding, the customer agrees to the service agreement, billing terms, and acceptable use policy.</p>
            <p>All activations are subject to identity verification and regulatory approval. The customer acknowledges receipt of the SIM/eSIM and authorizes the selected plan or top-up amount.</p>
            <p>Refunds, replacements, and cancellations follow the standard policy available in the merchant portal.</p>
            <Button className="w-full mt-4" onClick={() => { setTerms(true); setTermsOpen(false); }}>I agree</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success */}
      <SuccessBottomSheet open={successOpen} onClose={() => { setSuccessOpen(false); navigate("/"); }} orderId={orderId}>
        <div className="rounded-xl border border-border p-3 space-y-1.5">
          <Row label="Service" value={SERVICES.find((s) => s.value === service)!.label} />
          <Row label="SIM" value={simType === "psim" ? "P-SIM" : "E-SIM"} />
          {planMode === "plan"
            ? <Row label="Plan" value={`${selectedPlanObj?.name}`} />
            : <Row label="Top-up" value={`${topupAmount} SAR`} />}
          <Row label="Total" value={`${total} SAR`} />
        </div>
      </SuccessBottomSheet>
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