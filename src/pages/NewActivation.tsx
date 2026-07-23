import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import MapPicker from "@/components/MapPicker";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import FlowStepper, { NEW_ACTIVATION_STEPS } from "@/components/FlowStepper";
import SematiVerification from "@/components/SematiVerification";
import NafithVerificationModal from "@/components/NafithVerificationModal";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import SimCard from "@/components/activation/SimCard";
import PayOption from "@/components/activation/PayOption";
import SourceTab from "@/components/activation/SourceTab";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import PlanSelector, { PLANS as SHARED_PLANS } from "@/components/activation/PlanSelector";
import PlanCard from "@/components/PlanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  Gift,
  ArrowRight,
  ScanLine,
  Tag,
  FileText,
  HandCoins,
  Router,
  MapPin,
  Globe,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Store,
  ChevronRight,
  ChevronDown,
  Share2,
  Info,
  Wallet,
  Receipt,
  Microchip,
  QrCode,
  UserX,
 Mail,
} from "lucide-react";
import { cn, formatValidity } from "@/lib/utils";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";
import RiyalSymbol from "@/components/RiyalSymbol";

// ---------- Types ----------
type SimType = "psim" | "esim";
type SubType = "sim" | "mnp";
type PayType = "prepaid" | "postpaid";
type LineType = "mobile" | "internet";
type PlanMode = "plan" | "topup";
type PayMethod = "card" | "pos";

// ---------- Constants ----------
export const PREPAID_PLANS: typeof SHARED_PLANS = [
  // ── Basic (prepaid) — same data as the Baqa plans ──
  { title: "Basic 45",  internet: "3 GB",      mins: "250",       sms: "-", social: "1 GB",      price: 45,  discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["Social"],                 features: [], bonuses: [], roaming: false, freeSub: false },
  { title: "Basic 70",  internet: "20 GB",     mins: "350",       sms: "-", social: "20 GB",     price: 70,  discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["Social"],                 features: [], bonuses: [], roaming: false, freeSub: false },
  { title: "Basic 100", internet: "40 GB",     mins: "750",       sms: "-", social: "Unlimited", price: 100, discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], roaming: false, freeSub: false },
  { title: "Basic 110", internet: "45 GB",     mins: "745",       sms: "-", social: "Unlimited", price: 110, discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], roaming: false, freeSub: true },
  { title: "Basic 150", internet: "55 GB",     mins: "Unlimited", sms: "-", social: "Unlimited", price: 150, discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["5G","Social","Unlimited"], features: [], bonuses: [], roaming: false, freeSub: true },
  { title: "Basic 185", internet: "80 GB",     mins: "Unlimited", sms: "-", social: "Unlimited", price: 185, discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["5G","Social","Unlimited"], features: [], bonuses: [], roaming: false, freeSub: true },
  { title: "Basic 365", internet: "150 GB",    mins: "Unlimited", sms: "-", social: "Unlimited", price: 365, discount: null, validityLabel: "Valid 28 days", categories: ["basic"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], roaming: false, freeSub: true },
  // ── Baqah (base-plan) — 28 days ──
  { title: "Baqah 45",  internet: "3 GB",      mins: "250",       sms: "-", social: "1 GB",      price: 45,  discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["Social"],                 features: [], bonuses: [], roaming: false, freeSub: false },
  { title: "Baqah 70",  internet: "20 GB",     mins: "350",       sms: "-", social: "20 GB",     price: 70,  discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["Social"],                 features: [], bonuses: [], roaming: false, freeSub: false },
  { title: "Baqah 100", internet: "40 GB",     mins: "750",       sms: "-", social: "Unlimited", price: 100, discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], roaming: false, freeSub: false },
  { title: "Baqah 110", internet: "45 GB",     mins: "745",       sms: "-", social: "Unlimited", price: 110, discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], roaming: false, freeSub: true },
  { title: "Baqah 150", internet: "55 GB",     mins: "Unlimited", sms: "-", social: "Unlimited", price: 150, discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["5G","Social","Unlimited"], features: [], bonuses: [], roaming: false, freeSub: true },
  { title: "Baqah 185", internet: "80 GB",     mins: "Unlimited", sms: "-", social: "Unlimited", price: 185, discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["5G","Social","Unlimited"], features: [], bonuses: [], roaming: false, freeSub: true },
  { title: "Baqah 365", internet: "150 GB",    mins: "Unlimited", sms: "-", social: "Unlimited", price: 365, discount: null, validityLabel: "Valid 28 days", categories: ["base-plan"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], roaming: false, freeSub: true },
  // ── Baqah Flex (flex) — flex minutes to 13+ countries ──
  { title: "Baqah Flex 60",  internet: "6 GB",   mins: "300",  sms: "-", social: "6 GB",      price: 60,  discount: null, validityLabel: "Valid 28 days", categories: ["flex"], validity: ["1m"], tags: ["Social"],                 features: [], bonuses: [], badge: "mostFamous" },
  { title: "Baqah Flex 100", internet: "35 GB",  mins: "1000", sms: "-", social: "35 GB",     price: 100, discount: null, validityLabel: "Valid 28 days", categories: ["flex"], validity: ["1m"], tags: ["5G","Social"],            features: [], bonuses: [], badge: "recommended" },
  { title: "Baqah Flex 300", internet: "100 GB", mins: "1500", sms: "-", social: "Unlimited", price: 300, discount: null, validityLabel: "Valid 90 days", categories: ["flex"], validity: ["3m"], tags: ["5G","Social","Unlimited"], features: [], bonuses: [] },
  // ── Aman (kids / safe) ──
  { title: "Virgin Mobile Aman 60", internet: "10 GB", mins: "100", sms: "-", social: "-", price: 60, discount: null, validityLabel: "Valid 28 days", categories: ["aman"], validity: ["1m"], tags: [], features: [], bonuses: [], badge: "inDemand" },
  // ── Prepaid 5G Data (data-only, by size × validity) ──
  { title: "100 GB",    internet: "100 GB",   mins: "-", sms: "-", social: "-",      price: 172.5,  discount: null, validityLabel: "Valid 30 days",  categories: ["data"], validity: ["1m"],  tags: ["5G"],             features: [], bonuses: [], badge: "mostFamous" },
  { title: "100 GB",    internet: "100 GB",   mins: "-", sms: "-", social: "-",      price: 253,    discount: null, validityLabel: "Valid 90 days",  categories: ["data"], validity: ["3m"],  tags: ["5G"],             features: [], bonuses: [], badge: "mostFamous" },
  { title: "75 GB",     internet: "75 GB",    mins: "-", sms: "-", social: "75 GB",  price: 230,    discount: null, validityLabel: "Valid 60 days",  categories: ["data"], validity: ["2m"],  tags: ["5G","Social"],    features: [], bonuses: [] },
  { title: "125 GB",    internet: "125 GB",   mins: "-", sms: "-", social: "100 GB", price: 345,    discount: null, validityLabel: "Valid 90 days",  categories: ["data"], validity: ["3m"],  tags: ["5G","Social"],    features: [], bonuses: [] },
  { title: "300 GB",    internet: "300 GB",   mins: "-", sms: "-", social: "-",      price: 517.5,  discount: null, validityLabel: "Valid 90 days",  categories: ["data"], validity: ["3m"],  tags: ["5G"],             features: [], bonuses: [] },
  { title: "300 GB",    internet: "300 GB",   mins: "-", sms: "-", social: "-",      price: 546.25, discount: null, validityLabel: "Valid 180 days", categories: ["data"], validity: ["6m"],  tags: ["5G"],             features: [], bonuses: [] },
  { title: "600 GB",    internet: "600 GB",   mins: "-", sms: "-", social: "-",      price: 1035,   discount: null, validityLabel: "Valid 180 days", categories: ["data"], validity: ["6m"],  tags: ["5G"],             features: [], bonuses: [] },
  { title: "600 GB",    internet: "600 GB",   mins: "-", sms: "-", social: "-",      price: 1092.5, discount: null, validityLabel: "Valid 365 days", categories: ["data"], validity: ["12m"], tags: ["5G"],             features: [], bonuses: [] },
  { title: "Unlimited", internet: "Unlimited",mins: "-", sms: "-", social: "-",      price: 373.75, discount: null, validityLabel: "Valid 30 days",  categories: ["data"], validity: ["1m"],  tags: ["5G","Unlimited"], features: [], bonuses: [] },
  { title: "Unlimited", internet: "Unlimited",mins: "-", sms: "-", social: "-",      price: 1121.25,discount: null, validityLabel: "Valid 90 days",  categories: ["data"], validity: ["3m"],  tags: ["5G","Unlimited"], features: [], bonuses: [] },
  { title: "Unlimited", internet: "Unlimited",mins: "-", sms: "-", social: "-",      price: 2242.5, discount: null, validityLabel: "Valid 180 days", categories: ["data"], validity: ["6m"],  tags: ["5G","Unlimited"], features: [], bonuses: [] },
  { title: "Unlimited", internet: "Unlimited",mins: "-", sms: "-", social: "-",      price: 4542.5, discount: null, validityLabel: "Valid 365 days", categories: ["data"], validity: ["12m"], tags: ["5G","Unlimited"], features: [], bonuses: [] },
];

export const POSTPAID_PLANS: typeof SHARED_PLANS = [
  // Switch Postpaid — all Unlimited social/national/roaming/SMS + Free subscription
  { title: "Switch Postpaid 120", internet: "35 GB",    mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 120, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: ["20 GB data"], badge: "mostFamous" },
  { title: "Switch Postpaid 150", internet: "55 GB",    mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 150, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: [], badge: "mostFamous" },
  { title: "Switch Postpaid 180", internet: "75 GB",    mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 180, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: [] },
  { title: "Switch Postpaid 200", internet: "90 GB",    mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 200, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: [] },
  { title: "Switch Postpaid 250", internet: "120 GB",   mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 250, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: [] },
  { title: "Switch Postpaid 300", internet: "155 GB",   mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 300, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: [] },
  { title: "Switch Postpaid 365", internet: "200 GB",   mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 365, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["switch-postpaid"], validity: ["1m"], tags: ["5G","Social","Roaming"], features: [], bonuses: [] },
  // Vnet (internet/data line)
  { title: "Vnet 100 GB",  internet: "100 GB", mins: "-", sms: "-", social: "-", price: 172.5, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["vnet"], validity: ["1m"], tags: ["5G"], features: [], bonuses: ["100 GB high-speed data"] },
  { title: "Vnet 300 GB",  internet: "300 GB", mins: "-", sms: "-", social: "-", price: 345,   discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["vnet"], validity: ["1m"], tags: ["5G"], features: [], bonuses: ["300 GB high-speed data"] },
  { title: "Vnet 500 GB", internet: "500 GB", mins: "-", sms: "-", social: "-", price: 517.5, discount: null, validityLabel: "Monthly", priceSuffix: "/mo", categories: ["vnet"], validity: ["1m"], tags: ["5G"], features: [], bonuses: ["500 GB high-speed data", "100 GB hotspot"] },
];

const INTERNET_PLANS: typeof SHARED_PLANS = [
  { title: "Internet 100 GB", internet: "100 GB", mins: "-", sms: "-", social: "-", price: 172.5, discount: null, validityLabel: "Valid 30 days", categories: ["data"], validity: ["1m"],  tags: ["5G"], features: [], bonuses: [] },
  { title: "Internet 100 GB", internet: "100 GB", mins: "-", sms: "-", social: "-", price: 253,   discount: null, validityLabel: "Valid 90 days", categories: ["data"], validity: ["3m"],  tags: ["5G"], features: [], bonuses: [] },
  { title: "Internet 300 GB", internet: "300 GB", mins: "-", sms: "-", social: "-", price: 517.5, discount: null, validityLabel: "Valid 90 days", categories: ["data"], validity: ["3m"],  tags: ["5G"], features: [], bonuses: [] },
];

