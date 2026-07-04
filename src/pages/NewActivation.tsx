import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";

// ---------- Types ----------
type SimType = "psim" | "esim";
type SubType = "sim" | "mnp";
type PayType = "prepaid" | "postpaid";
type LineType = "mobile" | "internet";
type PlanMode = "plan" | "topup";
type PayMethod = "card" | "pos";

// ---------- Constants ----------
const PREPAID_PLANS: typeof SHARED_PLANS = [
  // Flex
  { title: "Baqah Flex 60",  internet: "6 GB",  mins: "300",  sms: "Unlimited", social: "6 GB",  price: 69,  discount: null, validityLabel: "Valid 28 days", categories: ["flex"],       validity: ["1m"],       tags: ["Social"],           features: [], bonuses: ["300 Flex minutes", "6 GB social data"] },
  { title: "Baqah Flex 100", internet: "35 GB", mins: "1000", sms: "Unlimited", social: "35 GB", price: 115, discount: null, validityLabel: "Valid 28 days", categories: ["flex"],       validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["1000 Flex minutes", "35 GB social data"] },
  // Baqa (base-plan)
  { title: "Baqah Flix",     internet: "55 GB", mins: "100",  sms: "100",       social: "Unlimited", price: 30, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["Bonus 20 GB data", "Free STC TV"] },
  { title: "Baqah Plus",     internet: "80 GB", mins: "200",  sms: "200",       social: "Unlimited", price: 45, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m"],       tags: ["5G", "Social"],     features: [], bonuses: ["Bonus 30 GB data"] },
  { title: "Baqah Max",      internet: "120 GB",mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 60, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m","3m"], tags: ["5G","Unlimited"],  features: [], bonuses: ["Bonus 50 GB data"] },
  // Basic
  { title: "Basic 10",  internet: "2 GB",  mins: "100", sms: "50",  social: "-",          price: 10, discount: null, validityLabel: "Valid 7 days",  categories: ["basic"], validity: ["7d"], tags: [],            features: [], bonuses: [] },
  { title: "Basic 20",  internet: "5 GB",  mins: "200", sms: "100", social: "-",          price: 20, discount: null, validityLabel: "Valid 30 days", categories: ["basic"], validity: ["1m"], tags: [],            features: [], bonuses: [] },
  { title: "Basic 30",  internet: "10 GB", mins: "300", sms: "200", social: "Unlimited",  price: 30, discount: null, validityLabel: "Valid 30 days", categories: ["basic"], validity: ["1m"], tags: ["Social"],    features: [], bonuses: ["Social data included"] },
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
  { value: "basic", label: "Basic" },
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

const SectionCard = ({ title, children, action, required }: { title: string; children: React.ReactNode; action?: React.ReactNode; required?: boolean }) => (
  <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-foreground text-sm">{title}{required && <span className="text-destructive"> *</span>}</h3>
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
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
  </div>
);

// Dealer's saved signature — pre-loaded into dealer signature box
const DEALER_SAVED_SIG = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNjUgQzMwIDQwIDQ1IDc1IDU1IDU1IEM2MiA0MCA3MCA3MCA4MCA1NSBDODggNDIgOTUgNjAgMTA1IDUwIEMxMTUgMzggMTIyIDYyIDEzNSA1MiBDMTQ1IDQ0IDE1MCA1OCAxNjIgNDggQzE3MiAzOCAxNzggNTUgMTkwIDQ2IEMyMDAgMzcgMjA1IDUyIDIxNSA0NCBDMjI1IDM2IDIyOCA1MCAyMzggNDQgQzI0NSA0MCAyNDggNTIgMjU1IDQ2IiBzdHJva2U9IiMxMTE4MjciIHN0cm9rZS13aWR0aD0iMi41IiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJNMzAgNzIgQzUwIDY4IDkwIDcyIDEzMCA3MCBDMTYwIDY4IDIwMCA3MSAyNDAgNjkiIHN0cm9rZT0iIzExMTgyNyIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC40Ii8+PC9zdmc+";

// ---------- Page ----------
const NewActivation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Stage 1 — Identity
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [idNumber, setIdNumber] = useState("1324567896");
  const [isWhitelisted, setIsWhitelisted] = useState(false); // VPPR class 5→6 whitelisted customer
  // Customer-whitelist toggle visibility.
  const SHOW_CUSTOMER_WHITELIST = true;
  // Dealer whitelisted for in-store device handover (VNet). Prototype toggle simulates the dealer being whitelisted.
  const [isDealerHandover, setIsDealerHandover] = useState(false);

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
  const [topupDenom, setTopupDenom] = useState<number | null>(null);
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
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  // Promo catalogue: type = "discount" | "data" | "credit"
  type PromoBenefit = { type: "discount"; value: number } | { type: "data"; value: number } | { type: "credit"; value: number };
  const PROMO_CATALOGUE: Record<string, { benefits: PromoBenefit[] }> = {
    SAVE10:   { benefits: [{ type: "discount", value: 10 }] },
    DATA5GB:  { benefits: [{ type: "data", value: 5 }] },
    CREDIT20: { benefits: [{ type: "credit", value: 20 }] },
    MEGA:     { benefits: [{ type: "discount", value: 15 }, { type: "data", value: 10 }, { type: "credit", value: 25 }] },
  };
  const activePromo = promoApplied ? PROMO_CATALOGUE[promoCode] : null;
  const promoDiscount = activePromo?.benefits.find(b => b.type === "discount")?.value ?? 0;
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [customerVerifyOpen, setCustomerVerifyOpen] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerSig, setCustomerSig] = useState<string | null>(null);
  const [dealerSig, setDealerSig] = useState<string | null>(DEALER_SAVED_SIG);
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [sigEditor, setSigEditor] = useState<"customer" | "dealer" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherText, setCancelOtherText] = useState("");
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);

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
  const showContactField = isPrepaidInternet || isPostpaidInternet || isPostpaidMobile;
  const showNumber       = isPrepaidMobile || isPostpaidMobile;
  const showMnp          = isPrepaidMobile || isPostpaidMobile;
  const showDevice       = isPostpaidInternet;
  // Dealer whitelisted for in-store handover → offer the Skip Delivery option (VNet only).
  const showHandoverOption = isPostpaidInternet;
  // Delivery step is skipped when the dealer opts for in-store handover.
  const showDelivery     = isPostpaidInternet && !(showHandoverOption && isDealerHandover);

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
  const selectedPlanObj = selectedPlan != null ? activePlansForType[selectedPlan] : undefined;
  const topupAmount = topupManual ? Number(topupManual) : topupDenom ?? 0;
  const planPrice = planMode === "plan" ? selectedPlanObj?.price ?? 0 : topupAmount;
  const simFee = showEsim ? SIM_FEES[simType] : 0;
  const rawNumberFee = showNumber && subType === "sim" ? (() => {
    const t = DEMO_NUMBER_POOL.find(n => n.number === phone);
    if (!t) return 0;
    return NUMBER_TABS.find(tab => tab.value === t.tier)?.fee ?? 0;
  })() : 0;
  const isVipNumber = rawNumberFee > 0;

  // Whitelisted customer: no deposit for plan; only pays VIP number fee + VAT if applicable
  const effectivePlanPrice  = isWhitelisted && payType === "postpaid" ? 0 : planPrice;
  const effectiveSimFee     = isWhitelisted && payType === "postpaid" ? 0 : simFee;
  const numberFee           = rawNumberFee; // VIP number fee always applies even for whitelisted
  const deviceObj = DEVICES.find(d => d.id === selectedDevice);
  const deviceFee = showDevice ? (deviceObj?.price ?? 0) : 0;
  const effectiveDeviceFee  = isWhitelisted && payType === "postpaid" ? 0 : deviceFee;

  const subtotal = effectivePlanPrice + effectiveSimFee + numberFee + effectiveDeviceFee - promoDiscount;
  const vat = Math.round(subtotal * 0.15);
  const total = subtotal + vat;

  // Non-whitelisted postpaid: the plan-price amount is collected as a deposit
  // (equal to the plan price) that clears the customer's first bill.
  const isPostpaidDeposit = payType === "postpaid" && !isWhitelisted && planMode === "plan";

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

  const pageTitle = t("activation.title");

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
            <Field label={t("activation.identity.idType")}>
              <Select value={idType} onValueChange={(v) => { setIdType(v); if (v === "national-id") setNationality("sa"); }}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder={t("activation.identity.idType")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="national-id">{t("activation.identity.idTypes.saudi")}</SelectItem>
                  <SelectItem value="gcc-id">{t("activation.identity.idTypes.gcc")}</SelectItem>
                  <SelectItem value="gcc-passport">{t("activation.identity.idTypes.passport")}</SelectItem>
                  <SelectItem value="visitor-passport">{t("activation.identity.idTypes.passport")}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={t("activation.identity.nationality")}>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="w-full bg-card rounded-xl h-12">
                  <SelectValue placeholder={t("activation.identity.nationality")} />
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
            <Field label={t("activation.identity.idNumber")}>
              <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={t("activation.identity.idPlaceholder")} className="h-12 bg-card rounded-xl" />
            </Field>

            {/* Whitelisted customer toggle — kept in code, hidden from UI for now */}
            {SHOW_CUSTOMER_WHITELIST && (
            <div
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors cursor-pointer",
                isWhitelisted ? "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700" : "bg-card border-border/60"
              )}
              onClick={() => setIsWhitelisted(v => !v)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isWhitelisted ? "bg-amber-100 dark:bg-amber-800/40" : "bg-muted")}>
                  <Lock className={cn("w-4 h-4", isWhitelisted ? "text-amber-600" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", isWhitelisted ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{t("activation.identity.whitelisted.label")}</p>
                  <p className="text-[10px] text-amber-500 font-medium mt-0.5">{t("activation.identity.whitelisted.protoNote")}</p>
                </div>
              </div>
              <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", isWhitelisted ? "bg-amber-500" : "bg-muted-foreground/30")}>
                <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", isWhitelisted ? "start-5" : "start-0.5")} />
              </div>
            </div>
            )}
          </>
        )}

        {/* ── Step 1 — Subscription Type ── */}
        {step === 1 && (
          <>
            {/* 1. SIM Type */}
            <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("activation.subscription.simType")} <span className="text-destructive">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <SimCard active={simType === "psim"} label={t("activation.subscription.psim")} onClick={() => setSimType("psim")} />
                  <SimCard active={simType === "esim"} label={t("activation.subscription.esim")} onClick={() => setSimType("esim")} />
                </div>
                {simType === "esim" && (
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
                          placeholder={t("activation.subscription.kitPlaceholder")}
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
                      <p className="text-xs text-destructive">{t("activation.subscription.kitDigitsError")}</p>
                    )}
                    {kitError && (
                      <p className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {t(`activation.subscription.kitErrors.${kitError}`, "Invalid KIT Code. Please try again.")}
                      </p>
                    )}
                  </div>
                )}
              </section>

            {/* 2. Subscription Type */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("activation.subscription.subscriptionTypeTitle")}</h3>
              {/* Payment type toggle */}
              <div className="flex gap-3">
                {([{ value: "prepaid", label: t("activation.subscription.prepaid"), Icon: FileText }, { value: "postpaid", label: t("activation.subscription.postpaid"), Icon: HandCoins }] as const).map(({ value, label, Icon }) => {
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
                    {({
                      "all": t("activation.subscription.chips.all"),
                      "basic": t("activation.subscription.chips.basic"),
                      "flex": t("activation.subscription.chips.flex"),
                      "aman": t("activation.subscription.chips.aman"),
                      "base-plan": t("activation.subscription.chips.baqa"),
                      "data": t("activation.subscription.chips.data"),
                      "switch-postpaid": t("activation.subscription.chips.switchPostpaid"),
                      "vnet": t("activation.subscription.chips.vnet"),
                    } as Record<string,string>)[chip.value] ?? chip.label}
                  </button>
                ))}
              </div>
            )}

            <PlanSelector
              key={`${payType}-${lineType}`}
              selectedPlan={selectedPlan}
              onSelect={(i) => setSelectedPlan(i)}
              plans={lineType === "internet" ? INTERNET_PLANS : payType === "prepaid" ? PREPAID_PLANS : POSTPAID_PLANS.filter(p => p.categories?.some(c => c === "switch-postpaid" || c === "vnet") && !(simType === "esim" && p.categories?.includes("vnet")))}
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
                  <div className="flex-1 text-start">
                    <p className={cn("text-sm font-semibold", planMode === "topup" ? "text-foreground" : "text-muted-foreground")}>{t("activation.subscription.topupTitle")}</p>
                    <p className="text-xs text-muted-foreground">{t("activation.subscription.topupSub")}</p>
                  </div>
                  {/* Toggle switch */}
                  <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", planMode === "topup" ? "bg-primary" : "bg-muted")}>
                    <span className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all", planMode === "topup" ? "start-6" : "start-1")} />
                  </div>
                </button>
                {planMode === "topup" && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border/60 pt-3">
                    <p className="text-xs text-muted-foreground">{t("activation.subscription.topupHint")}</p>
                    <Input
                      value={topupManual}
                      onChange={(e) => { setTopupManual(e.target.value.replace(/\D/g, "")); setTopupDenom(null); }}
                      placeholder={t("activation.subscription.topupPlaceholder")}
                      inputMode="numeric"
                    />
                    <div className="grid grid-cols-5 gap-2">
                      {TOPUP_DENOMS.map((d) => (
                        <button key={d} onClick={() => { setTopupDenom(d); setTopupManual(String(d)); }}
                          className={cn("py-1.5 rounded-full text-xs font-medium border transition-colors text-center", topupDenom === d ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground")}>
                          {d} {t("activation.checkout.sar")}
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
                  {t("activation.subscription.deviceTitle")} <span className="text-destructive">*</span>
                </h3>
                <div className="space-y-2">
                  {DEVICES.map((device) => {
                    const selected = selectedDevice === device.id;
                    return (
                      <button key={device.id} type="button" onClick={() => setSelectedDevice(device.id)}
                        className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl border text-start transition-colors", selected ? "border-primary bg-primary/5" : "border-border bg-card")}>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <Router className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">{device.name}</p>
                          <p className="text-xs text-muted-foreground">{device.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {device.price > 0
                            ? <span className="text-sm font-bold text-foreground">{device.price} {t("activation.checkout.sar")}</span>
                            : <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t("activation.subscription.deviceIncluded")}</span>
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
                    {t("activation.subscription.phoneSection")} <span className="text-destructive">*</span>
                  </p>
                </div>
                {showMnp && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setSubType("sim")} className={cn("flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-colors", subType === "sim" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      <Sparkles className="w-4 h-4" /> {t("activation.subscription.newNumberBtn")}
                    </button>
                    <button onClick={() => setSubType("mnp")} className={cn("flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-xl transition-colors", subType === "mnp" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      <ArrowRightLeft className="w-4 h-4" /> {t("activation.subscription.portMnp")}
                    </button>
                  </div>
                )}
                {subType === "sim" ? (
                  <>
                    <div className="bg-primary/5 rounded-xl py-3 px-4 mb-3 flex flex-col items-center gap-1">
                      <span className="text-lg font-semibold tracking-wide text-foreground">{phone}</span>
                      {(() => {
                        const tier = DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier;
                        const tab = NUMBER_TABS.find(t => t.value === tier);
                        if (!tab || tab.value === "all") return null;
                        return (
                          <div className="flex items-center gap-1.5">
                            {tab.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.color }} />}
                            <span className="text-[11px] font-semibold" style={{ color: tab.color ?? undefined }}>{t(`activation.subscription.numberTabs.${tab.value}`, tab.label)}</span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] font-semibold text-foreground">{tab.fee ? `${tab.fee} ${t("activation.checkout.sar")}` : t("activation.checkout.free")}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <button onClick={() => setNumberPickerOpen(true)} className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-sm font-semibold">
                      {t("activation.subscription.pickDifferent")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Field label={t("activation.subscription.portNumber")}><Input value={portNumber} onChange={(e) => setPortNumber(e.target.value)} placeholder="05XXXXXXXX" inputMode="numeric" /></Field>
                    <Field label={t("activation.subscription.currentOperator")}>
                      <Select value={portOperator} onValueChange={setPortOperator}>
                        <SelectTrigger><SelectValue placeholder={t("activation.subscription.selectOperator")} /></SelectTrigger>
                        <SelectContent>{OPERATORS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label={t("activation.subscription.contactNum")}><Input value={portContact} onChange={(e) => setPortContact(e.target.value)} placeholder="05XXXXXXXX" inputMode="numeric" /></Field>
                    <p className="text-[11px] text-muted-foreground">{t("activation.subscription.portNote")}</p>
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
                  <p className="text-sm font-semibold text-foreground">{t("activation.checkout.summary")}</p>
                </div>
              </div>
              {showEsim && <SummaryRow label={t("activation.subscription.simType")} value={simType === "psim" ? t("activation.subscription.psim") : t("activation.subscription.esim")} />}
              {showEsim && simType === "psim" && kit && <SummaryRow label={t("activation.checkout.simNumber")} value={kit} />}
              <SummaryRow label={t("activation.subscription.type")} value={payType === "prepaid" ? t("activation.subscription.prepaid") : t("activation.subscription.postpaid")} />
              {selectedPlanObj && (() => {
                const cats = selectedPlanObj.categories ?? [];
                const planTypeLabel =
                  cats.includes("switch-postpaid") ? t("activation.subscription.chips.switchPostpaid") :
                  cats.includes("vnet") ? t("activation.subscription.chips.vnet") :
                  cats.includes("data") ? t("activation.subscription.chips.data") :
                  cats.includes("aman") ? t("activation.subscription.chips.aman") :
                  cats.includes("base-plan") ? t("activation.subscription.chips.baqa") :
                  cats.includes("flex") ? t("activation.subscription.chips.flex") : "";
                return planTypeLabel ? <SummaryRow label={t("activation.checkout.planType")} value={planTypeLabel} /> : null;
              })()}
              {selectedPlanObj && <SummaryRow label={t("activation.checkout.planName")} value={selectedPlanObj.title} />}
              {selectedPlanObj?.validityLabel && <SummaryRow label={t("activation.checkout.planValidity")} value={selectedPlanObj.validityLabel} />}
              {planMode === "topup" && topupAmount > 0 && <SummaryRow label={t("activation.checkout.topupValue")} value={`${topupAmount} ${t("activation.checkout.sar")}`} />}
              {showNumber && <SummaryRow label={t("activation.checkout.numberType")} value={subType === "sim" ? t("activation.subscription.newNumber") : t("activation.subscription.mnp")} />}
              {showNumber && subType === "sim" && phone && <SummaryRow label={t("activation.checkout.phoneNumber")} value={phone} />}
              {showNumber && subType === "mnp" && portNumber && <SummaryRow label={t("activation.subscription.portNumber")} value={portNumber} />}
              {showDevice && <SummaryRow label={t("activation.checkout.device")} value={deviceObj?.name ?? ""} />}
            </section>

            {/* Contact */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("activation.checkout.contact")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                {/* City field hidden for now (state kept — used by delivery/map logic) */}
                {false && payType !== "postpaid" && (
                  <Field label={t("activation.subscription.city")}>
                    <Select value={contactCity} onValueChange={setContactCity}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label={`${t("activation.checkout.email")} *`}>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="example@email.com" inputMode="email" className="h-12 bg-card rounded-xl" />
                </Field>
                {showContactField && (
                  <Field label={`${t("activation.checkout.contactNumber")} *`}>
                    <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="05XXXXXXXX" inputMode="numeric" className="h-12 bg-card rounded-xl" />
                  </Field>
                )}
              </div>
            </div>

            {/* In-Store Device Handover / Skip Delivery — shown before delivery when dealer is whitelisted (VNet) */}
            {showHandoverOption && (
              <div className="space-y-2">
                <div
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors cursor-pointer",
                    isDealerHandover ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700" : "bg-card border-border/60"
                  )}
                  onClick={() => setIsDealerHandover(v => !v)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isDealerHandover ? "bg-emerald-100 dark:bg-emerald-800/40" : "bg-muted")}>
                      <Store className={cn("w-4 h-4", isDealerHandover ? "text-emerald-600" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className={cn("text-sm font-semibold", isDealerHandover ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>{t("activation.handover.title")}</p>
                      <p className="text-[11px] text-muted-foreground">{t("activation.handover.subtitle")}</p>
                      <p className="text-[10px] text-emerald-500 font-medium mt-0.5">{t("activation.handover.protoNote")}</p>
                    </div>
                  </div>
                  <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", isDealerHandover ? "bg-emerald-500" : "bg-muted-foreground/30")}>
                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", isDealerHandover ? "start-5" : "start-0.5")} />
                  </div>
                </div>
                {isDealerHandover && (
                  <div className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-snug">{t("activation.handover.onNote")}</p>
                  </div>
                )}
              </div>
            )}

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

            {/* Payment Method — hidden for whitelisted postpaid with free number */}
            {!(isWhitelisted && payType === "postpaid" && !isVipNumber) && (
              <section className="bg-card rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{t("activation.checkout.paymentMethod")} <span className="text-destructive">*</span></p>
                </div>
                <div className="space-y-2">
                  <PayOption icon={CreditCard} label={t("activation.checkout.dealerWallet")} selected={pay === "card"} onClick={() => setPay("card")} />
                  <PayOption icon={HandCoins} label={t("activation.checkout.posTerminal")} selected={pay === "pos"} onClick={() => setPay("pos")} />
                </div>
              </section>
            )}

            {/* Promo Code */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t("activation.checkout.promoCode")}</p>
              </div>
              {promoApplied && activePromo ? (
                <div className="space-y-2">
                  {/* Applied header row */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm font-semibold text-green-700">{promoCode} {t("activation.checkout.promoApplied")}</span>
                    </div>
                    <button type="button" onClick={() => { setPromoApplied(false); setPromoCode(""); setPromoError(false); }} className="text-xs text-muted-foreground hover:text-destructive font-medium shrink-0">{t("activation.checkout.removePromo")}</button>
                  </div>
                  {/* One banner per benefit */}
                  {activePromo.benefits.map((b, i) => {
                    if (b.type === "discount") return (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
                        <Tag className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-xs font-semibold text-green-700">{b.value} {t("activation.checkout.promoDiscount")}</span>
                      </div>
                    );
                    if (b.type === "data") return (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                        <Database className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-blue-700">+{b.value} {t("activation.checkout.promoData")}</span>
                      </div>
                    );
                    if (b.type === "credit") return (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-200">
                        <HandCoins className="w-4 h-4 text-purple-600 shrink-0" />
                        <span className="text-xs font-semibold text-purple-700">{b.value} {t("activation.checkout.promoCredit")}</span>
                      </div>
                    );
                    return null;
                  })}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(false); }} placeholder={t("activation.checkout.promoPlaceholder")} className={cn("flex-1", promoError && "border-destructive")} />
                  <Button type="button" variant="outline" className="shrink-0" onClick={() => { if (PROMO_CATALOGUE[promoCode]) { setPromoApplied(true); setPromoError(false); } else setPromoError(true); }}>{t("activation.checkout.applyPromo")}</Button>
                </div>
              )}
              {promoError && <p className="text-xs text-destructive mt-1.5">{t("activation.checkout.promoError")}</p>}
            </section>

            {/* Whitelisted customer notice */}
            {isWhitelisted && payType === "postpaid" && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t("activation.identity.whitelisted.noDeposit")}</p>
                  {isVipNumber ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                      {t("activation.identity.whitelisted.vipNotice")}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                      {t("activation.identity.whitelisted.freeNotice")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{t("activation.checkout.paymentSummary")}</p>
              </div>

              {/* Case 1: whitelisted + postpaid + free number → show waived rows, total 0 */}
              {isWhitelisted && payType === "postpaid" && !isVipNumber ? (
                <>
                  <div className="space-y-2 pb-3">
                    {showEsim && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{simType === "psim" ? "P-SIM Card" : "E-SIM"}</span>
                        <span className="text-xs font-semibold text-amber-600">{t("activation.checkout.waived")}</span>
                      </div>
                    )}
                    {showDevice && deviceFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{deviceObj?.name}</span>
                        <span className="text-xs font-semibold text-amber-600">{t("activation.checkout.waived")}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{planMode === "plan" ? (selectedPlanObj?.title ?? "Plan") : "Top-up"}</span>
                      <span className="text-xs font-semibold text-amber-600">Waived</span>
                    </div>
                  </div>
                  <div className="border-t border-border/60 space-y-2 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                      <span className="text-xs font-semibold text-foreground">0 {t("activation.checkout.sar")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                      <span className="text-xs font-semibold text-foreground">0 {t("activation.checkout.sar")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                    <span className="text-base font-bold text-primary">0 {t("activation.checkout.sar")}</span>
                  </div>
                </>
              ) : /* Case 2: whitelisted + postpaid + VIP number → only show VIP number fee + VAT */
                isWhitelisted && payType === "postpaid" && isVipNumber ? (
                  <>
                    <div className="space-y-2 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t(`activation.subscription.numberTabs.${DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier ?? ""}`, NUMBER_TABS.find(tb => tb.value === DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier)?.label ?? "")} {t("activation.subscription.numberTierSuffix")}</span>
                        <span className="text-xs font-semibold text-foreground">{numberFee} {t("activation.checkout.sar")}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/60 space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                        <span className="text-xs font-semibold text-foreground">{numberFee} {t("activation.checkout.sar")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                        <span className="text-xs font-semibold text-foreground">{Math.round(numberFee * 0.15)} {t("activation.checkout.sar")}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                      <span className="text-base font-bold text-primary">{numberFee + Math.round(numberFee * 0.15)} {t("activation.checkout.sar")}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2 pb-3">
                      {showEsim && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{simType === "psim" ? "P-SIM Card" : "E-SIM"}</span>
                          <span className="text-xs font-semibold text-foreground">{simFee > 0 ? `${simFee} ${t("activation.checkout.sar")}` : t("activation.checkout.free")}</span>
                        </div>
                      )}
                      {showNumber && subType === "sim" && numberFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{t(`activation.subscription.numberTabs.${DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier ?? ""}`, NUMBER_TABS.find(tb => tb.value === DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier)?.label ?? "")} {t("activation.subscription.numberTierSuffix")}</span>
                          <span className="text-xs font-semibold text-foreground">{numberFee} {t("activation.checkout.sar")}</span>
                        </div>
                      )}
                      {showDevice && deviceFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{deviceObj?.name}</span>
                          <span className="text-xs font-semibold text-foreground">{deviceFee} {t("activation.checkout.sar")}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{isPostpaidDeposit ? t("activation.checkout.deposit") : planMode === "plan" ? (selectedPlanObj?.title ?? t("activation.checkout.planLabel")) : t("activation.checkout.topupLabel")}</span>
                        <span className="text-xs font-semibold text-foreground">{planPrice} {t("activation.checkout.sar")}</span>
                      </div>
                      {isPostpaidDeposit && (
                        <p className="text-[10px] text-muted-foreground leading-snug">{t("activation.checkout.depositNote")}</p>
                      )}
                      {promoApplied && promoDiscount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-green-600">{t("activation.checkout.promoLabel")} ({promoCode})</span>
                          <span className="text-xs font-semibold text-green-600">−{promoDiscount} {t("activation.checkout.sar")}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border/60 space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                        <span className="text-xs font-semibold text-foreground">{subtotal} {t("activation.checkout.sar")}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                        <span className="text-xs font-semibold text-foreground">{vat} {t("activation.checkout.sar")}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                      <span className="text-base font-bold text-primary">{total} {t("activation.checkout.sar")}</span>
                    </div>
                  </>
                )}
            </section>

            {/* OTP Verification — not needed for Postpaid Internet (Nafath only) */}
            {!isPostpaidInternet && (
              <SectionCard title={t("activation.checkout.otp")} required>
                {otpVerified ? (
                  <p className="text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {t("activation.checkout.otpVerified")}</p>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("activation.checkout.sendOtp")}</Button>
                )}
              </SectionCard>
            )}

            {/* Customer Verification */}
            <SectionCard title={isPostpaidInternet ? t("activation.checkout.nafath") : t("activation.checkout.customerVerification")} required>
              {customerVerified ? (
                <p className="text-xs text-success inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" /> {isPostpaidInternet ? t("activation.checkout.nafathVerified") : t("activation.checkout.customerVerified")}</p>
              ) : (
                <Button variant="outline" className="w-full" disabled={!isPostpaidInternet && !otpVerified} onClick={() => setCustomerVerifyOpen(true)}>
                  {isPostpaidInternet ? t("activation.checkout.nafathVerify") : t("activation.checkout.verifyCustomer")}
                </Button>
              )}
              {!isPostpaidInternet && !otpVerified && <p className="text-xs text-muted-foreground">{t("activation.checkout.otpFirst")}</p>}
            </SectionCard>

            {/* Terms & Conditions */}
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <button
                type="button"
                className="flex items-center gap-3 select-none cursor-pointer w-full text-start"
                onClick={() => setTermsOpen(true)}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                  terms ? "bg-primary border-primary" : "border-primary"
                )}>
                  {terms && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-sm text-foreground">{t("activation.checkout.terms")}</span>
              </button>
            </section>

            {/* Customer Signature */}
            <SignatureBox title={t("activation.checkout.customerSig")} required value={customerSig} onEdit={() => setSigEditor("customer")} onClear={() => setCustomerSig(null)} />

            {/* Dealer Signature */}
            <SignatureBox title={t("activation.checkout.dealerSig")} required value={dealerSig} onEdit={() => setSigEditor("dealer")} onClear={() => setDealerSig(null)} />
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinue} onClick={onContinue}>{t("activation.continue")}</Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setPayConfirmOpen(true)}>{t("activation.checkout.pay")} {total} {t("activation.checkout.sar")}</Button>
          )}
        </div>
      </div>

      {/* Customer verification */}
      <SematiVerification open={customerVerifyOpen} audience={isPostpaidInternet ? "manafath" : "customer"} onClose={() => setCustomerVerifyOpen(false)} onVerified={() => { setCustomerVerifyOpen(false); setCustomerVerified(true); }} />

      {/* Number picker drawer */}
      {(() => {
        const filtered = DEMO_NUMBER_POOL
          .filter(n => numberPickerTab === "all" || n.tier === numberPickerTab)
          .filter(n => n.number.includes(numberSearch));
        return (
          <Drawer open={numberPickerOpen} onOpenChange={setNumberPickerOpen}>
            <DrawerContent className="bg-card rounded-t-3xl h-[88vh] flex flex-col">
              <div className="flex items-center justify-between px-5 pt-3 pb-4">
                <h2 className="text-lg font-bold text-foreground">{t("activation.checkout.numberPickerTitle")}</h2>
                <button onClick={() => setNumberPickerOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-5 mb-3">
                <div className="relative">
                  <input value={numberSearch} onChange={e => setNumberSearch(e.target.value)} placeholder={t("activation.checkout.search")} className="w-full h-11 bg-muted/50 rounded-xl ps-4 pe-10 text-sm outline-none border border-border/40 rtl:text-right" />
                  <svg className="absolute end-3 top-3 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
              </div>
              <div className="flex gap-2 px-5 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {NUMBER_TABS.map(tab => (
                  <button key={tab.value} onClick={() => setNumberPickerTab(tab.value)}
                    className={cn("px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0", numberPickerTab === tab.value ? "bg-primary text-white" : "bg-muted text-foreground")}>
                    {t(`activation.subscription.numberTabs.${tab.value}`, tab.label)}
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
                        <span className="flex-1 text-start text-base font-semibold text-foreground">{item.number}</span>
                        {fee > 0
                          ? <span className="text-sm text-muted-foreground font-medium">{fee}.00 <span className="font-bold text-foreground">{t("activation.checkout.sar")}</span></span>
                          : <span className="text-sm font-semibold text-muted-foreground">{t("activation.checkout.free")}</span>}
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
            <h2 className="text-lg font-bold text-foreground">{t("activation.checkout.esimDevicesTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("activation.checkout.esimDevicesNote")}</p>
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
            <p className="text-[11px] text-muted-foreground text-center px-4">{t("activation.checkout.esimUnlocked")}</p>
          </div>
          <div className="px-5 pb-6 pt-2">
            <Button className="w-full rounded-xl" onClick={() => setEsimInfoOpen(false)}>{t("activation.checkout.gotIt")}</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl">
          <DrawerHeader>
            <DrawerTitle className="text-center">{t("activation.otpSheet.title")}</DrawerTitle>
            <DrawerDescription className="text-center text-xs">{t("activation.otpSheet.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-6 space-y-3">
            <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" inputMode="numeric" className="text-center tracking-[0.5em] text-lg" />
            <p className="text-xs text-muted-foreground text-center">{t("activation.otpSheet.demo")}</p>
            <Button className="w-full" disabled={otpCode.length !== 4} onClick={() => { setOtpVerified(true); setOtpOpen(false); setOtpCode(""); }}>{t("activation.otpSheet.verify")}</Button>
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
              <Button onClick={() => setTerms(true)} className="w-full h-12 rounded-full">{t("activation.termsSheet.accept")}</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <button type="button" className="text-sm font-semibold text-primary">{t("activation.termsSheet.cancel")}</button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Pay confirmation */}
      <Drawer open={payConfirmOpen} onOpenChange={setPayConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <DrawerHeader className="text-center px-0 pb-4">
            <DrawerTitle>{t("activation.checkout.confirmPay")}</DrawerTitle>
            <DrawerDescription>
              {pay === "card" ? t("activation.checkout.confirmPayWallet") : t("activation.checkout.confirmPayPos")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 flex flex-col items-center gap-1 mb-6">
            <p className="text-3xl font-bold text-primary">{total} {t("activation.checkout.sar")}</p>
            <p className="text-xs text-muted-foreground">{pay === "card" ? t("activation.checkout.dealerWallet") : t("activation.checkout.posTerminal")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setPayConfirmOpen(false); setSuccessOpen(true); }}>
              {t("activation.checkout.confirmPayBtn")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setPayConfirmOpen(false)}>
              {t("activation.checkout.cancelBtn")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Signature pad */}
      <SignaturePadSheet
        open={sigEditor !== null}
        title={sigEditor === "customer" ? t("activation.checkout.customerSig") : t("activation.checkout.dealerSig")}
        initial={sigEditor === "customer" ? customerSig : sigEditor === "dealer" ? dealerSig : null}
        onClose={() => setSigEditor(null)}
        onSave={(dataUrl) => { if (sigEditor === "customer") setCustomerSig(dataUrl); if (sigEditor === "dealer") setDealerSig(dataUrl); setSigEditor(null); }}
      />

      {/* Success */}
      <SuccessBottomSheet open={successOpen} onClose={() => { setSuccessOpen(false); navigate("/"); }} orderId={orderId}>
        <div className="rounded-xl border border-border p-3 space-y-1.5">
          <Row label={t("activation.checkout.subscription")} value={`${payType === "prepaid" ? t("activation.subscription.prepaid") : t("activation.subscription.postpaid")} ${lineType === "mobile" ? t("activation.checkout.mobile") : t("activation.checkout.internet")}`} />
          {showEsim && <Row label={t("activation.subscription.simType")} value={simType === "psim" ? t("activation.subscription.psim") : t("activation.subscription.esim")} />}
          {planMode === "plan" && selectedPlanObj && <Row label={t("activation.checkout.planName")} value={selectedPlanObj.title} />}
          {planMode === "plan" && selectedPlanObj?.validityLabel && <Row label={t("activation.checkout.planValidity")} value={selectedPlanObj.validityLabel} />}
          {planMode === "topup" && <Row label={t("activation.checkout.topupValue")} value={`${topupAmount} ${t("activation.checkout.sar")}`} />}
          {showNumber && <Row label={t("activation.checkout.numberType")} value={subType === "sim" ? t("activation.subscription.newNumber") : t("activation.subscription.mnp")} />}
          {showNumber && subType === "sim" && phone && <Row label={t("activation.checkout.phoneNumber")} value={phone} />}
          {showNumber && subType === "mnp" && portNumber && <Row label={t("activation.subscription.portNumber")} value={portNumber} />}
          {showDevice && deviceObj && <Row label={t("activation.checkout.device")} value={deviceObj.name} />}
          <Row label={t("activation.checkout.total")} value={`${total} ${t("activation.checkout.sar")}`} />
        </div>
      </SuccessBottomSheet>

      {/* Cancel bottom sheet */}
      <Drawer open={cancelOpen} onOpenChange={(o) => { if (!o) { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); } }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <DrawerHeader className="text-start px-0 pb-4">
            <DrawerTitle>{t("activation.cancelSheet.title")}</DrawerTitle>
            <DrawerDescription>{t("activation.cancelSheet.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{t("activation.cancelSheet.reasonLabel")} <span className="text-destructive">*</span></label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="h-12 px-4 bg-white border border-border/60 rounded-xl text-sm">
                  <SelectValue placeholder={t("activation.cancelSheet.selectReason")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60 rounded-xl">
                  <SelectItem value="customer-changed-mind">{t("activation.cancelSheet.reasons.customerChangedMind")}</SelectItem>
                  <SelectItem value="missing-documents">{t("activation.cancelSheet.reasons.missingDocuments")}</SelectItem>
                  <SelectItem value="price-too-high">{t("activation.cancelSheet.reasons.priceTooHigh")}</SelectItem>
                  <SelectItem value="system-issue">{t("activation.cancelSheet.reasons.systemIssue")}</SelectItem>
                  <SelectItem value="wrong-plan-selected">{t("activation.cancelSheet.reasons.wrongPlanSelected")}</SelectItem>
                  <SelectItem value="other">{t("activation.cancelSheet.reasons.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cancelReason === "other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-semibold text-foreground">{t("activation.cancelSheet.specify")} <span className="text-destructive">*</span></label>
                <Textarea value={cancelOtherText} onChange={(e) => setCancelOtherText(e.target.value)} placeholder={t("activation.cancelSheet.specifyPlaceholder")} className="min-h-[100px] px-4 py-3 bg-white border border-border/60 rounded-xl text-sm resize-none rtl:text-right" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <Button disabled={!cancelReason || (cancelReason === "other" && !cancelOtherText.trim())} onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); navigate("/"); }} className="w-full h-11 rounded-full">{t("activation.cancelSheet.confirm")}</Button>
            <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); }} className="w-full h-11 rounded-full border-primary text-primary">{t("activation.cancelSheet.keepEditing")}</Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-end max-w-[60%] truncate">{value}</span>
  </div>
);

export default NewActivation;
