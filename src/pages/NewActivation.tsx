import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import MapPicker from "@/components/MapPicker";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import FlowStepper, { NEW_ACTIVATION_STEPS } from "@/components/FlowStepper";
import SematiVerification from "@/components/SematiVerification";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import SimCard from "@/components/activation/SimCard";
import PayOption from "@/components/activation/PayOption";
import SourceTab from "@/components/activation/SourceTab";
import PlanSelector, { PLANS as SHARED_PLANS } from "@/components/activation/PlanSelector";
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
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import {
  Smartphone,
  Wifi,
  CreditCard,
  Pencil,
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
  Router,
  MapPin,
  Globe,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  Lock,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";

// ---------- Types ----------
type SimType = "psim" | "esim";
type SubType = "sim" | "mnp";
type PayType = "prepaid" | "postpaid";
type LineType = "mobile" | "internet";
type PlanMode = "plan" | "topup";
type PayMethod = "card" | "cash" | "apple";

// ---------- Constants ----------
const PREPAID_PLANS: typeof SHARED_PLANS = [
  // Flex
  { title: "Baqah Flex 60",  internet: "6 GB",  mins: "300",  sms: "Unlimited", social: "6 GB",  price: 69,  discount: null, validityLabel: "Valid 28 days", categories: ["flex"],       validity: ["1m"],       tags: ["Social"],           features: [], bonuses: ["300 Flex minutes", "6 GB social data"] },
  { title: "Baqah Flex 100", internet: "35 GB", mins: "1000", sms: "Unlimited", social: "35 GB", price: 115, discount: null, validityLabel: "Valid 28 days", categories: ["flex"],       validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["1000 Flex minutes", "35 GB social data"] },
  // Baqa (base-plan)
  { title: "Baqah Flix",     internet: "55 GB", mins: "100",  sms: "100",       social: "Unlimited", price: 30, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["Bonus 20 GB data", "Free STC TV"] },
  { title: "Baqah Plus",     internet: "80 GB", mins: "200",  sms: "200",       social: "Unlimited", price: 45, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["Bonus 30 GB data"] },
  { title: "Baqah Max",      internet: "120 GB",mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 60, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m","3m"], tags: ["5G","Unlimited"],  features: [], bonuses: ["Bonus 50 GB data"] },
  // Aman
  { title: "Aman Basic",     internet: "20 GB", mins: "200",  sms: "200",       social: "Unlimited", price: 18, discount: null, validityLabel: "Valid 30 days", categories: ["aman"],      validity: ["1m"],       tags: ["Social"],           features: [], bonuses: ["Bonus 5 GB data"] },
  { title: "Aman Plus",      internet: "50 GB", mins: "500",  sms: "500",       social: "Unlimited", price: 38, discount: null, validityLabel: "Valid 30 days", categories: ["aman"],      validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["Bonus 15 GB data"] },
  // Data
  { title: "Data Boost 50",  internet: "50 GB",  mins: "-", sms: "-", social: "Unlimited", price: 25, discount: null, validityLabel: "Valid 30 days", categories: ["data"], validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["50 GB high-speed data"] },
  { title: "Data Boost 100", internet: "100 GB", mins: "-", sms: "-", social: "Unlimited", price: 40, discount: null, validityLabel: "Valid 30 days", categories: ["data"], validity: ["1m", "3m"], tags: ["5G", "Social"],     features: [], bonuses: ["100 GB high-speed data"] },
  { title: "Data Unlimited", internet: "Unlimited", mins: "-", sms: "-", social: "Unlimited", price: 75, discount: null, validityLabel: "Valid 30 days", categories: ["data"], validity: ["1m"],  tags: ["5G", "Unlimited"],  features: [], bonuses: ["Unlimited data", "50 GB hotspot"] },
  // Minutes
  { title: "Talk Basic",  internet: "5 GB",  mins: "500",       sms: "100", social: "Unlimited", price: 20, discount: null, validityLabel: "Valid 7 days",  categories: ["minutes"], validity: ["7d"], tags: ["Social"],    features: [], bonuses: ["500 local minutes"] },
  { title: "Talk More",   internet: "10 GB", mins: "Unlimited", sms: "250", social: "Unlimited", price: 35, discount: null, validityLabel: "Valid 30 days", categories: ["minutes"], validity: ["1m"], tags: ["Unlimited"], features: [], bonuses: ["Unlimited local calls", "10 GB data"] },
];

const POSTPAID_PLANS: typeof SHARED_PLANS = [
  // Switch Postpaid
  { title: "Switch Postpaid 120", internet: "35 GB",  mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 138,   discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: ["Unlimited local calls", "35 GB data"] },
  { title: "Switch Postpaid 150", internet: "55 GB",  mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 172.5, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: ["Unlimited local calls", "55 GB data"] },
  { title: "Switch Postpaid 180", internet: "75 GB",  mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 207,   discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: ["Unlimited local calls", "75 GB data"] },
  { title: "Switch Postpaid 210", internet: "100 GB", mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 241.5, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: ["Unlimited local calls", "100 GB data"] },
  // Vnet (internet/data line)
  { title: "Vnet 100 GB",  internet: "100 GB", mins: "-", sms: "-", social: "-", price: 172.5, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["vnet"], validity: ["1m"], tags: ["5G"], features: [], bonuses: ["100 GB high-speed data"] },
  { title: "Vnet 300 GB",  internet: "300 GB", mins: "-", sms: "-", social: "-", price: 345,   discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["vnet"], validity: ["1m"], tags: ["5G"], features: [], bonuses: ["300 GB high-speed data"] },
  { title: "Vnet Unlimited", internet: "Unlimited", mins: "-", sms: "-", social: "-", price: 517.5, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["vnet"], validity: ["1m"], tags: ["5G","Unlimited"], features: [], bonuses: ["Unlimited data", "100 GB hotspot"] },
];

const INTERNET_PLANS: typeof SHARED_PLANS = [
  { title: "Internet 100 GB", internet: "100 GB", mins: "-", sms: "-", social: "-", price: 172.5, discount: null, validityLabel: "Valid 30 days", categories: ["data"], validity: ["1m"],  tags: ["5G"], features: [], bonuses: [] },
  { title: "Internet 100 GB", internet: "100 GB", mins: "-", sms: "-", social: "-", price: 253,   discount: null, validityLabel: "Valid 90 days", categories: ["data"], validity: ["3m"],  tags: ["5G"], features: [], bonuses: [] },
  { title: "Internet 300 GB", internet: "300 GB", mins: "-", sms: "-", social: "-", price: 517.5, discount: null, validityLabel: "Valid 90 days", categories: ["data"], validity: ["3m"],  tags: ["5G"], features: [], bonuses: [] },
];

const TOPUP_DENOMS = [10, 20, 50, 100, 200];
const OPERATORS = ["STC", "Mobily", "Zain", "Virgin", "Lebara"];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];

const REGIONS = ["Riyadh Region", "Makkah Region", "Eastern Province", "Madinah Region", "Aseer Region", "Tabuk Region", "Hail Region", "Northern Borders", "Jouf Region", "Qassim Region", "Najran Region", "Jizan Region", "Bahah Region"];

const DISTRICTS: Record<string, string[]> = {
  "Riyadh":  ["Al Olaya", "Al Malaz", "Al Muruj", "Al Nakheel", "Al Rawdah", "Al Qirawan", "Al Yasmin"],
  "Jeddah":  ["Al Hamra", "Al Rawdah", "Al Sharafeyah", "Al Balad", "Al Safa", "Al Zahraa"],
  "Dammam":  ["Al Faisaliyah", "Al Nuzha", "Al Shatea", "Al Adamah", "Al Badiyah"],
  "Mecca":   ["Al Aziziyah", "Al Shisha", "Al Zaher", "Al Rusaifa"],
  "Medina":  ["Al Haram", "Al Aziziyah", "Quba", "Al Salam"],
};

const PREPAID_CHIPS = [
  { value: "all", label: "All" },
  { value: "flex", label: "Flex" },
  { value: "aman", label: "Aman" },
  { value: "base-plan", label: "Baqa" },
  { value: "data", label: "5G Data" },
];

const POSTPAID_CHIPS = [
  { value: "all", label: "All" },
  { value: "switch-postpaid", label: "Switch Postpaid" },
  { value: "vnet", label: "Vnet" },
];

const NUMBER_TABS = [
  { value: "all",      label: "All",      fee: null, color: null },
  { value: "standard", label: "Standard", fee: 0,    color: "#0EA5E9" },
  { value: "diamond",  label: "Diamond",  fee: 10,   color: "#3B82F6" },
  { value: "silver",   label: "Silver",   fee: 10,   color: "#94A3B8" },
  { value: "gold",     label: "Gold",     fee: 10,   color: "#EAB308" },
];

const DEMO_NUMBER_POOL = [
  { number: "0547896324", tier: "gold" },
  { number: "0547896325", tier: "diamond" },
  { number: "0547896326", tier: "silver" },
  { number: "0547896327", tier: "standard" },
  { number: "0547896328", tier: "silver" },
  { number: "0547896329", tier: "standard" },
  { number: "0547896330", tier: "gold" },
  { number: "0547896331", tier: "standard" },
  { number: "0547896332", tier: "silver" },
  { number: "0547896333", tier: "standard" },
  { number: "0547896334", tier: "diamond" },
  { number: "0547896335", tier: "standard" },
  { number: "0547896336", tier: "gold" },
  { number: "0547896337", tier: "standard" },
  { number: "0547896338", tier: "silver" },
];

const SIM_FEES: Record<SimType, number> = { psim: 10, esim: 0 };

const DEVICES = [
  { id: "router-a", name: "5G Home Router", desc: "Up to 4 Gbps · 64 devices", price: 0 },
  { id: "router-b", name: "5G Gateway Pro", desc: "Up to 2 Gbps · 32 devices", price: 0 },
  { id: "router-c", name: "Premium 5G Router", desc: "Up to 8 Gbps · 128 devices", price: 200 },
];

const ESIM_DEVICES = [
  { model: "iPhone XS / XS Max / XR", ios: "iOS 12.1+" },
  { model: "iPhone 11 / Pro / Pro Max", ios: "iOS 13+" },
  { model: "iPhone 12 / Mini / Pro / Pro Max", ios: "iOS 14+" },
  { model: "iPhone 13 series", ios: "iOS 15+" },
  { model: "iPhone 14 series", ios: "iOS 16+" },
  { model: "iPhone 15 series", ios: "iOS 17+" },
  { model: "iPhone 16 series", ios: "iOS 18+" },
  { model: "iPad Pro (2018+)", ios: "iPadOS 12.1+" },
  { model: "iPad Air (3rd gen+)", ios: "iPadOS 13+" },
  { model: "iPad Mini (5th gen+)", ios: "iPadOS 13+" },
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
          value === opt.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          opt.disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const SectionCard = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
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

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-right">{value}</span>
  </div>
);

// ---------- Page ----------
const NewActivation = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Stage 1 — Identity
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [idNumber, setIdNumber] = useState("1324567896");

  // Stage 2 — Subscription Type
  const [payType, setPayType] = useState<PayType>("prepaid");
  const [lineType, setLineType] = useState<LineType>("mobile");
  const [simType, setSimType] = useState<SimType>("psim");
  const [kit, setKit] = useState("1234567890");
  const [kitError, setKitError] = useState<string | null>(null);
  const [kitChecking, setKitChecking] = useState(false);
  const [kitChecked, setKitChecked] = useState(false);
  const [esimInfoOpen, setEsimInfoOpen] = useState(false);
  const [planTypeChip, setPlanTypeChip] = useState("all");
  const [planMode, setPlanMode] = useState<PlanMode>("plan");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [topupDenom, setTopupDenom] = useState<number | null>(50);
  const [topupManual, setTopupManual] = useState("");
  // Contact & Delivery
  const [contactCity, setContactCity] = useState("Riyadh");
  const [contactEmail, setContactEmail] = useState("test@beyondsales.com");
  const [contactNumber, setContactNumber] = useState("0512345678");
  const [deliveryAddress, setDeliveryAddress] = useState("123 King Fahd Road, Riyadh 12345");
  const [nationalAddress, setNationalAddress] = useState("");
  const [locationRegion, setLocationRegion] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  // Number — Mobile only
  const [subType, setSubType] = useState<SubType>("sim");
  const [phone, setPhone] = useState("0785599574");
  const [numberPickerOpen, setNumberPickerOpen] = useState(false);
  const [numberPickerTab, setNumberPickerTab] = useState("all");
  const [numberSearch, setNumberSearch] = useState("");
  const [portNumber, setPortNumber] = useState("0512345678");
  const [portOperator, setPortOperator] = useState("STC");
  const [portContact, setPortContact] = useState("0598765432");
  // Device — Postpaid Internet only
  const [selectedDevice, setSelectedDevice] = useState("router-a");

  // Stage 3 — Checkout
  const [pay, setPay] = useState<PayMethod>("card");
  const [promoCode, setPromoCode] = useState("SAVE10");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const VALID_PROMO = "SAVE10";
  const promoDiscount = promoApplied ? 10 : 0;
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherText, setCancelOtherText] = useState("");

  // ---------- Derived flags ----------
  // lineType is no longer shown as a toggle; "internet mode" is inferred from chip or selected plan category
  const activePlansForType = payType === "prepaid" ? PREPAID_PLANS : POSTPAID_PLANS;
  const selectedPlanCategories = selectedPlan != null ? (activePlansForType[selectedPlan]?.categories ?? []) : [];
  const isVnetMode        = payType === "postpaid" && (planTypeChip === "vnet" || selectedPlanCategories.includes("vnet"));
  const is5GDataMode      = payType === "prepaid"  && (planTypeChip === "data" || selectedPlanCategories.includes("data"));
  const isPrepaidMobile   = payType === "prepaid"  && !is5GDataMode;
  const isPrepaidInternet = is5GDataMode;
  const isPostpaidMobile  = payType === "postpaid" && !isVnetMode;
  const isPostpaidInternet= isVnetMode;

  const showEsim         = true;
  const activePlanChips  = (payType === "prepaid" ? PREPAID_CHIPS : POSTPAID_CHIPS)
    .filter(c => !(c.value === "vnet" && simType === "esim"));
  const showPlanTypeChips= !(payType === "postpaid" && simType === "esim");
  const showTopupTab     = isPrepaidMobile || isPrepaidInternet;
  const showContactField = isPrepaidInternet || isPostpaidInternet;
  const showNumber       = isPrepaidMobile || isPostpaidMobile;
  const showMnp          = isPrepaidMobile || isPostpaidMobile;
  const showDevice       = isPostpaidInternet;
  const showDelivery     = isPostpaidInternet;

  // Reset dependent fields when lineType or payType changes
  useEffect(() => {
    setSelectedPlan(null);
    setPlanTypeChip("all");
    setPlanMode("plan");
  }, [payType, lineType]);

  useEffect(() => {
    if (simType === "esim" && planTypeChip === "vnet") {
      setPlanTypeChip("all");
      setSelectedPlan(null);
    }
  }, [simType]);

  // Auto-verify KIT on mount if already 10 digits
  useEffect(() => {
    if (/^\d{10}$/.test(kit)) {
      setKitChecking(true);
      setTimeout(() => {
        setKitChecking(false);
        if (kit === "0000000000") setKitError("registered");
        else if (kit === "1111111111") setKitError("invalid");
        else if (kit === "2222222222") setKitError("used");
        else setKitChecked(true);
      }, 1500);
    }
  }, []);

  // ---------- Pricing ----------
  const activePlans = payType === "prepaid" ? PREPAID_PLANS : SHARED_PLANS;
  const selectedPlanObj = activePlans[selectedPlan];
  const topupAmount = topupManual ? Number(topupManual) : topupDenom ?? 0;
  const planPrice = planMode === "plan" ? selectedPlanObj?.price ?? 0 : topupAmount;
  const simFee = showEsim ? SIM_FEES[simType] : 0;
  const numberFee = showNumber && subType === "sim" ? (() => {
    const t = DEMO_NUMBER_POOL.find(n => n.number === phone);
    if (!t) return 0;
    return NUMBER_TABS.find(tab => tab.value === t.tier)?.fee ?? 0;
  })() : 0;
  const deviceObj = DEVICES.find(d => d.id === selectedDevice);
  const deviceFee = showDevice ? (deviceObj?.price ?? 0) : 0;
  const subtotal = planPrice + simFee + numberFee + deviceFee - promoDiscount;
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;

  const isKitValid = simType === "esim" || /^\d{10}$/.test(kit);
  const isContactValid = !!contactEmail.trim() && (!showContactField || !!contactNumber.trim()) && (!showDelivery || !!deliveryAddress.trim());
  const canPay = isContactValid && (isPostpaidInternet || otpVerified) && customerVerified && !!customerSig && !!dealerSig && terms;

  // ---------- Stage gating ----------
  const canContinue = useMemo(() => {
    if (step === 0) return !!idType && !!nationality && idNumber.trim().length > 0;
    if (step === 1) {
      if (simType === "psim" && (!kitChecked || !!kitError)) return false;
      if (planMode === "plan" && selectedPlan == null) return false;
      if (planMode === "topup" && !topupDenom && !topupManual) return false;
      if (showMnp && subType === "mnp" && (!portNumber || !portOperator || !portContact)) return false;
      return true;
    }
    return true;
  }, [step, idType, nationality, idNumber, showEsim, isKitValid, planMode, selectedPlan, topupDenom, topupManual, showContactField, contactNumber, showMnp, subType, portNumber, portOperator, portContact, showDelivery, deliveryAddress]);

  const onBack = () => {
    if (step === 0) navigate("/");
    else setStep((s) => (s - 1) as 0 | 1 | 2);
  };

  const onContinue = () => {
    if (step < 2) setStep((s) => (s + 1) as 0 | 1 | 2);
  };

  const orderId = useMemo(() => "NA-" + Math.floor(Math.random() * 900000 + 100000), [successOpen]);

  const pageTitle = "SIM Activation";

  return (
    <div className="mobile-container bg-background min-h-screen pb-32">
      <AppHeader
        title={pageTitle}
        showBack
        onBackClick={onBack}
        rightElement={
          <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 flex items-center justify-center -mr-2">
            <X className="w-5 h-5 text-foreground" />
          </button>
        }
      />
      <FlowStepper current={step} steps={NEW_ACTIVATION_STEPS} />

      <div className="px-4 space-y-4">

        {/* ── Step 0 — Identity ── */}
        {step === 0 && (
          <>
            <Field label="ID Type">
              <Select value={idType} onValueChange={(v) => { setIdType(v); if (v === "national-id") setNationality("sa"); }}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
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
            <Field label="ID Number">
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter the ID Number" className="h-12 bg-card rounded-xl" />
            </Field>
          </>
        )}

        {/* ── Step 1 — Subscription Type ── */}
        {step === 1 && (
          <>
            {/* 1. SIM Type */}
            <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  SIM Type <span className="text-destructive">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <SimCard active={simType === "psim"} label="P-SIM" onClick={() => setSimType("psim")} />
                  <SimCard active={simType === "esim"} label="E-SIM" onClick={() => setSimType("esim")} />
                </div>
                {simType === "esim" && (
                  <button type="button" onClick={() => setEsimInfoOpen(true)} className="w-full mt-3 flex items-center gap-3 text-left p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/25 hover:border-primary/50 transition-all group">
                    <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">Supported devices & iOS versions</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">iPhone XS and later · iOS 12.1+</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                  </button>
                )}
                {simType === "psim" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={kit}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setKit(val);
                            setKitError(null);
                            setKitChecked(false);
                            if (val.length === 10) {
                              setKitChecking(true);
                              setTimeout(() => {
                                setKitChecking(false);
                                    if (val === "0000000000") setKitError("registered");
                                else if (val === "1111111111") setKitError("invalid");
                                else if (val === "2222222222") setKitError("used");
                                else setKitChecked(true);
                              }, 1500);
                            }
                          }}
                          placeholder="KIT Code (10 Digits)"
                          className={cn("h-12 bg-card rounded-xl pr-12", kitError && "border-destructive focus-visible:ring-destructive")}
                          inputMode="numeric"
                        />
                        <button type="button" onClick={() => { setKit("1234567890"); setKitError(null); setKitChecked(false); setKitChecking(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" aria-label="Scan KIT">
                          <ScanLine className="w-5 h-5" />
                        </button>
                      </div>
                      {/* kitChecking loader hidden */}
                    </div>
                    {kit && !isKitValid && !kitError && (
                      <p className="text-xs text-destructive">KIT must be 10 digits</p>
                    )}
                    {kitError && (() => {
                      const messages: Record<string, string> = {
                        registered: "This KIT Code is already registered to another SIM.",
                        invalid:    "This KIT Code is not valid. Please check and try again.",
                        used:       "This KIT Code has already been used for a previous activation.",
                      };
                      return (
                        <p className="text-xs text-destructive flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {messages[kitError] ?? "Invalid KIT Code. Please try again."}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </section>

            {/* 2. Subscription Type */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Subscription Type</h3>
              {/* Payment type toggle */}
              <div className="flex gap-3">
                {([{ value: "prepaid", label: "Prepaid", Icon: FileText }, { value: "postpaid", label: "Postpaid", Icon: HandCoins }] as const).map(({ value, label, Icon }) => {
                  const selected = payType === value;
                  return (
                    <button key={value} type="button" onClick={() => { setPayType(value); if (value === "postpaid" && simType === "esim") setLineType("mobile"); }}
                      className={cn("relative flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border",
                        selected ? "bg-primary/10 border-primary/20" : "bg-card border-border/60")}>
                      {/* Radio indicator */}
                      <span className={cn("absolute top-2.5 right-2.5 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        selected ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                        {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <Icon className={cn("w-6 h-6", selected ? "text-primary" : "text-muted-foreground")} />
                      <p className={cn("text-sm font-semibold", selected ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 + 4. Plan / Topup tabs + Plan Type chips */}
            {/* Plan type filter chips */}
            {showPlanTypeChips && (
              <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {activePlanChips.map(chip => (
                  <button
                    key={chip.value}
                    onClick={() => { setPlanTypeChip(chip.value); setSelectedPlan(null); }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors",
                      planTypeChip === chip.value ? "bg-primary text-white" : "bg-card text-foreground shadow-sm"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <PlanSelector
              key={`${payType}-${lineType}`}
              selectedPlan={selectedPlan}
              onSelect={(i) => setSelectedPlan(i)}
              plans={lineType === "internet" ? INTERNET_PLANS : payType === "prepaid" ? PREPAID_PLANS : POSTPAID_PLANS}
              categoryFilter={showPlanTypeChips ? planTypeChip : undefined}
            />

            {/* Top-up toggle */}
            {showTopupTab && (
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPlanMode(planMode === "topup" ? "plan" : "topup")}
                  className="w-full flex items-center gap-3 px-4 py-3.5"
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", planMode === "topup" ? "bg-primary/15" : "bg-muted")}>
                    <Database className={cn("w-4 h-4", planMode === "topup" ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn("text-sm font-semibold", planMode === "topup" ? "text-foreground" : "text-muted-foreground")}>Add Top-up</p>
                    <p className="text-xs text-muted-foreground">Optional balance added to the line</p>
                  </div>
                  {/* Toggle switch */}
                  <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", planMode === "topup" ? "bg-primary" : "bg-muted")}>
                    <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", planMode === "topup" ? "left-6" : "left-1")} />
                  </div>
                </button>
                {planMode === "topup" && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3">
                    <p className="text-xs text-muted-foreground">Enter or select an amount</p>
                    <Input
                      value={topupManual}
                      onChange={(e) => { setTopupManual(e.target.value.replace(/\D/g, "")); setTopupDenom(null); }}
                      placeholder="Amount in SAR"
                      inputMode="numeric"
                    />
                    <div className="grid grid-cols-5 gap-2">
                      {TOPUP_DENOMS.map((d) => (
                        <button key={d} onClick={() => { setTopupDenom(d); setTopupManual(String(d)); }}
                          className={cn("py-1.5 rounded-full text-xs font-medium border transition-colors text-center", topupDenom === d ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground")}>
                          {d} SAR
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* 6. Device — Postpaid Internet only */}
            {showDevice && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Device <span className="text-destructive">*</span>
                </h3>
                <div className="space-y-2">
                  {DEVICES.map((device) => {
                    const selected = selectedDevice === device.id;
                    return (
                      <button key={device.id} type="button" onClick={() => setSelectedDevice(device.id)}
                        className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors", selected ? "border-primary bg-primary/5" : "border-border bg-card")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <Router className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{device.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {device.price > 0
                            ? <span className="text-sm font-bold text-foreground">{device.price} SAR</span>
                            : <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Included</span>
                          }
                        </div>
                        <span className={cn("w-4 h-4 rounded-full border-2 shrink-0", selected ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Number — Mobile only */}
            {showNumber && (
              <section className="bg-card rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Phone Number <span className="text-destructive">*</span>
                  </p>
                </div>
                {showMnp && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setSubType("sim")} className={cn("flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-colors", subType === "sim" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      <Sparkles className="w-4 h-4" /> New number
                    </button>
                    <button onClick={() => setSubType("mnp")} className={cn("flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-colors", subType === "mnp" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      <ArrowRightLeft className="w-4 h-4" /> Port (MNP)
                    </button>
                  </div>
                )}
                {subType === "sim" ? (
                  <>
                    <div className="bg-primary/5 rounded-xl py-3 text-center text-lg font-semibold tracking-wide text-foreground mb-3">{phone}</div>
                    <button onClick={() => setNumberPickerOpen(true)} className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-sm font-semibold">
                      Pick Different Number <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Field label="Port number"><Input value={portNumber} onChange={(e) => setPortNumber(e.target.value)} placeholder="05XXXXXXXX" inputMode="numeric" /></Field>
                    <Field label="Current operator">
                      <Select value={portOperator} onValueChange={setPortOperator}>
                        <SelectTrigger><SelectValue placeholder="Select operator" /></SelectTrigger>
                        <SelectContent>{OPERATORS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Contact number"><Input value={portContact} onChange={(e) => setPortContact(e.target.value)} placeholder="05XXXXXXXX" inputMode="numeric" /></Field>
                    <p className="text-[11px] text-muted-foreground">The number will be transferred from the selected operator after verification.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ── Step 2 — Checkout ── */}
        {step === 2 && (
          <>
            {/* Subscription Summary */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Subscription Summary</p>
                </div>
              </div>
              <SummaryRow label="Subscription" value={`${payType === "prepaid" ? "Prepaid" : "Postpaid"} ${lineType === "mobile" ? "Mobile" : "Internet"}`} />
              {showEsim && <SummaryRow label="SIM Type" value={simType === "psim" ? "P-SIM" : "E-SIM"} />}
              {showEsim && simType === "psim" && <SummaryRow label="KIT" value={kit} />}
              {showNumber && <SummaryRow label="Subscription type" value={subType === "sim" ? "New Number" : "MNP"} />}
              {showNumber && subType === "sim" && <SummaryRow label="Phone Number" value={phone} />}
              {showNumber && subType === "mnp" && <SummaryRow label="Port Number" value={portNumber} />}
              {showNumber && subType === "mnp" && <SummaryRow label="From Operator" value={portOperator} />}
              <SummaryRow label="City" value={contactCity} />
              <SummaryRow label="Email" value={contactEmail} />
              {showContactField && <SummaryRow label="Contact Number" value={contactNumber} />}
              {planMode === "plan"
                ? <SummaryRow label="Plan" value={`${selectedPlanObj?.title} · ${selectedPlanObj?.price} SAR`} />
                : <SummaryRow label="Top-up" value={`${topupAmount} SAR`} />}
              {showDevice && <SummaryRow label="Device" value={deviceObj?.name ?? ""} />}
              {showDelivery && <SummaryRow label="Delivery Address" value={deliveryAddress} />}
            </section>

            {/* Contact */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">Contact</p>
              <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                <Field label="City">
                  <Select value={contactCity} onValueChange={setContactCity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Email *">
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="example@email.com" inputMode="email" className="h-12 bg-card rounded-xl" />
                </Field>
                {showContactField && (
                  <Field label="Contact Number *">
                    <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="05XXXXXXXX" inputMode="numeric" className="h-12 bg-card rounded-xl" />
                  </Field>
                )}
              </div>
            </div>

            {/* Location Information — Vnet only */}
            {showDelivery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-foreground">Location Information</p>
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    Map
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                  {/* National Address hidden */}
                  <Field label="Region *">
                    <Select value={locationRegion} onValueChange={(v) => { setLocationRegion(v); setLocationDistrict(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select the region" /></SelectTrigger>
                      <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="City *">
                    <Select value={contactCity} onValueChange={(v) => { setContactCity(v); setLocationDistrict(""); }}>
                      <SelectTrigger><SelectValue placeholder="Select the city" /></SelectTrigger>
                      <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="District *">
                    <Select value={locationDistrict} onValueChange={setLocationDistrict}>
                      <SelectTrigger><SelectValue placeholder="Select the district" /></SelectTrigger>
                      <SelectContent>
                        {(DISTRICTS[contactCity] ?? []).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Address Line">
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Building, floor, landmark or additional details…"
                      rows={3}
                      className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    />
                  </Field>
                </div>
              </div>
            )}

            <MapPicker
              open={mapOpen}
              onOpenChange={setMapOpen}
              onConfirm={(city, address) => {
                if (city) setContactCity(city);
                setDeliveryAddress(address);
                setNationalAddress("");
                setLocationDistrict("");
              }}
            />

            {/* Payment Method */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Payment Method <span className="text-destructive">*</span></p>
              </div>
              <PayOption icon={CreditCard} label="Dealer Wallet" selected={pay === "card"} onClick={() => setPay("card")} />
            </section>

            {/* Promo Code */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Promo Code</p>
              </div>
              {promoApplied ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">{VALID_PROMO}</span>
                    <span className="text-xs text-green-600">— 10 SAR off</span>
                  </div>
                  <button type="button" onClick={() => { setPromoApplied(false); setPromoCode(""); setPromoError(false); }} className="text-xs text-muted-foreground hover:text-destructive font-medium">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(false); }} placeholder="Enter promo code" className={cn("flex-1", promoError && "border-destructive")} />
                  <Button type="button" variant="outline" className="shrink-0" onClick={() => { if (promoCode === VALID_PROMO) { setPromoApplied(true); setPromoError(false); } else setPromoError(true); }}>Apply</Button>
                </div>
              )}
              {promoError && <p className="text-xs text-destructive mt-1.5">Invalid promo code. Try <span className="font-semibold">SAVE10</span>.</p>}
            </section>

            {/* Payment Summary */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Payment Summary</p>
              </div>
              <div className="space-y-2 pb-3">
                {showEsim && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{simType === "psim" ? "P-SIM Card" : "E-SIM"}</span>
                    <span className="text-xs font-semibold text-foreground">{simFee > 0 ? `${simFee} SAR` : "Free"}</span>
                  </div>
                )}
                {showNumber && subType === "sim" && numberFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{NUMBER_TABS.find(t => t.value === DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier)?.label} Number</span>
                    <span className="text-xs font-semibold text-foreground">{numberFee} SAR</span>
                  </div>
                )}
                {showDevice && deviceFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{deviceObj?.name}</span>
                    <span className="text-xs font-semibold text-foreground">{deviceFee} SAR</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{planMode === "plan" ? (selectedPlanObj?.title ?? "Plan") : "Top-up"}</span>
                  <span className="text-xs font-semibold text-foreground">{planPrice} SAR</span>
                </div>
                {promoApplied && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-green-600">Promo ({VALID_PROMO})</span>
                    <span className="text-xs font-semibold text-green-600">−{promoDiscount} SAR</span>
                  </div>
                )}
              </div>
              <div className="border-t border-border/60 space-y-2 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Subtotal</span>
                  <span className="text-xs font-semibold text-foreground">{subtotal} SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">VAT (15%)</span>
                  <span className="text-xs font-semibold text-foreground">{vat} SAR</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-base font-bold text-primary">{total} SAR</span>
              </div>
            </section>

            {/* OTP Verification — not needed for Postpaid Internet (Nafath only) */}
            {!isPostpaidInternet && (
              <SectionCard title="OTP Verification">
                {otpVerified ? (
                  <p className="text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> OTP verified</p>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>Send &amp; verify OTP</Button>
                )}
              </SectionCard>
            )}

            {/* Customer Verification */}
            <SectionCard title={isPostpaidInternet ? "Nafath Verification" : "Customer Verification"}>
              {customerVerified ? (
                <p className="text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {isPostpaidInternet ? "Nafath verified" : "Customer verified"}</p>
              ) : (
                <Button variant="outline" className="w-full" disabled={!isPostpaidInternet && !otpVerified} onClick={() => setCustomerVerifyOpen(true)}>
                  {isPostpaidInternet ? "Verify via Nafath" : "Verify customer"}
                </Button>
              )}
              {!isPostpaidInternet && !otpVerified && <p className="text-xs text-muted-foreground">Complete OTP verification first.</p>}
            </SectionCard>

            {/* Terms & Conditions */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <Drawer open={termsOpen} onOpenChange={setTermsOpen}>
                <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => setTermsOpen(true)}>
                  <input id="terms-checkbox" type="checkbox" checked={terms} onChange={(e) => { e.stopPropagation(); setTerms(e.target.checked); }} onClick={(e) => e.stopPropagation()} className="w-4 h-4 rounded border-2 border-primary accent-primary cursor-pointer" />
                  <span className="text-sm text-foreground">Terms and Conditions</span>
                </div>
                <DrawerContent className="max-h-[85vh]">
                  <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
                    <X className="h-5 w-5 text-foreground" />
                  </DrawerClose>
                  <DrawerHeader className="text-center">
                    <DrawerTitle>Terms and Conditions</DrawerTitle>
                    <DrawerDescription>Please read and accept our terms and conditions to continue.</DrawerDescription>
                  </DrawerHeader>
                  <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3">
                    <p>By activating this line, you agree to our service terms, including fair usage policies, payment obligations, and applicable regulatory requirements.</p>
                    <p>All provided information must be accurate. The SIM/eSIM and selected number are subject to availability and approval.</p>
                    <p>Plans, top-ups, and vanity fees are non-refundable once the activation is completed. VAT is included where stated.</p>
                  </div>
                  <DrawerFooter className="flex-col gap-3">
                    <DrawerClose asChild>
                      <Button onClick={() => setTerms(true)} className="w-full h-12 rounded-full">Accept</Button>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <button type="button" className="text-sm font-semibold text-primary">Cancel</button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </section>

            {/* Customer Signature */}
            <SignatureBox title="Customer Signature" required value={customerSig} onEdit={() => setSigEditor("customer")} onClear={() => setCustomerSig(null)} />

            {/* Dealer Signature */}
            <SignatureBox title="Dealer Signature" required value={dealerSig} onEdit={() => setSigEditor("dealer")} onClear={() => setDealerSig(null)} />
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinue} onClick={onContinue}>Continue</Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setSuccessOpen(true)}>Pay {total} SAR</Button>
          )}
        </div>
      </div>

      {/* Customer verification */}
      <SematiVerification open={customerVerifyOpen} audience="customer" onClose={() => setCustomerVerifyOpen(false)} onVerified={() => { setCustomerVerifyOpen(false); setCustomerVerified(true); }} />

      {/* Number picker drawer */}
      {(() => {
        const filtered = DEMO_NUMBER_POOL
          .filter(n => numberPickerTab === "all" || n.tier === numberPickerTab)
          .filter(n => n.number.includes(numberSearch));
        return (
          <Drawer open={numberPickerOpen} onOpenChange={setNumberPickerOpen}>
            <DrawerContent className="bg-card rounded-t-3xl h-[88vh] flex flex-col">
              <div className="flex items-center justify-between px-5 pt-3 pb-4">
                <h2 className="text-lg font-bold text-foreground">Choose Different Number</h2>
                <button onClick={() => setNumberPickerOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-5 mb-3">
                <div className="relative">
                  <input value={numberSearch} onChange={e => setNumberSearch(e.target.value)} placeholder="Search" className="w-full h-11 bg-muted/50 rounded-xl pl-4 pr-10 text-sm outline-none border border-border/40" />
                  <svg className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
              </div>
              <div className="flex gap-2 px-5 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {NUMBER_TABS.map(tab => (
                  <button key={tab.value} onClick={() => setNumberPickerTab(tab.value)}
                    className={cn("px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0", numberPickerTab === tab.value ? "bg-primary text-white" : "bg-muted text-foreground")}>
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto flex-1 px-5 pb-6">
                <div className="divide-y divide-border/40">
                  {filtered.map((item, i) => {
                    const tier = NUMBER_TABS.find(t => t.value === item.tier)!;
                    const fee = tier.fee ?? 0;
                    return (
                      <button key={i} onClick={() => { setPhone(item.number); setNumberPickerOpen(false); }} className="w-full flex items-center gap-3 px-1 py-3.5 hover:bg-muted/30 transition-colors">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tier.color ?? "#0EA5E9" }} />
                        <span className="flex-1 text-left text-base font-semibold text-foreground">{item.number}</span>
                        {fee > 0
                          ? <span className="text-sm text-muted-foreground font-medium">{fee}.00 <span className="font-bold text-foreground">SAR</span></span>
                          : <span className="text-sm font-semibold text-muted-foreground">Free</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        );
      })()}

      {/* eSIM devices drawer */}
      <Drawer open={esimInfoOpen} onOpenChange={setEsimInfoOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[88vh] flex flex-col">
          <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="px-5 pt-3 pb-4">
            <h2 className="text-lg font-bold text-foreground">Compatible Devices</h2>
            <p className="text-xs text-muted-foreground mt-0.5">iPhone XS and later support eSIM</p>
          </div>
          <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-4">
            <div className="rounded-2xl bg-muted/40 overflow-hidden divide-y divide-border/50">
              {ESIM_DEVICES.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1">{d.model}</span>
                  <span className="text-[10px] text-muted-foreground">{d.ios}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground text-center px-4">Device must be <span className="text-foreground font-medium">unlocked</span> with an active internet connection.</p>
          </div>
          <div className="px-5 pb-6 pt-2">
            <Button className="w-full rounded-xl" onClick={() => setEsimInfoOpen(false)}>Got it</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl">
          <DrawerHeader>
            <DrawerTitle className="text-center">OTP Verification</DrawerTitle>
            <DrawerDescription className="text-center text-xs">Enter the 4-digit code sent to the customer's number</DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-6 space-y-3">
            <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" inputMode="numeric" className="text-center tracking-[0.5em] text-lg" />
            <p className="text-xs text-muted-foreground text-center">Demo: any 4 digits will work</p>
            <Button className="w-full" disabled={otpCode.length !== 4} onClick={() => { setOtpVerified(true); setOtpOpen(false); setOtpCode(""); }}>Verify</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Terms drawer */}
      <Drawer open={termsOpen} onOpenChange={setTermsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
            <X className="h-5 w-5 text-foreground" />
          </DrawerClose>
          <DrawerHeader className="text-center">
            <DrawerTitle>Terms and Conditions</DrawerTitle>
            <DrawerDescription>Please read and accept our terms and conditions to continue.</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-2 text-sm text-foreground space-y-3">
            <p>By proceeding, the customer agrees to the service agreement, billing terms, and acceptable use policy.</p>
            <p>All activations are subject to identity verification and regulatory approval.</p>
            <p>Refunds, replacements, and cancellations follow the standard policy available in the merchant portal.</p>
          </div>
          <DrawerFooter className="flex-col gap-3">
            <DrawerClose asChild>
              <Button onClick={() => setTerms(true)} className="w-full h-12 rounded-full">Accept</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <button type="button" className="text-sm font-semibold text-primary">Cancel</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Signature pad */}
      <SignaturePadSheet
        open={sigEditor !== null}
        title={sigEditor === "customer" ? "Customer Signature" : "Dealer Signature"}
        initial={sigEditor === "customer" ? customerSig : sigEditor === "dealer" ? dealerSig : null}
        onClose={() => setSigEditor(null)}
        onSave={(dataUrl) => { if (sigEditor === "customer") setCustomerSig(dataUrl); if (sigEditor === "dealer") setDealerSig(dataUrl); setSigEditor(null); }}
      />

      {/* Success */}
      <SuccessBottomSheet open={successOpen} onClose={() => { setSuccessOpen(false); navigate("/"); }} orderId={orderId}>
        <div className="rounded-xl border border-border p-3 space-y-1.5">
          <Row label="Subscription" value={`${payType === "prepaid" ? "Prepaid" : "Postpaid"} ${lineType === "mobile" ? "Mobile" : "Internet"}`} />
          {showEsim && <Row label="SIM" value={simType === "psim" ? "P-SIM" : "E-SIM"} />}
          {planMode === "plan" ? <Row label="Plan" value={selectedPlanObj?.title ?? ""} /> : <Row label="Top-up" value={`${topupAmount} SAR`} />}
          <Row label="Total" value={`${total} SAR`} />
        </div>
      </SuccessBottomSheet>

      {/* Cancel bottom sheet */}
      <Drawer open={cancelOpen} onOpenChange={(o) => { if (!o) { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); } }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <DrawerHeader className="text-left px-0 pb-4">
            <DrawerTitle>Cancel activation</DrawerTitle>
            <DrawerDescription>Please tell us why you're cancelling this activation.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Cancel reason <span className="text-destructive">*</span></label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="h-12 px-4 bg-white border border-border/60 rounded-xl text-sm">
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
                <label className="text-sm font-semibold text-foreground">Please specify <span className="text-destructive">*</span></label>
                <Textarea value={cancelOtherText} onChange={(e) => setCancelOtherText(e.target.value)} placeholder="Describe the reason in detail..." className="min-h-[100px] px-4 py-3 bg-white border border-border/60 rounded-xl text-sm resize-none" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <Button disabled={!cancelReason || (cancelReason === "other" && !cancelOtherText.trim())} onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); navigate("/"); }} className="w-full h-11 rounded-full">Confirm cancel</Button>
            <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); }} className="w-full h-11 rounded-full border-primary text-primary">Keep editing</Button>
          </div>
        </DrawerContent>
      </Drawer>
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