const OPERATORS = ["STC", "Mobily", "Lebara", "Zain", "Salam", "Red Bull Mobile"];
export const DEALER_WALLET_BALANCE = 550;
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];

export const NATIONALITY_CODES = [
  "sa", "jo", "eg", "in", "pk", "bd", "sy", "lb", "ye", "sd",
  "ph", "id", "lk", "np", "ae", "kw", "bh", "qa", "om", "tr",
  "ma", "tn", "dz", "iq", "ps", "af", "us", "gb", "other",
];

// ID types whose field is labeled "ID Passport" instead of "ID Number".
export const PASSPORT_ID_TYPES = ["gcc-passport", "visitor-passport"];
// ID types whose field is labeled "Border ID Number" instead of "ID Number".
export const BORDER_ID_TYPES = ["hajj", "umrah"];

// Fulfilment demo emails — stand in for the real backend already knowing everything
// the customer chose online once we look it up, instead of manual toggles. A paid
// record seeds the subscription/number/commitment state so the locked view actually
// reflects that scenario; unpaid records stay on the normal interactive defaults
// since the dealer picks everything live for those.
interface FulfilmentRecord {
  paid: boolean;
  whitelisted: boolean;
  payType?: PayType;
  planTitle?: string;
  numberTier?: "standard" | "bronze" | "silver" | "gold" | "diamond";
  /** Only meaningful when numberTier isn't "standard". */
  vanityCommitment?: boolean;
}
const FULFILMENT_PAID_EMAIL = "paid.customer@email.com";
const FULFILMENT_UNPAID_EMAIL = "unpaid.customer@email.com";
const FULFILMENT_UNPAID_WHITELISTED_EMAIL = "unpaid.whitelisted@email.com";
const FULFILMENT_POSTPAID_STANDARD_EMAIL = "paid.postpaid.standard@email.com";
const FULFILMENT_POSTPAID_STANDARD_WHITELISTED_EMAIL = "paid.postpaid.standard.whitelisted@email.com";
const FULFILMENT_POSTPAID_VANITY_EMAIL = "paid.postpaid.vanity@email.com";
const FULFILMENT_POSTPAID_VANITY_WHITELISTED_EMAIL = "paid.postpaid.vanity.whitelisted@email.com";
const FULFILMENT_POSTPAID_VANITY_COMMITTED_EMAIL = "paid.postpaid.vanitycommitted@email.com";
const FULFILMENT_POSTPAID_VANITY_COMMITTED_WHITELISTED_EMAIL = "paid.postpaid.vanitycommitted.whitelisted@email.com";
// Unpaid Switch Postpaid variants — dealer still needs to collect payment, but the
// scenario (number tier / commitment) is pre-seeded so the tester lands directly on it.
const FULFILMENT_UNPAID_POSTPAID_STANDARD_EMAIL = "unpaid.postpaid.standard@email.com";
const FULFILMENT_UNPAID_POSTPAID_STANDARD_WHITELISTED_EMAIL = "unpaid.postpaid.standard.whitelisted@email.com";
const FULFILMENT_UNPAID_POSTPAID_VANITY_EMAIL = "unpaid.postpaid.vanity@email.com";
const FULFILMENT_UNPAID_POSTPAID_VANITY_WHITELISTED_EMAIL = "unpaid.postpaid.vanity.whitelisted@email.com";
const FULFILMENT_UNPAID_POSTPAID_VANITY_COMMITTED_EMAIL = "unpaid.postpaid.vanitycommitted@email.com";
const FULFILMENT_UNPAID_POSTPAID_VANITY_COMMITTED_WHITELISTED_EMAIL = "unpaid.postpaid.vanitycommitted.whitelisted@email.com";
// Deliberately absent from FULFILMENT_DEMO_EMAILS — used to demo the "no matching application" state.
const FULFILMENT_UNKNOWN_EMAIL = "notfound.customer@email.com";
const FULFILMENT_DEMO_EMAILS: Record<string, FulfilmentRecord> = {
  // Whitelisting doesn't change anything for a paid fulfilment request — it's already fully
  // settled either way — so there's no separate "prepaid whitelisted" paid case to test.
  [FULFILMENT_PAID_EMAIL]: { paid: true, whitelisted: false },
  [FULFILMENT_UNPAID_EMAIL]: { paid: false, whitelisted: false },
  [FULFILMENT_UNPAID_WHITELISTED_EMAIL]: { paid: false, whitelisted: true },
  // Postpaid + standard number — no vanity fee, no Nafith.
  [FULFILMENT_POSTPAID_STANDARD_EMAIL]: { paid: true, whitelisted: false, payType: "postpaid", planTitle: "Switch Postpaid 200", numberTier: "standard" },
  [FULFILMENT_POSTPAID_STANDARD_WHITELISTED_EMAIL]: { paid: true, whitelisted: true, payType: "postpaid", planTitle: "Switch Postpaid 200", numberTier: "standard" },
  // Postpaid + vanity number, paid outright (no commitment) — Nafith not required.
  [FULFILMENT_POSTPAID_VANITY_EMAIL]: { paid: true, whitelisted: false, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: false },
  [FULFILMENT_POSTPAID_VANITY_WHITELISTED_EMAIL]: { paid: true, whitelisted: true, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: false },
  // Postpaid + vanity number, free with commitment — Nafith was completed online, so it
  // comes back already verified instead of asking the dealer to redo it.
  [FULFILMENT_POSTPAID_VANITY_COMMITTED_EMAIL]: { paid: true, whitelisted: false, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: true },
  [FULFILMENT_POSTPAID_VANITY_COMMITTED_WHITELISTED_EMAIL]: { paid: true, whitelisted: true, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: true },
  // Same postpaid/vanity/commitment matrix, but unpaid — the online selections still seed the
  // interactive Subscription step as a starting point, and the dealer can still adjust them
  // before collecting payment.
  [FULFILMENT_UNPAID_POSTPAID_STANDARD_EMAIL]: { paid: false, whitelisted: false, payType: "postpaid", planTitle: "Switch Postpaid 200", numberTier: "standard" },
  [FULFILMENT_UNPAID_POSTPAID_STANDARD_WHITELISTED_EMAIL]: { paid: false, whitelisted: true, payType: "postpaid", planTitle: "Switch Postpaid 200", numberTier: "standard" },
  [FULFILMENT_UNPAID_POSTPAID_VANITY_EMAIL]: { paid: false, whitelisted: false, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: false },
  [FULFILMENT_UNPAID_POSTPAID_VANITY_WHITELISTED_EMAIL]: { paid: false, whitelisted: true, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: false },
  [FULFILMENT_UNPAID_POSTPAID_VANITY_COMMITTED_EMAIL]: { paid: false, whitelisted: false, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: true },
  [FULFILMENT_UNPAID_POSTPAID_VANITY_COMMITTED_WHITELISTED_EMAIL]: { paid: false, whitelisted: true, payType: "postpaid", planTitle: "Switch Postpaid 300", numberTier: "gold", vanityCommitment: true },
};
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Normal (non-fulfilment) flow demo ID numbers — whitelist status is derived from
// which one is entered, instead of a manual toggle.
const NORMAL_TEST_ID_NUMBER = "1324567896";
const WHITELISTED_TEST_ID_NUMBER = "9876543210";

const REGIONS = ["Riyadh Region", "Makkah Region", "Eastern Province", "Madinah Region", "Aseer Region", "Tabuk Region", "Hail Region", "Northern Borders", "Jouf Region", "Qassim Region", "Najran Region", "Jizan Region", "Bahah Region"];

const DISTRICTS: Record<string, string[]> = {
  "Riyadh":  ["Al Olaya", "Al Malaz", "Al Muruj", "Al Nakheel", "Al Rawdah", "Al Qirawan", "Al Yasmin"],
  "Jeddah":  ["Al Hamra", "Al Rawdah", "Al Sharafeyah", "Al Balad", "Al Safa", "Al Zahraa"],
  "Dammam":  ["Al Faisaliyah", "Al Nuzha", "Al Shatea", "Al Adamah", "Al Badiyah"],
  "Mecca":   ["Al Aziziyah", "Al Shisha", "Al Zaher", "Al Rusaifa"],
  "Medina":  ["Al Haram", "Al Aziziyah", "Quba", "Al Salam"],
};

// Region each demo city belongs to — used to auto-fill Delivery Details from a map pick.
const CITY_TO_REGION: Record<string, string> = {
  "Riyadh": "Riyadh Region",
  "Jeddah": "Makkah Region",
  "Mecca": "Makkah Region",
  "Medina": "Madinah Region",
  "Dammam": "Eastern Province",
};

// Snap whatever city string the map's reverse-geocoder returns to one of our demo CITIES,
// so it always matches a valid Select option. Falls back to Riyadh (the map's default view).
const matchDemoCity = (rawCity: string): string => {
  const normalized = rawCity.trim().toLowerCase();
  const found = CITIES.find((c) => normalized.includes(c.toLowerCase()) || c.toLowerCase().includes(normalized));
  return found ?? "Riyadh";
};

// Prototype-only Saudi National Address generator (format: 4 letters + 4 digits, e.g. "RRRD1234").
const generateNationalAddress = (): string => {
  const letters = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${letters}${digits}`;
};

const PREPAID_CHIPS = [
  { value: "all", label: "All" },
  { value: "basic", label: "Basic" },
  { value: "base-plan", label: "Baqa" },
  { value: "flex", label: "Flex" },
  { value: "aman", label: "Aman" },
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
  { value: "bronze",   label: "Bronze",   fee: 10,   color: "#B45309" },
  { value: "silver",   label: "Silver",   fee: 10,   color: "#94A3B8" },
  { value: "gold",     label: "Gold",     fee: 10,   color: "#EAB308" },
  { value: "diamond",  label: "Diamond",  fee: 10,   color: "#3B82F6" },
];

const DEMO_NUMBER_POOL = [
  { number: "0785599574", tier: "standard" },
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
  { number: "0547896339", tier: "bronze" },
  { number: "0547896340", tier: "bronze" },
];

const SIM_FEES: Record<SimType, number> = { psim: 0, esim: 0 };

// Vanity Number categories — highest → lowest. A category is eligible when the
// selected Switch Postpaid plan tier (the number in its name) ≥ minTier.
// price = vanity number price paid when commitment is OFF (placeholders — pending client confirmation).
// Gold/Diamond (free-with-commitment) are only unlocked by Postpaid 250/300/365.
// Silver/Bronze/Standard are free-with-commitment (or always-free) on every Switch Postpaid plan.
const VANITY_CATEGORIES = [
  { key: "exotics",   tier: "diamond",  months: 24, minTier: 250, color: "#3B82F6", price: 500 },
  { key: "legendary", tier: "gold",     months: 18, minTier: 250, color: "#EAB308", price: 300 },
  { key: "rare",      tier: "silver",   months: 12, minTier: 0,   color: "#94A3B8", price: 150 },
  { key: "value",     tier: "bronze",   months: 6,  minTier: 0,   color: "#B45309", price: 75  },
  { key: "standard",  tier: "standard", months: 0,  minTier: 0,   color: "#0EA5E9", price: 0   },
];

const DEVICES = [
  { id: "router-a", name: "5G Home Router", desc: "Up to 4 Gbps · 64 devices", price: 0 },
  { id: "router-b", name: "5G Gateway Pro", desc: "Up to 2 Gbps · 32 devices", price: 0 },
  { id: "router-c", name: "Premium 5G Router", desc: "Up to 8 Gbps · 128 devices", price: 200 },
];

// Each Vnet plan bundles its own device — higher-tier plans get the more capable router.
const VNET_PLAN_DEVICE: Record<string, string> = {
  "Vnet 100 GB": "router-b",
  "Vnet 300 GB": "router-a",
  "Vnet 500 GB": "router-c",
};

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

// Verified-state banner — same visual language as the amber "Whitelisted Customer" notice, in green.
export const VerifiedBanner = ({ onRetry, label }: { onRetry?: () => void; label?: string }) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <p className="flex-1 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
        {label ?? t("activation.checkout.verifiedTitle")}
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-emerald-600 shrink-0" aria-label="Retry verification (demo)">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

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
  const [searchParams] = useSearchParams();
  const isFulfilment = searchParams.get("flow") === "fulfilment";
  const isMnp = searchParams.get("flow") === "mnp";

  const [step, setStep] = useState<0 | 1 | 2>(0);

  // Stage 1 — Identity
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [nationalityPickerOpen, setNationalityPickerOpen] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [idNumber, setIdNumber] = useState("1324567896");
  // Fulfilment: customer already has a completed online application — looked up by
  // email or by scanning the QR code shown on their confirmation screen, instead of
  // re-collecting ID Type / Nationality / ID Number.
  const [fulfilmentEmail, setFulfilmentEmail] = useState("");
  const [qrScanOpen, setQrScanOpen] = useState(false);
  const [qrScanStep, setQrScanStep] = useState<"scanning" | "success">("scanning");
  const [qrVerified, setQrVerified] = useState(false);
  const [customerNotFoundOpen, setCustomerNotFoundOpen] = useState(false);
  // Payment & whitelist status come back automatically once we look up the fulfilment
  // application by email — no manual toggles. Demo data only recognizes the 4 seeded
  // addresses above (covering paid/unpaid x whitelisted/not-whitelisted).
  const fulfilmentRecord = FULFILMENT_DEMO_EMAILS[fulfilmentEmail.trim().toLowerCase()];
  const alreadyPaid = fulfilmentRecord?.paid ?? true;
  // A well-formed email that doesn't match any online application — surfaced as an
  // error instead of silently falling back to "already paid".
  const fulfilmentEmailNotFound = !qrVerified && isValidEmail(fulfilmentEmail) && !fulfilmentRecord;
  // Paid fulfilment requests already chose everything online — the Subscription step shows
  // the same sections as usual but disabled, except SIM Type which can always be changed.
  const fulfilmentLocked = isFulfilment && alreadyPaid;
  // Whitelist status (VPPR class 5→6) is derived from which demo ID number is entered,
  // same pattern as fulfilment deriving it from email — no manual toggle.
  const isWhitelisted = isFulfilment ? (fulfilmentRecord?.whitelisted ?? false) : idNumber.trim() === WHITELISTED_TEST_ID_NUMBER;
  // Vanity Number Category overview list (informational) hidden for now — the commitment
  // checkbox on the picked number remains active. May be reverted.
  const SHOW_VANITY_OVERVIEW = false;
  // Dealer whitelisted for in-store device handover (VNet). Prototype toggle simulates the dealer being whitelisted.
  const [isDealerHandover, setIsDealerHandover] = useState(false);
  const [deviceSerialNumber, setDeviceSerialNumber] = useState("");

  // Stage 2 — Subscription Type
  const [payType, setPayType] = useState<PayType>("prepaid");
  const [lineType, setLineType] = useState<LineType>("mobile");
  const [simType, setSimType] = useState<SimType>("psim");
  const [kit, setKit] = useState("1234567890");
  const [kitError, setKitError] = useState<string | null>(null);
  const [kitChecking, setKitChecking] = useState(false);
  const [kitChecked, setKitChecked] = useState(false);
  const [esimInfoOpen, setEsimInfoOpen] = useState(false);
  const [esimDeviceSearch, setEsimDeviceSearch] = useState("");
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
  const [subType, setSubType] = useState<SubType>(isMnp ? "mnp" : "sim");
  const [phone, setPhone] = useState("0785599574");
  const [numberPickerOpen, setNumberPickerOpen] = useState(false);
  const [numberPickerTab, setNumberPickerTab] = useState("all");
  const [numberSearch, setNumberSearch] = useState("");
  // Number awaiting a "free with commitment / pay number price" choice from the popup.
  const [pendingVanityNumber, setPendingVanityNumber] = useState<{ number: string; tier: string } | null>(null);
  const [portNumber, setPortNumber] = useState("0512345678");
  const [portOperator, setPortOperator] = useState("STC");
  const [portContact, setPortContact] = useState("0598765432");


  // Stage 3 — Checkout
  const [pay, setPay] = useState<PayMethod>("card");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState(false);
  const [promoEnabled, setPromoEnabled] = useState(false);
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
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  const [customerVerifyOpen, setCustomerVerifyOpen] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);
  // Nafith promissory-note verification — required when a Switch Postpaid vanity commitment is ON
  const [nafithVerifyOpen, setNafithVerifyOpen] = useState(false);
  const [nafithVerified, setNafithVerified] = useState(false);
  const [customerSig, setCustomerSig] = useState<string | null>(null);
  const [dealerSig, setDealerSig] = useState<string | null>(DEALER_SAVED_SIG);
  const [terms, setTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsChain, setTermsChain] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [allowPromoCalls, setAllowPromoCalls] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  // E-SIM success sheet: QR share method (defaults to Mobile Number, pre-filled from checkout)
  const [shareVia, setShareVia] = useState<"mobile" | "email">("mobile");
  const [shareValue, setShareValue] = useState("");
  const [sigEditor, setSigEditor] = useState<"customer" | "dealer" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherText, setCancelOtherText] = useState("");
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  // Vanity commitment for the picked number: ON = free + Nafith; OFF = pay the vanity price.
  const [vanityCommitment, setVanityCommitment] = useState(true);

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
  // Allow Promotional Calls consent — every mobile line, but not the data-only 5G MBB or Vnet lines.
  const showPromoCalls   = !isPrepaidInternet && !isPostpaidInternet;
  const activePlanChips  = (payType === "prepaid" ? PREPAID_CHIPS : POSTPAID_CHIPS)
    .filter(c => !(c.value === "vnet" && (simType === "esim" || isFulfilment)));
  // Fulfilment only offers Switch Postpaid (no Vnet), so the postpaid chip row — which would
  // otherwise just be a single redundant "Switch Postpaid" filter — is hidden entirely there.
  const showPlanTypeChips= !(payType === "postpaid" && simType === "esim") && !(isFulfilment && payType === "postpaid");
  const showTopupTab     = isPrepaidMobile || isPrepaidInternet;
  // Contact number field is always shown; mandatory for VNet, 5G Data, and Switch Postpaid — optional otherwise.
  // For E-SIM, it stays visible but is never required, even on those three cases.
  const contactNumberRequired = (isPrepaidInternet || isPostpaidInternet || isPostpaidMobile) && simType !== "esim";
  // OTP section: mandatory for VNet/5G Data/Switch Postpaid on P-SIM. For E-SIM, it's shown on
  // every case (including Basic/Baqa/Aman/Flex) but never required.
  const showOtp           = isPrepaidInternet || isPostpaidInternet || isPostpaidMobile || simType === "esim";
  const otpRequired       = (isPrepaidInternet || isPostpaidInternet || isPostpaidMobile) && simType !== "esim";
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

  // Non-Saudi/Iqama IDs are prepaid-only (no postpaid available for them)
  const isSaudiId = idType === "national-id";
  useEffect(() => {
    if (!isSaudiId && payType !== "prepaid") setPayType("prepaid");
  }, [isSaudiId, payType]);

  // Fulfilment QR scan — full-screen camera-style view opens straight into scanning,
  // then simulates finding the customer's completed online application.
  useEffect(() => {
    if (!qrScanOpen) return;
    setQrScanStep("scanning");
    const scanTimer = setTimeout(() => {
      setQrScanStep("success");
      // The QR resolves to the customer's email, same as if the dealer had typed it in.
      setFulfilmentEmail(FULFILMENT_PAID_EMAIL);
      setQrVerified(true);
      const closeTimer = setTimeout(() => setQrScanOpen(false), 1200);
      return () => clearTimeout(closeTimer);
    }, 1800);
    return () => clearTimeout(scanTimer);
  }, [qrScanOpen]);

  useEffect(() => {
    if (simType === "esim" && planTypeChip === "vnet") {
      setPlanTypeChip("all");
      setSelectedPlan(null);
    }
  }, [simType]);

  // Reset the number-picker tab when the selected plan changes, so it doesn't stay on a
  // vanity tier the new plan no longer qualifies for.
  useEffect(() => {
    setNumberPickerTab("all");
  }, [selectedPlan]);

  // In the fulfilment flow, auto-select the first available plan by default so the
  // customer sees a preselected plan (matches "everything selected by default").
  useEffect(() => {
    if (isFulfilment && planMode === "plan" && selectedPlan == null && activePlansForType.length > 0) {
      setSelectedPlan(0);
    }
  }, [isFulfilment, planMode, selectedPlan, activePlansForType]);

  // Paid fulfilment: seed the subscription/number/commitment state from what the customer
  // already chose online (per the demo record), so the locked view — and pricing — actually
  // reflect that scenario instead of always defaulting to prepaid + a standard number.
  useEffect(() => {
    // Seed for any fulfilment record that specifies a scenario (payType). Paid records
    // additionally lock the view elsewhere; unpaid seeded records stay editable so the
    // dealer can still collect payment and change details, but land on the intended case.
    if (!isFulfilment || !fulfilmentRecord || !fulfilmentRecord.payType) return;
    const record = fulfilmentRecord;
    const type = record.payType ?? "prepaid";
    setPayType(type);
    const plans = type === "postpaid" ? POSTPAID_PLANS : PREPAID_PLANS;
    const planIdx = record.planTitle ? plans.findIndex((p) => p.title === record.planTitle) : 0;
    setSelectedPlan(planIdx >= 0 ? planIdx : 0);
    const tier = record.numberTier ?? "standard";
    setSubType("sim");
    setPhone(DEMO_NUMBER_POOL.find((n) => n.tier === tier)?.number ?? "0785599574");
    const commitment = record.vanityCommitment ?? true;
    setVanityCommitment(commitment);
    // Any paid postpaid fulfilment request already completed Nafith online (wherever it's
    // required), so it comes back verified instead of asking the dealer to redo it.
    setNafithVerified(record.paid && type === "postpaid");
    // Re-asserts after the generic "reset selectedPlan on payType change" effect (declared
    // above) clears it out from switching payType as part of this same seeding — payType and
    // selectedPlan are deliberately included so this effect re-fires and wins that race.
  }, [isFulfilment, fulfilmentEmail, payType, selectedPlan]);

  // OLD vanity-commitment approach (checkbox toggle after picking a number) — kept commented
  // in case we need to revert. Replaced by the "free with commitment / pay number price" popup
  // shown inside the number picker at selection time (see numberPickerOpen Drawer below).
  // useEffect(() => {
  //   setVanityCommitment(true);
  // }, [phone]);

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

  // OTP sheet: reset digits/error and start the resend countdown whenever it opens
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
      const el = document.getElementById(`checkout-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("checkout-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Pricing ----------
  const selectedPlanObj = selectedPlan != null ? activePlansForType[selectedPlan] : undefined;
  // Vanity Number eligibility for the selected Switch Postpaid plan (Req 1).
  const selectedPlanTier = isPostpaidMobile && selectedPlanObj
    ? parseInt(selectedPlanObj.title.match(/\d+/)?.[0] ?? "0", 10)
    : 0;
  const eligibleVanityCategories = VANITY_CATEGORIES.filter((c) => selectedPlanTier >= c.minTier);
  // Map the picked number's tier to its vanity category (commitment toggle applies to it).
  const TIER_TO_VANITY: Record<string, string> = { diamond: "exotics", gold: "legendary", silver: "rare", bronze: "value", standard: "standard" };
  const pickedTier = DEMO_NUMBER_POOL.find((n) => n.number === phone)?.tier ?? "";
  const pickedVanityCat = VANITY_CATEGORIES.find((c) => c.key === TIER_TO_VANITY[pickedTier]);
  // A picked category only qualifies for the free-with-commitment offer if the selected plan is eligible for it.
  const pickedCategoryEligibleFree = !!pickedVanityCat && eligibleVanityCategories.some((c) => c.key === pickedVanityCat.key);
  const topupAmount = topupManual ? Number(topupManual) : topupDenom ?? 0;
  // Plan and top-up can be combined (prepaid): sum both when top-up is active.
  const planFeeRaw = selectedPlanObj?.price ?? 0;
  const topupFeeRaw = planMode === "topup" ? topupAmount : 0;
  const planPrice = planFeeRaw + topupFeeRaw;
  const simFee = showEsim ? SIM_FEES[simType] : 0;
  // OLD approach: flat NUMBER_TABS fee for any non-standard number, regardless of commitment.
  // Kept commented in case we need to revert to it.
  // const rawNumberFee = showNumber && subType === "sim" ? (() => {
  //   const t = DEMO_NUMBER_POOL.find(n => n.number === phone);
  //   if (!t) return 0;
  //   return NUMBER_TABS.find(tab => tab.value === t.tier)?.fee ?? 0;
  // })() : 0;
  // NEW approach: Switch Postpaid vanity numbers are free when committed, or charge the real
  // vanity price when the dealer chose "Pay number price" instead. Everything else (Standard,
  // Prepaid, MNP) keeps the old flat NUMBER_TABS fee.
  const rawNumberFee = showNumber && subType === "sim" ? (() => {
    const flatFee = NUMBER_TABS.find(tab => tab.value === pickedTier)?.fee ?? 0;
    if (!isPostpaidMobile || pickedTier === "standard" || !pickedVanityCat) return flatFee;
    if (pickedCategoryEligibleFree && vanityCommitment) return 0;
    return pickedVanityCat.price;
  })() : 0;
  const isVipNumber = rawNumberFee > 0;

  // Whitelisted customer: nothing to pay (prepaid or postpaid); only pays VIP number fee + VAT if applicable.
  // Exception: Switch Postpaid + Vanity number taken free-with-commitment still collects the plan price
  // (deposit clears the first bill), even for whitelisted customers.
  const whitelistedVanityCommitmentDeposit =
    isWhitelisted && isPostpaidMobile && !!pickedVanityCat && pickedCategoryEligibleFree && vanityCommitment;
  const effectivePlanPrice  = isWhitelisted && !whitelistedVanityCommitmentDeposit ? 0 : planPrice;
  const effectiveSimFee     = isWhitelisted ? 0 : simFee;
  const numberFee           = rawNumberFee; // VIP number fee always applies even for whitelisted
  const selectedDevice = (selectedPlanObj && VNET_PLAN_DEVICE[selectedPlanObj.title]) || "router-a";
  const deviceObj = DEVICES.find(d => d.id === selectedDevice);
  const deviceFee = showDevice ? (deviceObj?.price ?? 0) : 0;
  const effectiveDeviceFee  = isWhitelisted ? 0 : deviceFee;

  // Fulfilment: everything was already paid for online, so nothing is owed here.
  const subtotal = isFulfilment && alreadyPaid ? 0 : effectivePlanPrice + effectiveSimFee + numberFee + effectiveDeviceFee - promoDiscount;
  // Switch Postpaid: no VAT is collected when the number is Standard, or when a
  // Vanity number is taken free-with-commitment (deposit-only flow either way).
  const vatWaived =
    isPostpaidMobile &&
    subType === "sim" &&
    (pickedTier === "standard" || (isWhitelisted && pickedCategoryEligibleFree && vanityCommitment));
  const vat = isFulfilment && alreadyPaid ? 0 : (vatWaived ? 0 : Math.round(subtotal * 0.15));
  const total = subtotal + vat;
  // Checkout confirm sheet copy: fulfilment already paid online, nothing owed for another
  // reason (e.g. whitelisted with a free/free-with-commitment number), or an actual payment.
  const confirmCopyKey = isFulfilment && alreadyPaid ? "confirmActivation" : total === 0 ? "confirmSubmission" : "confirmPay";

  // Non-whitelisted postpaid: the plan-price amount is collected as a deposit
  // (equal to the plan price) that clears the customer's first bill.
  const isPostpaidDeposit = payType === "postpaid" && !isWhitelisted && planMode === "plan";
  // Switch Postpaid: dealer app credit limit note — 20% of the selected plan's price.
  const switchPostpaidCreditLimit = isPostpaidMobile && selectedPlanObj ? Math.round(selectedPlanObj.price * 0.2 * 100) / 100 : 0;

  const isKitValid = simType === "esim" || /^\d{10}$/.test(kit);
  const emailRequired = isPrepaidInternet;
  const cityRequired = true;
  const isContactValid = (!emailRequired || !!contactEmail.trim()) && (!cityRequired || !!contactCity.trim()) && (!contactNumberRequired || !!contactNumber.trim()) && (!isVnetMode || !!nationalAddress.trim()) && (!showDelivery || !!deliveryAddress.trim()) && (!(showHandoverOption && isDealerHandover) || !!deviceSerialNumber.trim());
  // Nafith promissory-note verification: always required for Vnet, and for Switch Postpaid
  // whenever a vanity commitment is ON.
  const showNafith = isPostpaidInternet || (isPostpaidMobile && !!pickedVanityCat && pickedVanityCat.months > 0 && pickedCategoryEligibleFree && vanityCommitment);
  // Verifications are sequential: Customer → OTP → Nafith. Each unlocks the next.
  const otpGateOk = customerVerified;
  const nafithGateOk = customerVerified && (!showOtp || otpVerified);
  const canPay = isContactValid && (!otpRequired || otpVerified) && customerVerified && (!showNafith || nafithVerified) && !!customerSig && !!dealerSig && terms;

  // ---------- Stage gating ----------
  const canContinue = useMemo(() => {
    if (step === 0) {
      if (isFulfilment) return qrVerified || isValidEmail(fulfilmentEmail);
      return !!idType && !!nationality && idNumber.trim().length > 0;
    }
    if (step === 1) {
      if (isFulfilment && alreadyPaid) return simType !== "psim" || (kitChecked && !kitError);
      if (simType === "psim" && (!kitChecked || !!kitError)) return false;
      if (planMode === "plan" && selectedPlan == null) return false;
      if (planMode === "topup" && !topupDenom && !topupManual) return false;
      if (showMnp && subType === "mnp" && (!portNumber || !portOperator || !portContact)) return false;
      return true;
    }
    return true;
  }, [step, isFulfilment, qrVerified, fulfilmentEmail, alreadyPaid, idType, nationality, idNumber, showEsim, isKitValid, simType, kitChecked, kitError, planMode, selectedPlan, topupDenom, topupManual, contactNumberRequired, contactNumber, showMnp, subType, portNumber, portOperator, portContact, showDelivery, deliveryAddress]);

  const onBack = () => {
    if (step === 0) navigate("/");
    else setStep((s) => (s - 1) as 0 | 1 | 2);
  };

  const onContinue = () => {
    if (step === 0 && isFulfilment && fulfilmentEmailNotFound) {
      setCustomerNotFoundOpen(true);
      return;
    }
    if (step < 2) setStep((s) => (s + 1) as 0 | 1 | 2);
  };

  const orderId = useMemo(() => "NA-" + Math.floor(Math.random() * 900000 + 100000), [successOpen]);

  // When the success sheet opens for an E-SIM activation, default the share method to
  // Mobile Number and pre-fill it from what was entered on the checkout page.
  useEffect(() => {
    if (successOpen && simType === "esim") {
      setShareVia("mobile");
      setShareValue(contactNumber || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successOpen]);

  const pageTitle = isFulfilment ? "Fulfillment" : isMnp ? "MNP (Port In)" : t("activation.title");

  return (
    <div className="mobile-container bg-background min-h-screen pb-32">
      <AppHeader
        title={pageTitle}
        showBack
        onBackClick={onBack}
        rightElement={
          <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
            <X className="w-5 h-5 text-foreground" />
          </button>
        }
      />
      <FlowStepper current={step} steps={NEW_ACTIVATION_STEPS} />

      <div className="px-4 space-y-4">

        {/* ── Step 0 — Identity ── */}
        {step === 0 && (
          <>
            {!isFulfilment ? (
              <>
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
              </>
            ) : (
              <>
                <Field label={t("activation.identity.customerEmail")}>
                  <Input
                    type="email"
                    value={fulfilmentEmail}
                    onChange={(e) => { setFulfilmentEmail(e.target.value); setQrVerified(false); }}
                    placeholder="customer@email.com"
                    className={cn("h-12 bg-card rounded-xl", fulfilmentEmail.trim().length > 0 && !isValidEmail(fulfilmentEmail) && "border-destructive focus-visible:ring-destructive")}
                  />
                  {fulfilmentEmail.trim().length > 0 && !isValidEmail(fulfilmentEmail) && (
                    <p className="text-xs text-destructive">Enter a valid email address.</p>
                  )}
                </Field>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground shrink-0">{t("activation.identity.or")}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <button
                  type="button"
                  onClick={() => setQrScanOpen(true)}
                  className="w-full flex items-center gap-3 text-start p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/25 hover:border-primary/50 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{t("activation.identity.scanQr")}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t("activation.identity.scanQrNote")}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-primary/60 shrink-0 rtl:rotate-180" />
                </button>
              </>
            )}

            {/* Whitelist status — normal (non-fulfilment) flow only; fulfilment derives it from email below */}
            {!isFulfilment && (
              <PrototypeTestBox
                heading="test ID numbers"
                description="Use these to try both cases. This box won't appear in the real implementation."
                items={[
                  { value: NORMAL_TEST_ID_NUMBER, note: "Normal customer" },
                  { value: WHITELISTED_TEST_ID_NUMBER, note: "Whitelisted customer" },
                ]}
                onSelect={setIdNumber}
              />
            )}

            {/* Fulfilment: payment & whitelist status come back automatically from the application lookup */}
            {isFulfilment && (
              <>
                <PrototypeTestBox
                  heading="test emails"
                  description="Use these to try every case (paid/unpaid × prepaid/postpaid × vanity/standard × whitelisted/not). This box won't appear in the real implementation."
                  items={[
                    { value: FULFILMENT_PAID_EMAIL, note: "Standard number", group: "Prepaid (paid)" },
                    { value: FULFILMENT_POSTPAID_STANDARD_EMAIL, note: "Standard number, normal", group: "Postpaid (paid)" },
                    { value: FULFILMENT_POSTPAID_STANDARD_WHITELISTED_EMAIL, note: "Standard number, whitelisted", group: "Postpaid (paid)" },
                    { value: FULFILMENT_POSTPAID_VANITY_EMAIL, note: "Vanity paid, no commitment, normal", group: "Postpaid (paid)" },
                    { value: FULFILMENT_POSTPAID_VANITY_WHITELISTED_EMAIL, note: "Vanity paid, no commitment, whitelisted", group: "Postpaid (paid)" },
                    { value: FULFILMENT_POSTPAID_VANITY_COMMITTED_EMAIL, note: "Vanity free w/ 18-mo commitment (Nafith verified), normal", group: "Postpaid (paid)" },
                    { value: FULFILMENT_POSTPAID_VANITY_COMMITTED_WHITELISTED_EMAIL, note: "Vanity free w/ commitment, whitelisted", group: "Postpaid (paid)" },
                    { value: FULFILMENT_UNPAID_EMAIL, note: "Normal", group: "Unpaid" },
                    { value: FULFILMENT_UNPAID_WHITELISTED_EMAIL, note: "Whitelisted", group: "Unpaid" },
                    { value: FULFILMENT_UNPAID_POSTPAID_STANDARD_EMAIL, note: "Switch Postpaid — Standard number, normal", group: "Unpaid (Switch Postpaid)" },
                    { value: FULFILMENT_UNPAID_POSTPAID_STANDARD_WHITELISTED_EMAIL, note: "Switch Postpaid — Standard number, whitelisted", group: "Unpaid (Switch Postpaid)" },
                    { value: FULFILMENT_UNPAID_POSTPAID_VANITY_EMAIL, note: "Switch Postpaid — Vanity, no commitment, normal", group: "Unpaid (Switch Postpaid)" },
                    { value: FULFILMENT_UNPAID_POSTPAID_VANITY_WHITELISTED_EMAIL, note: "Switch Postpaid — Vanity, no commitment, whitelisted", group: "Unpaid (Switch Postpaid)" },
                    { value: FULFILMENT_UNPAID_POSTPAID_VANITY_COMMITTED_EMAIL, note: "Switch Postpaid — Vanity free w/ commitment, normal", group: "Unpaid (Switch Postpaid)" },
                    { value: FULFILMENT_UNPAID_POSTPAID_VANITY_COMMITTED_WHITELISTED_EMAIL, note: "Switch Postpaid — Vanity free w/ commitment, whitelisted", group: "Unpaid (Switch Postpaid)" },
                    { value: FULFILMENT_UNKNOWN_EMAIL, note: "Not registered", group: "Other" },
                  ]}
                  onSelect={(email) => { setFulfilmentEmail(email); setQrVerified(false); }}
                />
              </>
            )}
          </>
        )}

        {/* ── Step 1 — Subscription Type ── */}
        {step === 1 && (
          <>
            {fulfilmentLocked && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-4 py-3">
                <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
                  This customer already chose everything and paid online — just enter the KIT code (or change SIM Type, if needed) and hand over the SIM.
                </p>
              </div>
            )}
            {/* 1. SIM Type — always changeable, even on a paid fulfilment request */}
            <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("activation.subscription.simType")} <span className="text-destructive">*</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <SimCard active={simType === "psim"} label={t("activation.subscription.psim")} icon={Microchip} onClick={() => setSimType("psim")} />
                  <SimCard active={simType === "esim"} label={t("activation.subscription.esim")} icon={QrCode} onClick={() => setSimType("esim")} />
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
                        {kitChecking ? (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" aria-label="Checking KIT">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </span>
                        ) : (
                          <button type="button" onClick={() => { setKit("1234567890"); setKitError(null); setKitChecked(false); setKitChecking(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary" aria-label="Scan KIT">
                            <ScanLine className="w-5 h-5" />
                          </button>
                        )}
                      </div>
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

            {/* 2. Subscription Type — through to Number section below. Read-only summary for a paid
                fulfilment request, since it won't ever become editable — the dealer just needs to see it. */}
            {fulfilmentLocked ? (
              <div className="space-y-4">
                {selectedPlanObj && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Selected Plan</h3>
                    <PlanCard
                      plan={selectedPlanObj}
                      selected
                      active
                      onSelect={() => {}}
                      hideRadio
                      minsLabel={selectedPlanObj.categories?.includes("switch-postpaid") ? "Local Mins" : "Flex Mins"}
                      layout={
                        selectedPlanObj.categories?.includes("switch-postpaid") ? "postpaid"
                        : selectedPlanObj.categories?.includes("aman") ? "aman"
                        : selectedPlanObj.categories?.includes("base-plan") || selectedPlanObj.categories?.includes("basic") ? "baqa"
                        : "flex"
                      }
                    />
                  </div>
                )}
                {/* Read-only Number card — shown under the Selected Plan section.
                    Mirrors the SIM Activation number section but only shows the selected
                    number and its vanity tier / commitment details. */}
                {showNumber && subType === "sim" && phone && (
                  <section className="bg-card rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t("activation.subscription.phoneSection")}</p>
                    </div>
                    <div className="bg-primary/5 rounded-xl py-3 px-4 flex flex-col items-center gap-1">
                      <span className="text-lg font-semibold tracking-wide text-foreground">{phone}</span>
                      {(() => {
                        const tier = DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier;
                        const tab = NUMBER_TABS.find(t => t.value === tier);
                        if (!tab || tab.value === "all") return null;
                        const showCommitted = isPostpaidMobile && pickedVanityCat && pickedVanityCat.months > 0 && pickedCategoryEligibleFree && vanityCommitment;
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {tab.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.color }} />}
                              <span className="text-[11px] font-semibold" style={{ color: tab.color ?? undefined }}>{t(`activation.subscription.numberTabs.${tab.value}`, tab.label)}</span>
                              <span className="text-[11px] text-muted-foreground">·</span>
                              {showCommitted && pickedVanityCat ? (
                                <span className="text-[11px] text-muted-foreground line-through font-normal"><RiyalSymbol /> {pickedVanityCat.price}</span>
                              ) : (
                                <span className="text-[11px] font-semibold text-foreground">
                                  {pickedVanityCat ? <><RiyalSymbol /> {pickedVanityCat.price}</> : (tab.fee ? <><RiyalSymbol /> {tab.fee}</> : t("activation.checkout.free"))}
                                </span>
                              )}
                            </div>
                            {showCommitted && pickedVanityCat && (
                              <span className="text-[11px] font-semibold text-emerald-600">
                                {t("activation.vanity.commitmentOn", { months: pickedVanityCat.months })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </section>
                )}
                {showNumber && subType === "mnp" && portNumber && (
                  <section className="bg-card rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t("activation.subscription.portMnp")}</p>
                    </div>
                    <div className="bg-primary/5 rounded-xl py-3 px-4 flex flex-col items-center gap-1">
                      <span className="text-lg font-semibold tracking-wide text-foreground">{portNumber}</span>
                    </div>
                  </section>
                )}
              </div>
            ) : (
            <div className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("activation.subscription.subscriptionTypeTitle")}</h3>
              {/* Payment type toggle */}
              <div className="flex gap-3">
                {([{ value: "prepaid", label: t("activation.subscription.prepaid"), Icon: Wallet }, { value: "postpaid", label: t("activation.subscription.postpaid"), Icon: Receipt }] as const).map(({ value, label, Icon }) => {
                  const selected = payType === value;
                  const isDisabled = value === "postpaid" && !isSaudiId;
                  return (
                    <button key={value} type="button" disabled={isDisabled}
                      onClick={() => { if (isDisabled) return; setPayType(value); if (value === "postpaid" && simType === "esim") setLineType("mobile"); }}
                      className={cn("relative flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all",
                        isDisabled ? "border bg-muted/40 border-border/60 opacity-50 cursor-not-allowed" : selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60")}>
                      {/* Radio indicator */}
                      <span className={cn("absolute top-2.5 right-2.5 w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        selected && !isDisabled ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                        {selected && !isDisabled && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <Icon className={cn("w-6 h-6", selected && !isDisabled ? "text-primary" : "text-muted-foreground")} />
                      <p className={cn("text-sm font-semibold", selected && !isDisabled ? "text-foreground" : "text-muted-foreground")}>{label}</p>
                    </button>
                  );
                })}
              </div>
              {!isSaudiId && (
                <p className="text-[11px] text-muted-foreground px-1">{t("activation.subscription.postpaidSaudiOnly")}</p>
              )}
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
              onSelect={(i) => setSelectedPlan((prev) => (prev === i ? null : i))}
              plans={lineType === "internet" ? INTERNET_PLANS : payType === "prepaid" ? PREPAID_PLANS : POSTPAID_PLANS.filter(p => p.categories?.some(c => c === "switch-postpaid" || c === "vnet") && !(simType === "esim" && p.categories?.includes("vnet")) && !(isFulfilment && p.categories?.includes("vnet")))}
              categoryFilter={showPlanTypeChips ? planTypeChip : undefined}
            />

            {/* 6. Device — Postpaid Internet only. Only one device offered for now. */}
            {showDevice && deviceObj && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("activation.subscription.deviceTitle")} <span className="text-destructive">*</span>
                </h3>
                <div className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                    <Router className="w-5 h-5" />
                  </div>
                  <p className="flex-1 text-sm font-semibold text-foreground">{deviceObj.name}</p>
                  <div className="text-right shrink-0">
                    {deviceObj.price > 0
                      ? <span className="text-sm font-bold text-foreground"><RiyalSymbol /> {deviceObj.price}</span>
                      : <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t("activation.subscription.deviceIncluded")}</span>
                    }
                  </div>
                </div>
              </section>
            )}

            {/* In-Store Device Handover / Skip Delivery — shown right under Device when dealer is whitelisted (VNet) */}
            {showHandoverOption && (
              <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 transition-colors cursor-pointer"
                  onClick={() => setIsDealerHandover(v => !v)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isDealerHandover ? "bg-primary/15" : "bg-muted")}>
                      <Store className={cn("w-4 h-4", isDealerHandover ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("activation.handover.title")}</p>
                      <p className="text-[11px] text-muted-foreground">{t("activation.handover.subtitle")}</p>
                    </div>
                  </div>
                  <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", isDealerHandover ? "bg-primary" : "bg-muted-foreground/30")}>
                    <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", isDealerHandover ? "start-5" : "start-0.5")} />
                  </div>
                </div>
                {isDealerHandover && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/60">
                    <Field label={`${t("activation.handover.deviceSerialNumber")} *`}>
                      <div className="relative">
                        <Input
                          value={deviceSerialNumber}
                          onChange={(e) => setDeviceSerialNumber(e.target.value)}
                          placeholder="e.g. SN-00123456"
                          className="h-12 bg-card rounded-xl pr-12"
                        />
                        <button
                          type="button"
                          aria-label="Scan serial number"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                        >
                          <ScanLine className="w-5 h-5" />
                        </button>
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* Number — Mobile only. Shown by default; the Vanity Number overview inside appears once a plan is selected. */}
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

                {/* Vanity numbers available for this plan — simple promo banner. Not relevant when porting an existing number. */}
                {subType === "sim" && isPostpaidMobile && selectedPlanObj && (() => {
                  const eligibleTierCats = eligibleVanityCategories.filter(c => c.months > 0);
                  if (eligibleTierCats.length === 0) return null;
                  return (
                    <div className="mb-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/25 p-3 flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold text-foreground">{t("activation.vanity.availableBannerTitle")}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {eligibleTierCats.map((c) => (
                            <span key={c.tier} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${c.color}1A`, color: c.color }}>
                              {t(`activation.vanity.tiers.${c.tier}`)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {subType === "sim" ? (
                  <>
                    <div className="bg-primary/5 rounded-xl py-3 px-4 mb-3 flex flex-col items-center gap-1">
                      <span className="text-lg font-semibold tracking-wide text-foreground">{phone}</span>
                      {/* OLD approach: flat tier fee shown here, commitment decided afterwards via the
                          checkbox further down. Kept commented in case we need to revert.
                      {(() => {
                        const tier = DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier;
                        const tab = NUMBER_TABS.find(t => t.value === tier);
                        if (!tab || tab.value === "all") return null;
                        return (
                          <div className="flex items-center gap-1.5">
                            {tab.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.color }} />}
                            <span className="text-[11px] font-semibold" style={{ color: tab.color ?? undefined }}>{t(`activation.subscription.numberTabs.${tab.value}`, tab.label)}</span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] font-semibold text-foreground">{tab.fee ? <><RiyalSymbol /> {tab.fee}</> : t("activation.checkout.free")}</span>
                          </div>
                        );
                      })()}
                      */}
                      {/* NEW: reflects the commitment choice made in the popup — struck-through
                          vanity price when committed, real price when the dealer chose to pay instead. */}
                      {(() => {
                        const tier = DEMO_NUMBER_POOL.find(n => n.number === phone)?.tier;
                        const tab = NUMBER_TABS.find(t => t.value === tier);
                        if (!tab || tab.value === "all") return null;
                        const showCommitted = isPostpaidMobile && pickedVanityCat && pickedVanityCat.months > 0 && pickedCategoryEligibleFree && vanityCommitment;
                        return (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center justify-center gap-1.5">
                              {tab.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: tab.color }} />}
                              <span className="text-[11px] font-semibold" style={{ color: tab.color ?? undefined }}>{t(`activation.subscription.numberTabs.${tab.value}`, tab.label)}</span>
                              <span className="text-[11px] text-muted-foreground">·</span>
                              {showCommitted && pickedVanityCat ? (
                                <span className="text-[11px] text-muted-foreground line-through font-normal"><RiyalSymbol /> {pickedVanityCat.price}</span>
                              ) : (
                                <span className="text-[11px] font-semibold text-foreground">
                                  {pickedVanityCat ? <><RiyalSymbol /> {pickedVanityCat.price}</> : (tab.fee ? <><RiyalSymbol /> {tab.fee}</> : t("activation.checkout.free"))}
                                </span>
                              )}
                            </div>
                            {showCommitted && pickedVanityCat && (
                              <span className="text-[11px] font-semibold text-emerald-600">
                                {t("activation.vanity.commitmentOn", { months: pickedVanityCat.months })}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <button onClick={() => setNumberPickerOpen(true)} className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-sm font-semibold">
                      {t("activation.subscription.pickDifferent")} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                    {SHOW_VANITY_OVERVIEW && isPostpaidMobile && !selectedPlanObj && (
                      <p className="text-[11px] text-muted-foreground text-center mt-2">{t("activation.vanity.selectPlanFirst")}</p>
                    )}

                    {/* OLD approach: commitment checkbox shown after picking a number, letting the
                        dealer toggle commitment on/off in place. Replaced by the popup shown at
                        selection time in the number picker. Kept commented in case we need to revert.
                    {isPostpaidMobile && selectedPlanObj && pickedVanityCat && pickedVanityCat.months > 0 && (
                      pickedCategoryEligibleFree ? (
                        <button
                          type="button"
                          onClick={() => setVanityCommitment((v) => !v)}
                          className="w-full flex items-start gap-2.5 rounded-xl border border-border/60 p-3 mt-3 text-start"
                        >
                          <span className={cn("mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors", vanityCommitment ? "bg-primary border-primary" : "border-muted-foreground/40")}>
                            {vanityCommitment && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                          </span>
                          <span className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground">{t("activation.vanity.commitmentLabel")}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {vanityCommitment
                                ? t("activation.vanity.commitmentOn", { months: pickedVanityCat.months })
                                : t("activation.vanity.commitmentOff", { price: pickedVanityCat.price })}
                            </p>
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 rounded-full px-2 py-1 shrink-0">
                            {t("activation.vanity.monthsPill", { months: pickedVanityCat.months })}
                          </span>
                        </button>
                      ) : (
                        <div className="mt-3 rounded-xl bg-muted/40 border border-border/60 p-3 space-y-1">
                          <p className="text-[13px] font-semibold text-foreground">{t(`activation.vanity.categories.${pickedVanityCat.key}`)} · {t(`activation.vanity.tiers.${pickedVanityCat.tier}`)}</p>
                          <p className="text-[11px] text-muted-foreground">{t("activation.vanity.notEligible")}</p>
                          <p className="text-[13px] font-semibold text-foreground"><RiyalSymbol /> {pickedVanityCat.price}</p>
                        </div>
                      )
                    )}
                    */}
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
                    <p className="text-[11px] text-muted-foreground">{t("activation.subscription.portNote")}</p>
                  </div>
                )}

                {/* Vanity Number categories — informational overview of what's eligible for the plan — hidden for now */}
                {SHOW_VANITY_OVERVIEW && isPostpaidMobile && subType === "sim" && selectedPlanObj && (
                  <div className="mt-4 pt-3 border-t border-border/60">
                    <p className="text-xs font-semibold text-foreground">{t("activation.vanity.title")}</p>
                    <p className="text-[11px] text-muted-foreground mb-2.5">{t("activation.vanity.subtitle")}</p>
                    <div className="space-y-2">
                      {eligibleVanityCategories.map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => { setNumberPickerTab(c.tier); setNumberPickerOpen(true); }}
                          className="w-full flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5 text-start hover:bg-muted/40 active:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-foreground truncate">
                                {t(`activation.vanity.categories.${c.key}`)}
                                <span className="text-muted-foreground font-normal"> · {t(`activation.vanity.tiers.${c.tier}`)}</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {c.months > 0 ? t("activation.vanity.commitment", { months: c.months }) : t("activation.vanity.noCommitment")}
                              </p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 shrink-0 ms-2">
                            <span className="text-[11px] font-semibold text-emerald-600">
                              {c.months > 0 ? t("activation.vanity.freeWithCommitment") : t("activation.vanity.alwaysFree")}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground rtl:rotate-180" />
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Commitment toggle — applies to the picked vanity number (from the sheet) — hidden for now */}
                    {SHOW_VANITY_OVERVIEW && pickedVanityCat && pickedVanityCat.months > 0 && (
                      pickedCategoryEligibleFree ? (
                        <div className="mt-3 rounded-xl bg-muted/40 border border-border/60 p-3 space-y-2.5">
                          <button type="button" onClick={() => setVanityCommitment((v) => !v)} className="w-full flex items-center justify-between">
                            <div className="text-start">
                              <p className="text-[13px] font-semibold text-foreground">{t("activation.vanity.commitmentLabel")}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {vanityCommitment
                                  ? t("activation.vanity.commitmentOn", { months: pickedVanityCat.months })
                                  : t("activation.vanity.commitmentOff", { price: pickedVanityCat.price })}
                              </p>
                            </div>
                            <div className={cn("w-11 h-6 rounded-full transition-colors relative shrink-0", vanityCommitment ? "bg-primary" : "bg-muted-foreground/30")}>
                              <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", vanityCommitment ? "start-5" : "start-0.5")} />
                            </div>
                          </button>
                          {vanityCommitment
                            ? <p className="text-[11px] text-primary flex items-start gap-1.5"><FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {t("activation.vanity.nafithNote")}</p>
                            : <p className="text-[11px] font-semibold text-foreground"><RiyalSymbol /> {pickedVanityCat.price} · {t("activation.vanity.noCommitment")}</p>}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl bg-muted/40 border border-border/60 p-3 space-y-1">
                          <p className="text-[13px] font-semibold text-foreground">{t(`activation.vanity.categories.${pickedVanityCat.key}`)} · {t(`activation.vanity.tiers.${pickedVanityCat.tier}`)}</p>
                          <p className="text-[11px] text-muted-foreground">{t("activation.vanity.notEligible")}</p>
                          <p className="text-[13px] font-semibold text-foreground"><RiyalSymbol /> {pickedVanityCat.price}</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
          )}
          </>
        )}

        {/* ── Step 2 — Checkout ── */}
        {step === 2 && (
          <>
            {/* Fulfilment: payment already collected upstream */}
            {isFulfilment && alreadyPaid && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-700 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Payment Already Completed</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Customer payment has already been completed. No additional payment collection is required.
                  </p>
                </div>
              </div>
            )}
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
                  cats.includes("basic") ? t("activation.subscription.chips.basic") :
                  cats.includes("flex") ? t("activation.subscription.chips.flex") : "";
                return planTypeLabel ? <SummaryRow label={t("activation.checkout.planType")} value={planTypeLabel} /> : null;
              })()}
              {selectedPlanObj && <SummaryRow label={t("activation.checkout.planName")} value={selectedPlanObj.title} />}
              {selectedPlanObj?.validityLabel && <SummaryRow label={t("activation.checkout.planValidity")} value={formatValidity(selectedPlanObj.validityLabel)} />}
              {planMode === "topup" && topupAmount > 0 && <SummaryRow label={t("activation.checkout.topupValue")} value={<><RiyalSymbol /> {topupAmount}</>} />}
              {showNumber && <SummaryRow label={t("activation.checkout.numberType")} value={subType === "sim" ? t("activation.subscription.newNumberBtn") : t("activation.subscription.portMnp")} />}
              {showNumber && subType === "sim" && phone && <SummaryRow label={t("activation.checkout.phoneNumber")} value={phone} />}
              {showNumber && subType === "sim" && pickedTier && pickedTier !== "standard" && (
                <SummaryRow label={t("activation.checkout.vanityLevel")} value={t(`activation.vanity.tiers.${pickedTier}`, NUMBER_TABS.find(tb => tb.value === pickedTier)?.label ?? "")} />
              )}
              {showNumber && subType === "mnp" && portNumber && <SummaryRow label={t("activation.subscription.portNumber")} value={portNumber} />}
              {showDevice && <SummaryRow label={t("activation.checkout.device")} value={deviceObj?.name ?? ""} />}
            </section>

            {/* Promo Code — hidden when payment already completed (fulfilment) */}
            {!(isFulfilment && alreadyPaid) && (
            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{t("activation.checkout.promoCode")}</p>
                </div>
                <Switch
                  checked={promoEnabled}
                  onCheckedChange={(v) => {
                    setPromoEnabled(v);
                    if (!v) {
                      setPromoApplied(false);
                      setPromoCode("");
                      setPromoError(false);
                    }
                  }}
                />
              </div>
              {promoEnabled && (promoApplied && activePromo ? (
                <div className="space-y-2">
                  {/* Applied header row */}
                  <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm font-semibold text-green-700">{promoCode} {t("activation.checkout.promoApplied")}</span>
                    </div>
                    <button type="button" onClick={() => { setPromoApplied(false); setPromoCode(""); setPromoError(false); }} className="text-xs text-muted-foreground hover:text-destructive font-medium shrink-0">{t("activation.checkout.removePromo")}</button>
                  </div>
                  {/* Benefit tags — all shown the same way regardless of type, matching the confirmed applied-promo look */}
                  <div className="flex flex-wrap gap-1">
                    {activePromo.benefits.map((b, i) => {
                      if (b.type === "discount") return (
                        <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                          <RiyalSymbol className="w-2.5 h-2.5" /> {b.value} {t("activation.checkout.promoDiscount")}
                        </span>
                      );
                      if (b.type === "data") return (
                        <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                          <Gift className="w-2.5 h-2.5" /> +{b.value} {t("activation.checkout.promoData")}
                        </span>
                      );
                      if (b.type === "credit") return (
                        <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-emerald-200/70 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                          <Gift className="w-2.5 h-2.5" /> {t("activation.checkout.promoCredit")}
                        </span>
                      );
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-1.5">
                  <div className="flex gap-2">
                    <Input value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(false); }} placeholder={t("activation.checkout.promoPlaceholder")} className={cn("flex-1", promoError && "border-destructive")} />
                    <Button type="button" className="shrink-0 bg-primary/10 hover:bg-primary/20 text-foreground border-0 rounded-xl" onClick={() => { if (PROMO_CATALOGUE[promoCode]) { setPromoApplied(true); setPromoError(false); } else setPromoError(true); }}>{t("activation.checkout.applyPromo")}</Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Prototype: try SAVE10 (single discount) or MEGA (discount + data + credit).</p>
                </div>
              ))}
              {promoEnabled && promoError && <p className="text-xs text-destructive mt-1.5">{t("activation.checkout.promoError")}</p>}
            </section>
            )}

            {/* Switch Postpaid: dealer credit limit note */}
            {isPostpaidMobile && selectedPlanObj && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 p-3.5">
                <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
                <p className="text-xs text-sky-700 dark:text-sky-300 leading-snug">
                  <span className="font-semibold">{t("activation.checkout.creditLimitNote", { amount: switchPostpaidCreditLimit.toFixed(2) })}</span>{" "}
                  {t("activation.checkout.creditLimitSub")}
                </p>
              </div>
            )}

            {/* Whitelisted customer notice */}
            {isWhitelisted && (
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

              {/* Case 0: fulfilment already paid online → everything already settled, total 0 */}
              {isFulfilment && alreadyPaid ? (() => {
                const paidSubtotal = planPrice + simFee + numberFee + deviceFee;
                const paidVat = vatWaived ? 0 : Math.round(paidSubtotal * 0.15);
                const paidTotal = paidSubtotal + paidVat;
                return (
                <>
                  <div className="space-y-2 pb-3">
                    {showNumber && subType === "sim" && numberFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.numberPrice")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {numberFee}</span>
                      </div>
                    )}
                    {showDevice && deviceFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{deviceObj?.name}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {deviceFee}</span>
                      </div>
                    )}
                    {selectedPlanObj && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{selectedPlanObj.title}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {planPrice}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border/60 space-y-2 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                      <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {paidSubtotal}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                      <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {paidVat}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
                        {t("activation.checkout.alreadyPaidLabel")}
                      </span>
                      <span className="text-base font-bold text-muted-foreground line-through"><RiyalSymbol /> {paidTotal}</span>
                    </div>
                  </div>
                </>
                );
              })() : /* Case 1: whitelisted + free number → show waived rows, total 0 */
              isWhitelisted && !isVipNumber ? (
                <>
                  <div className="space-y-2 pb-3">
                    {showDevice && deviceFee > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{deviceObj?.name}</span>
                        <span className="text-xs font-semibold text-amber-600">{t("activation.checkout.waived")}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{planMode === "plan" ? (selectedPlanObj?.title ?? t("activation.checkout.planLabel")) : t("activation.checkout.topupLabel")}</span>
                      <span className="text-xs font-semibold text-amber-600">{t("activation.checkout.waived")}</span>
                    </div>
                  </div>
                  <div className="border-t border-border/60 space-y-2 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                      <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> 0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                      <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> 0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                    <span className="text-base font-bold text-primary"><RiyalSymbol /> 0</span>
                  </div>
                </>
              ) : /* Case 2: whitelisted + VIP number → only show VIP number fee + VAT */
                isWhitelisted && isVipNumber ? (() => {
                  // Whitelisted + Switch Postpaid vanity: without commitment the dealer pays
                  // the real number price + 15% VAT; with commitment the deposit path handles it.
                  const displayNumberFee = numberFee;
                  const displayVat = Math.round(numberFee * 0.15);
                  const displayTotal = displayNumberFee + displayVat;
                  return (
                  <>
                    <div className="space-y-2 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.numberPrice")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {displayNumberFee}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/60 space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {displayNumberFee}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {displayVat}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                      <span className="text-base font-bold text-primary"><RiyalSymbol /> {displayTotal}</span>
                    </div>
                  </>
                  );
                })() : (
                  <>
                    <div className="space-y-2 pb-3">
                      {showNumber && subType === "sim" && numberFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{t("activation.checkout.numberPrice")}</span>
                          <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {numberFee}</span>
                        </div>
                      )}
                      {showDevice && deviceFee > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{deviceObj?.name}</span>
                          <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {deviceFee}</span>
                        </div>
                      )}
                      {selectedPlanObj && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{isPostpaidDeposit ? t("activation.checkout.deposit") : selectedPlanObj.title}</span>
                          <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {planFeeRaw}</span>
                        </div>
                      )}
                      {planMode === "topup" && topupAmount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">{t("activation.checkout.topupLabel")}</span>
                          <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {topupAmount}</span>
                        </div>
                      )}
                      {promoApplied && promoDiscount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-green-600">{t("activation.checkout.promoLabel")} ({promoCode})</span>
                          <span className="text-xs font-semibold text-green-600">−<RiyalSymbol /> {promoDiscount}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border/60 space-y-2 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.subtotal")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {subtotal}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{t("activation.checkout.vat")}</span>
                        <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {vat}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border/60 pt-3">
                      <span className="text-sm font-semibold text-foreground">{t("activation.checkout.total")}</span>
                      <span className="text-base font-bold text-primary"><RiyalSymbol /> {total}</span>
                    </div>
                  </>
                )}
            </section>

            {/* Payment Method — hidden for whitelisted with free number, or fulfilment already-paid */}
            {!(isWhitelisted && !isVipNumber) && !(isFulfilment && alreadyPaid) && (
              <section className="bg-card rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{t("activation.checkout.paymentMethod")} <span className="text-destructive">*</span></p>
                </div>
                <div className="space-y-2">
                  <PayOption icon={CreditCard} label={t("activation.checkout.dealerWallet")} description={t("activation.checkout.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE })} selected={pay === "card"} onClick={() => setPay("card")} />
                  <PayOption icon={HandCoins} label={t("activation.checkout.posTerminal")} description={t("activation.checkout.posTerminalDesc")} selected={pay === "pos"} onClick={() => setPay("pos")} />
                </div>
              </section>
            )}

            {/* Contact Details */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("activation.checkout.contactDetails")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                <Field label={emailRequired ? `${t("activation.checkout.email")} *` : t("activation.checkout.email")}>
                  <Input
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="example@email.com"
                    inputMode="email"
                    readOnly={isFulfilment}
                    className={cn("h-12 bg-card rounded-xl", isFulfilment && "bg-muted/40 text-muted-foreground cursor-not-allowed")}
                  />
                </Field>
                <Field label={contactNumberRequired ? `${t("activation.checkout.contactNumber")} *` : t("activation.checkout.contactNumber")}>
                  <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="05XXXXXXXX" inputMode="numeric" className="h-12 bg-card rounded-xl" />
                </Field>
              </div>
            </div>

            {/* Address Details */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("activation.checkout.addressDetails")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                {/* City required for all cases (prepaid + postpaid) */}
                <Field label={`${t("activation.subscription.city")} *`}>
                  <Select value={contactCity} onValueChange={setContactCity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label={isVnetMode ? `${t("activation.subscription.nationalAddress")} *` : t("activation.subscription.nationalAddress")}>
                  <Input
                    value={nationalAddress}
                    onChange={(e) => setNationalAddress(e.target.value)}
                    placeholder="e.g. RRRD1234"
                    className="h-12 bg-card rounded-xl"
                  />
                </Field>
              </div>
            </div>

            {/* Delivery Details — Vnet only */}
            {showDelivery && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-semibold text-foreground">{t("activation.checkout.deliveryDetails")}</p>
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    {t("activation.checkout.map")}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </div>
                <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] space-y-3 border border-border/60">
                  <Field label={`${t("activation.checkout.region")} *`}>
                    <Select value={locationRegion} onValueChange={(v) => { setLocationRegion(v); setLocationDistrict(""); }}>
                      <SelectTrigger><SelectValue placeholder={t("activation.checkout.selectRegion")} /></SelectTrigger>
                      <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={`${t("activation.subscription.city")} *`}>
                    <Select value={contactCity} onValueChange={(v) => { setContactCity(v); setLocationDistrict(""); }}>
                      <SelectTrigger><SelectValue placeholder={t("activation.checkout.selectCity")} /></SelectTrigger>
                      <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={`${t("activation.subscription.district")} *`}>
                    <Select value={locationDistrict} onValueChange={setLocationDistrict}>
                      <SelectTrigger><SelectValue placeholder={t("activation.checkout.selectDistrict")} /></SelectTrigger>
                      <SelectContent>
                        {(DISTRICTS[contactCity] ?? []).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label={isVnetMode ? `${t("activation.subscription.nationalAddress")} *` : t("activation.subscription.nationalAddress")}>
                    <Input
                      value={nationalAddress}
                      onChange={(e) => setNationalAddress(e.target.value)}
                      placeholder="e.g. RRRD1234"
                      className="h-12 bg-card rounded-xl"
                    />
                  </Field>
                  <Field label={t("activation.checkout.addressLine")}>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder={t("activation.subscription.addressPlaceholder")}
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
                const matchedCity = city ? matchDemoCity(city) : "Riyadh";
                setContactCity(matchedCity);
                setLocationRegion(CITY_TO_REGION[matchedCity] ?? REGIONS[0]);
                const cityDistricts = DISTRICTS[matchedCity] ?? [];
                setLocationDistrict(cityDistricts[Math.floor(Math.random() * cityDistricts.length)] ?? "");
                setNationalAddress(generateNationalAddress());
                setDeliveryAddress(address);
              }}
            />

            {/* Verification — ID (Customer) Verification → OTP Verification → Nafith Verification → Customer Signature → Dealer Signature */}
            <p className="text-sm font-semibold text-foreground px-1">{t("activation.checkout.verification")}</p>

            {/* Customer Verification (ID Verification) — first step, always available */}
            <SectionCard title={t("activation.checkout.customerVerification")} required>
              {customerVerified ? (
                <VerifiedBanner label="Customer Verified" />
              ) : (
                <Button variant="outline" className="w-full bg-primary/10 hover:bg-primary/20 text-foreground border-0 rounded-full" onClick={() => setCustomerVerifyOpen(true)}>
                  {t("activation.checkout.verifyCustomer")}
                </Button>
              )}
            </SectionCard>

            {/* OTP Verification — unlocked after Customer Verification */}
            {showOtp && (
              <SectionCard title={t("activation.checkout.otp")} required={otpRequired}>
                {otpVerified ? (
                  <VerifiedBanner label="OTP Verified" />
                ) : (
                  <>
                    <Button variant="outline" className="w-full bg-primary/10 hover:bg-primary/20 text-foreground border-0 rounded-full disabled:!opacity-100 disabled:!bg-muted disabled:!text-muted-foreground" disabled={!otpGateOk} onClick={() => setOtpOpen(true)}>{t("activation.checkout.sendOtp")}</Button>
                    {!otpGateOk && (
                      <p className="text-[11px] text-muted-foreground mt-2">Complete Customer Verification first to unlock OTP Verification.</p>
                    )}
                  </>
                )}
              </SectionCard>
            )}

            {/* Nafith Verification — Switch Postpaid (vanity + commitment) or Vnet only; enabled only after OTP Verification */}
            {showNafith && (
              <SectionCard title={t("activation.checkout.nafath")} required>
                {nafithVerified ? (
                  <VerifiedBanner label="Nafith Verified" onRetry={() => { setNafithVerified(false); setNafithVerifyOpen(true); }} />
                ) : (
                  <>
                    <Button variant="outline" className="w-full bg-primary/10 hover:bg-primary/20 text-foreground border-0 rounded-full disabled:!opacity-100 disabled:!bg-muted disabled:!text-muted-foreground" disabled={!nafithGateOk} onClick={() => setNafithVerifyOpen(true)}>
                      {t("activation.checkout.nafathVerify")}
                    </Button>
                    {!nafithGateOk && (
                      <p className="text-[11px] text-muted-foreground mt-2">{t("activation.checkout.nafathLocked")}</p>
                    )}
                  </>
                )}
              </SectionCard>
            )}

            {/* Allow Promotional Calls — every mobile line except 5G MBB and Vnet */}
            {showPromoCalls && (
              <section className="bg-card rounded-2xl p-4 shadow-sm">
                <button
                  type="button"
                  className="flex items-center gap-3 select-none cursor-pointer w-full text-start"
                  onClick={() => setAllowPromoCalls(v => !v)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                    allowPromoCalls ? "bg-primary border-primary" : "border-primary"
                  )}>
                    {allowPromoCalls && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-sm text-foreground">{t("activation.checkout.allowPromoCalls")}</span>
                </button>
              </section>
            )}

            {/* Terms & Conditions + Privacy Policy — single combined consent */}
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
                    terms ? "bg-primary border-primary" : "border-primary"
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

            {/* Customer Signature — freely accessible; Payment itself is still gated on all verification steps being done */}
            <SignatureBox title={t("activation.checkout.customerSig")} required value={customerSig} onEdit={() => setSigEditor("customer")} onClear={() => setCustomerSig(null)} />

            {/* Dealer Signature — freely accessible; Payment itself is still gated on all verification steps being done */}
            <SignatureBox title={t("activation.checkout.dealerSig")} required value={dealerSig} onEdit={() => setSigEditor("dealer")} onClear={() => setDealerSig(null)} />
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <>
              {step === 1 && (
                <div className="flex items-center justify-center gap-1.5 -mt-0.5 mb-2 px-3.5 py-1 rounded-full bg-primary/5 border border-primary/15 w-fit mx-auto leading-none">
                  <Wallet className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-[12px] text-muted-foreground">{t("activation.subscription.walletBalanceLabel")}</span>
                  <span className="text-[12px] font-bold text-primary"><RiyalSymbol /> {DEALER_WALLET_BALANCE}</span>
                </div>
              )}
              <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinue} onClick={onContinue}>{t("activation.continue")}</Button>
            </>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setPayConfirmOpen(true)}>
              {total === 0 ? t("activation.checkout.submit") : <>{t("activation.checkout.pay")} <RiyalSymbol /> {total}</>}
            </Button>
          )}
        </div>
      </div>

      {/* Customer verification */}
      <SematiVerification open={customerVerifyOpen} audience="customer" onClose={() => setCustomerVerifyOpen(false)} onVerified={() => { setCustomerVerifyOpen(false); setCustomerVerified(true); }} />
      <NafithVerificationModal open={nafithVerifyOpen} onClose={() => setNafithVerifyOpen(false)} onVerified={() => { setNafithVerifyOpen(false); setNafithVerified(true); }} />

      {/* Fulfilment: QR scan lookup — full-screen camera-style view, no hardware access */}
      {qrScanOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-8">
          <button
            onClick={() => setQrScanOpen(false)}
            className="absolute top-6 end-6 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            aria-label={t("activation.verification.cancel")}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {qrScanStep === "scanning" ? (
            <>
              <div className="relative w-64 h-64 shrink-0">
                <div className="absolute top-0 start-0 w-10 h-10 border-t-4 border-s-4 border-primary rounded-tl-2xl" />
                <div className="absolute top-0 end-0 w-10 h-10 border-t-4 border-e-4 border-primary rounded-tr-2xl" />
                <div className="absolute bottom-0 start-0 w-10 h-10 border-b-4 border-s-4 border-primary rounded-bl-2xl" />
                <div className="absolute bottom-0 end-0 w-10 h-10 border-b-4 border-e-4 border-primary rounded-br-2xl" />
                <div className="absolute inset-x-6 top-1/2 h-0.5 bg-primary/80 animate-pulse" />
              </div>
              <p className="text-white text-sm font-semibold mt-8 text-center leading-snug">
                {t("activation.identity.qrNoticeDesc")}
              </p>
              <p className="text-white/50 text-xs mt-2 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("activation.identity.qrScanning")}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-white mb-1">{t("activation.identity.qrFound")}</h4>
                <p className="text-xs text-white/70">{t("activation.identity.qrFoundNote")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fulfilment: shown when Continue is pressed with a well-formed email that matches no application */}
      <Dialog open={customerNotFoundOpen} onOpenChange={setCustomerNotFoundOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-3 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none" stroke="#E30613" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <Mail className="w-7 h-7 text-[#E30613] relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-[#E30613] mb-2 text-lg">Email Not Registered</h4>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            This email isn't linked to any online application. Please double-check the address, or ask the customer to submit their application first.
          </p>
          <button
            onClick={() => setCustomerNotFoundOpen(false)}
            className="w-full py-3 rounded-full bg-[#E30613] text-white font-semibold text-sm"
          >
            Got It
          </button>
        </DialogContent>
      </Dialog>

      {/* Number picker drawer */}
      {(() => {
        // Switch Postpaid: before a plan is picked, only offer tiers free on ANY postpaid plan
        // (Rare/Silver, Value/Bronze, Standard) — Gold/Diamond depend on a plan we don't know yet.
        // Once a plan is selected, show every tier: eligible ones as "free with commitment",
        // ineligible ones (e.g. Diamond on a plan that only unlocks Gold) as a normal paid number.
        const eligibleTiers = isPostpaidMobile && !selectedPlanObj
          ? new Set(VANITY_CATEGORIES.filter(c => c.minTier === 0).map(c => c.tier))
          : null;
        const availableTabs = eligibleTiers ? NUMBER_TABS.filter(tab => tab.value === "all" || eligibleTiers.has(tab.value)) : NUMBER_TABS;
        const filtered = DEMO_NUMBER_POOL
          .filter(n => !eligibleTiers || eligibleTiers.has(n.tier))
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
                  <input value={numberSearch} onChange={e => setNumberSearch(e.target.value)} placeholder={t("activation.checkout.search")} style={{ fontSize: "16px" }} className="w-full h-11 bg-muted/50 rounded-xl ps-4 pe-10 text-base outline-none border border-border/40 rtl:text-right" />
                  <svg className="absolute end-3 top-3 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </div>
              </div>
              <div className="flex gap-2 px-5 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {availableTabs.map(tab => (
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
                    const isVanityTier = isPostpaidMobile && fee > 0 && item.tier !== "standard";
                    // Before a plan is picked, only tiers free on any plan are shown at all — plain "Free".
                    // Once a plan is selected, only the tiers that plan actually qualifies for are "free with
                    // commitment"; the rest (e.g. Diamond on a Gold-level plan) show their normal paid price.
                    const isTierEligibleForPlan = eligibleVanityCategories.some(c => c.tier === item.tier);
                    const freeWithCommitment = isVanityTier && !!selectedPlanObj && isTierEligibleForPlan;
                    const freePlain = isVanityTier && !selectedPlanObj;
                    const vanityCat = VANITY_CATEGORIES.find(c => c.tier === item.tier);
                    // OLD approach: tapping any row selected it immediately (commitment was decided
                    // afterwards via a checkbox on the main page). Kept commented in case we need
                    // to revert.
                    // onClick={() => { setPhone(item.number); setNumberPickerOpen(false); }}
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (freeWithCommitment) {
                            setPendingVanityNumber({ number: item.number, tier: item.tier });
                          } else {
                            setPhone(item.number);
                            setVanityCommitment(false);
                            setNumberPickerOpen(false);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-1 py-3.5 hover:bg-muted/30 transition-colors"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tier.color ?? "#0EA5E9" }} />
                        <span className="flex-1 text-start text-base font-semibold text-foreground">{item.number}</span>
                        {freeWithCommitment ? (
                          <span className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-emerald-600">
                              {vanityCat ? t("activation.vanity.commitmentOn", { months: vanityCat.months }) : t("activation.vanity.freeWithCommitment")}
                            </span>
                            <span className="text-[11px] text-muted-foreground line-through"><RiyalSymbol /> {vanityCat?.price ?? fee}.00</span>
                          </span>
                        ) : freePlain ? (
                          <span className="text-sm font-semibold text-muted-foreground">{t("activation.checkout.free")}</span>
                        ) : fee > 0 ? (
                          <span className="text-sm text-muted-foreground font-medium"><span className="font-bold text-foreground"><RiyalSymbol /></span> {fee}.00</span>
                        ) : (
                          <span className="text-sm font-semibold text-muted-foreground">{t("activation.checkout.free")}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        );
      })()}

      {/* Commitment choice popup — shown when picking a vanity number eligible for free-with-commitment */}
      {pendingVanityNumber && (() => {
        const cat = VANITY_CATEGORIES.find(c => c.tier === pendingVanityNumber.tier);
        if (!cat) return null;
        return (
          <Dialog open onOpenChange={(o) => !o && setPendingVanityNumber(null)}>
            <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
              <h4 className="font-semibold text-primary mb-1">
                {t(`activation.vanity.tiers.${cat.tier}`)} · {pendingVanityNumber.number}
              </h4>
              <p className="text-xs text-muted-foreground mb-4">{t("activation.vanity.choosePrompt")}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setPhone(pendingVanityNumber.number); setVanityCommitment(true); setPendingVanityNumber(null); setNumberPickerOpen(false); }}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
                >
                  {t("activation.vanity.getFreeWithCommitment", { months: cat.months })}
                </button>
                <button
                  onClick={() => { setPhone(pendingVanityNumber.number); setVanityCommitment(false); setPendingVanityNumber(null); setNumberPickerOpen(false); }}
                  className="w-full py-3 rounded-full bg-primary/10 text-foreground font-semibold text-sm"
                >
                  {t("activation.vanity.payNumberPrice", { price: cat.price })}
                </button>
                <button onClick={() => setPendingVanityNumber(null)} className="text-primary text-sm font-medium mt-1">
                  {t("activation.checkout.cancelBtn")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

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

      {/* eSIM devices drawer */}
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

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("activation.otpSheet.title")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("activation.otpSheet.errorSubtitle") : t("activation.otpSheet.subtitle")}
            </p>
            <div className="flex gap-2">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`checkout-otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigitAt(i, e.target.value)}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 text-center text-base font-semibold focus:outline-none",
                    otpError ? "border-destructive text-destructive" : "border-border focus:border-primary text-foreground"
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
              <Button onClick={() => { setTermsOpen(false); if (termsChain) { setPrivacyOpen(true); } else { setTerms(true); } }} className="w-full h-12 rounded-full">{t("activation.termsSheet.accept")}</Button>
            </DrawerClose>
            <DrawerClose asChild>
              <button type="button" className="text-sm font-semibold text-primary">{t("activation.termsSheet.cancel")}</button>
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
              <Button onClick={() => { if (termsChain) { setTerms(true); setTermsChain(false); } }} className="w-full h-12 rounded-full">{t("activation.privacySheet.close")}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Pay confirmation */}
      <Drawer open={payConfirmOpen} onOpenChange={setPayConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <DrawerHeader className="text-center px-0 pb-4">
            <div className="mx-auto mb-3 w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <DrawerTitle>{t(`activation.checkout.${confirmCopyKey}`)}</DrawerTitle>
            <DrawerDescription>{t(`activation.checkout.${confirmCopyKey}Desc`)}</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setPayConfirmOpen(false); setSuccessOpen(true); }}>
              {t(`activation.checkout.${confirmCopyKey}Btn`)}
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
        {simType === "esim" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`ESIM:${orderId}:${phone || contactNumber}`)}`}
                alt={t("activation.success.qrAlt")}
                className="w-40 h-40"
              />
              <p className="text-[11px] text-muted-foreground text-center px-4">{t("activation.success.qrHint")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">{t("activation.success.shareVia")}</p>
              <Select
                value={shareVia}
                onValueChange={(v: "mobile" | "email") => {
                  setShareVia(v);
                  setShareValue(v === "mobile" ? contactNumber : contactEmail);
                }}
              >
                <SelectTrigger className="h-11 bg-card rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">{t("activation.success.shareMobile")}</SelectItem>
                  <SelectItem value="email">{t("activation.success.shareEmail")}</SelectItem>
                </SelectContent>
              </Select>
              <Field label={shareVia === "mobile" ? t("activation.success.shareMobile") : t("activation.success.shareEmail")}>
                <Input
                  value={shareValue}
                  onChange={(e) => setShareValue(e.target.value)}
                  placeholder={shareVia === "mobile" ? "05XXXXXXXX" : "name@email.com"}
                  inputMode={shareVia === "mobile" ? "numeric" : "email"}
                  className="h-11 bg-card rounded-xl"
                />
              </Field>
              <Button
                className="w-full h-11 rounded-full"
                disabled={!shareValue.trim()}
                onClick={() => {
                  const text = t("activation.success.shareMessage", { orderId });
                  if (shareVia === "mobile") window.location.href = `sms:${shareValue}?&body=${encodeURIComponent(text)}`;
                  else window.location.href = `mailto:${shareValue}?subject=${encodeURIComponent(t("activation.success.shareSubject"))}&body=${encodeURIComponent(text)}`;
                }}
              >
                <Share2 className="w-4 h-4" /> {t("activation.success.share")}
              </Button>
            </div>
          </div>
        )}
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

export default NewActivation;
