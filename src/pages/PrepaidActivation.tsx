import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useNavigate, useLocation } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
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
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import * as SliderPrimitive from "@radix-ui/react-slider";
import SematiVerification from "@/components/SematiVerification";
import PlanCardComponent, { PlanCardData } from "@/components/PlanCard";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import {
  saveActivationDraft,
  clearActivationDraft,
  getActivationDraft,
  formatDraftAge,
} from "@/lib/activationDrafts";
import {
  ScanLine,
  Phone,
  ArrowRight,
  SlidersHorizontal,
  Plus,
  CreditCard,
  Banknote,
  Apple,
  Search,
  X,
  Wifi,
  PhoneCall,
  MessageSquare,
  Share2,
  Calendar,
  CheckCircle2,
  ArrowRightLeft,
  Sparkles,
  Pencil,
  Eraser,
  Tag,
  Database,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SimType = "psim" | "esim";
type PayMethod = "card" | "cash" | "apple";
type NumberSource = "new" | "mnp";
type NumberMode = "plan" | "topup";

// Feature flags (pending product decisions)
const SHOW_CUSTOMER_SIGNATURE = true; // hide cleanly when verification supersedes it

const tiers = ["Purple", "Gold", "Super Gold"] as const;
type Tier = typeof tiers[number];

const numbersByTier: Record<Tier, string[]> = {
  Purple: Array.from({ length: 9 }, () => "547896324"),
  Gold: Array.from({ length: 9 }, () => "555123456"),
  "Super Gold": Array.from({ length: 9 }, () => "566789012"),
};

const operators = ["STC", "Mobily", "Zain", "Virgin", "Lebara"];

const cities = [
  "Riyadh",
  "Jeddah",
  "Mecca",
  "Medina",
  "Dammam",
  "Khobar",
  "Tabuk",
  "Abha",
];

const topupValues = ["10", "20", "30", "50", "100", "200"];

const ALL_TAGS = ["5G", "Roaming", "Social", "Unlimited"] as const;
type PlanTag = typeof ALL_TAGS[number];

// Validity options shown as chips inside the filter sheet.
const VALIDITY_OPTIONS: { value: string; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
];

type PlanFilters = {
  validity: string[];
  price: [number, number]; // SAR
  data: [number, number]; // GB, DATA_MAX = Unlimited
  mins: [number, number]; // minutes, MINS_MAX = Unlimited
};

const PRICE_MIN = 10;
const PRICE_MAX = 60;
const DATA_MIN = 10;
const DATA_MAX = 200; // upper bound = "Unlimited"
const MINS_MIN = 10;
const MINS_MAX = 300; // upper bound = "Unlimited"

const DEFAULT_FILTERS: PlanFilters = {
  validity: [],
  price: [PRICE_MIN, PRICE_MAX],
  data: [DATA_MIN, DATA_MAX],
  mins: [MINS_MIN, MINS_MAX],
};

const parsePlanData = (s: string) => {
  if (/unlimited/i.test(s)) return DATA_MAX;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};
const parsePlanMins = (s: string) => {
  if (/unlimited/i.test(s)) return MINS_MAX;
  const m = s.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};

type Plan = PlanCardData & {
  categories: ("base-plan" | "minutes" | "data")[];
  validity: string[];
  tags: PlanTag[];
};

const plans: Plan[] = [
  {
    title: "Starter Plan",
    internet: "60 GB",
    mins: "100",
    sms: "500",
    social: "Unlimited",
    price: 30,
    discount: "Discount 50%",
    validityLabel: "Valid 30 days",
    categories: ["base-plan", "minutes"],
    validity: ["1m"],
    tags: ["5G", "Roaming", "Social"],
    features: [
      "Free roaming in GCC countries",
      "5G access included",
      "Unlimited WhatsApp & social apps",
      "Free SIM replacement once",
    ],
  },
  {
    title: "Smart Plan",
    internet: "80 GB",
    mins: "200",
    sms: "1000",
    social: "Unlimited",
    price: 45,
    discount: "Discount 30%",
    validityLabel: "Valid 30 days",
    categories: ["base-plan", "data"],
    validity: ["3m"],
    tags: ["5G", "Roaming", "Social"],
    features: [
      "Free roaming in GCC + Egypt",
      "5G+ access included",
      "Unlimited social & streaming apps",
      "Free international minutes: 30 min",
    ],
  },
  {
    title: "Ultimate Plan",
    internet: "120 GB",
    mins: "Unlimited",
    sms: "Unlimited",
    social: "Unlimited",
    price: 60,
    discount: null,
    validityLabel: "Valid 30 days",
    categories: ["data", "minutes"],
    validity: ["12m"],
    tags: ["5G", "Roaming", "Social", "Unlimited"],
    features: [
      "Truly unlimited local calls & SMS",
      "5G+ priority network access",
      "Free international minutes: 100 min",
      "Premium customer support 24/7",
    ],
  },
];

const PrepaidActivation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill;
  const resumeDraft = (location.state as any)?.resumeDraft === true;
  const draftIdNumber = prefill?.idNumber as string | undefined;

  // Pull the saved draft (if the caller asked us to resume it). Computed
  // synchronously so the initial state below is hydrated correctly.
  const initialDraft = useMemo(() => {
    if (!resumeDraft) return null;
    return getActivationDraft(draftIdNumber)?.data ?? null;
  }, [resumeDraft, draftIdNumber]);

  // Whether there is already saved progress for this customer (used for the
  // resume banner so the user knows they are continuing from saved data).
  const savedDraft = useMemo(() => {
    if (!draftIdNumber) return null;
    return getActivationDraft(draftIdNumber);
  }, [draftIdNumber]);

  const d = (k: string, fallback: any) =>
    initialDraft && initialDraft[k] !== undefined
      ? (initialDraft as any)[k]
      : prefill && prefill[k] !== undefined
      ? (prefill as any)[k]
      : fallback;

  const [simType, setSimType] = useState<SimType>(d("simType", "psim"));
  const [kit, setKit] = useState<string>(d("kit", ""));
  const [email, setEmail] = useState<string>(d("email", prefill?.email ?? ""));
  const [city, setCity] = useState<string>(d("city", prefill?.city ?? ""));

  // Number source
  const [numberSource, setNumberSource] = useState<NumberSource>(d("numberSource", "new"));
  const [phone, setPhone] = useState<string>(d("phone", "0785599574"));
  const [portNumber, setPortNumber] = useState<string>(d("portNumber", ""));
  const [portOperator, setPortOperator] = useState<string>(d("portOperator", ""));
  const [isPrimary, setIsPrimary] = useState<boolean>(d("isPrimary", true));

  // Number-mode (number with plan vs. number with top-up only)
  const [numberMode, setNumberMode] = useState<NumberMode>(d("numberMode", "plan"));
  const [topupValue, setTopupValue] = useState<string>(d("topupValue", ""));

  // Plans
  const [planType, setPlanType] = useState<string>(
    d("planType", "base-plan") || "base-plan",
  );
  const [planFilters, setPlanFilters] = useState<PlanFilters>(
    d("planFilters", DEFAULT_FILTERS),
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number>(d("selectedPlan", 0));

  const [promoOn, setPromoOn] = useState<boolean>(d("promoOn", false));
  const [promoCode, setPromoCode] = useState<string>(d("promoCode", ""));
  const [pay, setPay] = useState<PayMethod | "">(d("pay", ""));
  const [numberSheetOpen, setNumberSheetOpen] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<number | null>(null);

  // Wizard step: 1 = activation details, 2 = review + payment
  const [step, setStep] = useState<1 | 2>(1);

  // Verification + success flow
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [backConfirmOpen, setBackConfirmOpen] = useState(false);

  // Signatures
  const [customerSig, setCustomerSig] = useState<string | null>(d("customerSig", null));
  const [dealerSig, setDealerSig] = useState<string | null>(d("dealerSig", null));
  const [sigEditor, setSigEditor] = useState<null | "customer" | "dealer">(null);

  // Order details
  const [orderId, setOrderId] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("Nafath");

  // Count of non-default filter sections (used for the badge on the filter button).
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (planFilters.validity.length > 0) n++;
    if (
      planFilters.price[0] !== PRICE_MIN ||
      planFilters.price[1] !== PRICE_MAX
    )
      n++;
    if (
      planFilters.data[0] !== DATA_MIN ||
      planFilters.data[1] !== DATA_MAX
    )
      n++;
    if (
      planFilters.mins[0] !== MINS_MIN ||
      planFilters.mins[1] !== MINS_MAX
    )
      n++;
    return n;
  }, [planFilters]);

  // Filter plans against planType + structured filters.
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesType = p.categories.includes(planType as any);
      const matchesValidity =
        planFilters.validity.length === 0 ||
        planFilters.validity.some((v) => p.validity.includes(v));
      const matchesPrice =
        p.price >= planFilters.price[0] && p.price <= planFilters.price[1];
      const pData = parsePlanData(p.internet);
      const matchesData =
        pData >= planFilters.data[0] && pData <= planFilters.data[1];
      const pMins = parsePlanMins(p.mins);
      const matchesMins =
        pMins >= planFilters.mins[0] && pMins <= planFilters.mins[1];
      return (
        matchesType && matchesValidity && matchesPrice && matchesData && matchesMins
      );
    });
  }, [planType, planFilters]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    loop: false,
  });
  const [activeSnap, setActiveSnap] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setActiveSnap(idx);
      setSelectedPlan(idx);
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Reset carousel when filters change
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    setActiveSnap(0);
    setSelectedPlan(0);
  }, [filteredPlans.length, emblaApi]);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );

  const handlePay = () => {
    if (!pay) return;
    setVerifyOpen(true);
  };

  const currentPlan = filteredPlans[selectedPlan] ?? filteredPlans[0];

  // Auto-persist the in-progress activation to the customer's draft slot.
  // This covers the cancel/exit triggers (back button, app close, route
  // change) — anything the user already entered survives so a later Search
  // Customer match can offer to resume it.
  useEffect(() => {
    if (!draftIdNumber) return;
    if (successOpen) return; // don't re-save after submission
    saveActivationDraft(draftIdNumber, {
      simType,
      kit,
      email,
      city,
      numberSource,
      phone,
      portNumber,
      portOperator,
      isPrimary,
      numberMode,
      topupValue,
      planType,
      planFilters,
      selectedPlan,
      promoOn,
      promoCode,
      pay,
      customerSig,
      dealerSig,
    });
  }, [
    draftIdNumber,
    successOpen,
    simType,
    kit,
    email,
    city,
    numberSource,
    phone,
    portNumber,
    portOperator,
    isPrimary,
    numberMode,
    topupValue,
    planType,
    planFilters,
    selectedPlan,
    promoOn,
    promoCode,
    pay,
    customerSig,
    dealerSig,
  ]);

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-[hsl(210,20%,96%)]">
      <AppHeader
        title="Prepaid Activation"
        showBack
        onBackClick={() => setBackConfirmOpen(true)}
      />

      <div className="flex-1 px-4 pb-28 space-y-5">
        {savedDraft && (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 flex items-start gap-2">
            <History className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-amber-800">Continuing from saved data</p>
              <p className="text-[10px] text-amber-700/80 leading-snug">
                Last saved {formatDraftAge(savedDraft.savedAt)}. Your progress is kept if you leave.
              </p>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <StepPill index={1} label="Activation details" active={step === 1} done={step > 1} />
          <div className="flex-1 h-[2px] bg-border" />
          <StepPill index={2} label="Review & pay" active={step === 2} done={false} />
        </div>

        {step === 1 && (
          <>
        {/* SIM Type */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">SIM Type <span className="text-destructive">*</span></h3>
          <div className="grid grid-cols-2 gap-3">
            <SimCard active={simType === "psim"} label="P-SIM" onClick={() => setSimType("psim")} />
            <SimCard active={simType === "esim"} label="E-SIM" onClick={() => setSimType("esim")} />
          </div>
        </section>

        {/* KIT (P-SIM only) */}
        {simType === "psim" && (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">KIT <span className="text-destructive">*</span></h3>
            <div className="relative">
              <Input
                value={kit}
                onChange={(e) => setKit(e.target.value)}
                placeholder="KIT Code (10 Digits)"
                className="h-12 bg-card border-0 rounded-xl shadow-sm pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                aria-label="Scan KIT"
              >
                <ScanLine className="w-5 h-5" />
              </button>
            </div>
          </section>
        )}

        {/* Number source selector */}
        <section className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Phone number <span className="text-destructive">*</span></p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <SourceTab
              active={numberSource === "new"}
              icon={Sparkles}
              label="New number"
              onClick={() => setNumberSource("new")}
            />
            <SourceTab
              active={numberSource === "mnp"}
              icon={ArrowRightLeft}
              label="Port (MNP)"
              onClick={() => setNumberSource("mnp")}
            />
          </div>

          {numberSource === "new" ? (
            <>
              <div className="bg-primary/5 rounded-xl py-3 text-center text-lg font-semibold tracking-wide text-foreground mb-3">
                {phone}
              </div>
              {simType === "psim" && (
                <button
                  onClick={() => setNumberSheetOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-sm font-semibold"
                >
                  Get Different Number <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Existing number <span className="text-destructive">*</span>
                </label>
                <Input
                  value={portNumber}
                  onChange={(e) => setPortNumber(e.target.value)}
                  placeholder="e.g. 0501234567"
                  inputMode="tel"
                  className="h-11 bg-muted/40 border-0 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Current operator <span className="text-destructive">*</span>
                </label>
                <Select value={portOperator} onValueChange={setPortOperator}>
                  <SelectTrigger className="h-11 bg-muted/40 border-0 rounded-xl">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {operators.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[11px] text-muted-foreground">
                The number will be transferred from the selected operator
                after verification.
              </p>
            </div>
          )}
        </section>

        {/* Number type: with plan or with top-up */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Number type <span className="text-destructive">*</span></h3>
          <div className="grid grid-cols-2 gap-2">
            <SourceTab
              active={numberMode === "plan"}
              icon={Tag}
              label="With plan"
              onClick={() => setNumberMode("plan")}
            />
            <SourceTab
              active={numberMode === "topup"}
              icon={Database}
              label="With top-up"
              onClick={() => setNumberMode("topup")}
            />
          </div>
        </section>

        {numberMode === "topup" ? (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">Top-up value <span className="text-destructive">*</span></h3>
            <Select value={topupValue} onValueChange={setTopupValue}>
              <SelectTrigger className="h-12 bg-card border-0 rounded-xl shadow-sm">
                <SelectValue placeholder="Select top-up amount" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {topupValues.map((v) => (
                  <SelectItem key={v} value={v}>{v} SAR</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        ) : (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Plan Type <span className="text-destructive">*</span></h3>
          <div className="flex gap-2">
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="flex-1 bg-card border-0 rounded-xl h-12 shadow-sm">
                <SelectValue placeholder="Select plan type" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="base-plan">Base Plan</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="data">Data</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                "relative w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center text-primary",
                activeFilterCount > 0 && "ring-2 ring-primary"
              )}
              aria-label="Filter plans"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Plans carousel — embla swipe */}
          {filteredPlans.length === 0 ? (
            <div className="mt-3 bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
              No plans match the current filters.
            </div>
          ) : (
            <div className="-mx-4 mt-3">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex touch-pan-y">
                  {filteredPlans.map((p, i) => (
                    <div
                      key={p.title}
                      className="shrink-0 grow-0 basis-[85%] pl-3 first:pl-4 last:pr-4"
                    >
                      <PlanCardComponent
                        plan={p}
                        selected={selectedPlan === i}
                        active={activeSnap === i}
                        onSelect={() => setSelectedPlan(i)}
                        onMoreDetails={() =>
                          setDetailsPlan(plans.indexOf(p as Plan))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-1.5 mt-3">
                {filteredPlans.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    aria-label={`Go to plan ${i + 1}`}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      activeSnap === i ? "w-5 bg-primary" : "w-1.5 bg-primary/30"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
        )}

        {/* Contact */}
        <section className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-foreground">Contact <span className="text-destructive">*</span></p>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">City <span className="text-destructive">*</span></label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-11 bg-muted/40 border-0 rounded-xl">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email <span className="text-destructive">*</span></label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={simType === "esim" ? "Email for eSIM QR code" : "customer@example.com"}
              className="h-11 bg-muted/40 border-0 rounded-xl"
            />
            {simType === "esim" && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                The eSIM activation QR will be emailed to the customer.
              </p>
            )}
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Set as primary</p>
              <p className="text-[11px] text-muted-foreground">
                Use this number as the customer's primary line.
              </p>
            </div>
            <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
          </div>
        </section>

        {/* Signatures */}
        {SHOW_CUSTOMER_SIGNATURE && (
          <SignatureBox
            title="Customer Signature"
            required={SHOW_CUSTOMER_SIGNATURE}
            value={customerSig}
            onEdit={() => setSigEditor("customer")}
            onClear={() => setCustomerSig(null)}
          />
        )}
        <SignatureBox
          title="Dealer Signature"
          required
          value={dealerSig}
          onEdit={() => setSigEditor("dealer")}
          onClear={() => setDealerSig(null)}
        />
          </>
        )}

        {step === 2 && (
          <ReviewSummary
            simType={simType}
            kit={kit}
            email={email}
            city={city}
            isPrimary={isPrimary}
            numberSource={numberSource}
            phone={phone}
            portNumber={portNumber}
            portOperator={portOperator}
            numberMode={numberMode}
            topupValue={topupValue}
            planTitle={currentPlan?.title}
            planPrice={currentPlan?.price}
            onEdit={() => setStep(1)}
          />
        )}

        {step === 2 && (
          <>
        {/* Promo code */}
        <section className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Promo code</p>
            <Switch checked={promoOn} onCheckedChange={setPromoOn} />
          </div>
          {promoOn && (
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter the code"
              className="h-11 bg-muted/40 border-0 rounded-xl mt-3"
            />
          )}
        </section>

        {/* Payment */}
        <section className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Select Payment Method <span className="text-destructive">*</span></p>
          </div>
          <div className="space-y-2">
            <PayOption icon={CreditCard} label="Dealer Wallet" value="card" selected={pay === "card"} onClick={() => setPay("card")} />
            <PayOption icon={Banknote} label="Method name (demo purposes)" value="cash" selected={pay === "cash"} onClick={() => setPay("cash")} />
            <PayOption icon={Apple} label="Other method (demo purposes)" value="apple" selected={pay === "apple"} onClick={() => setPay("apple")} />
          </div>
        </section>
          </>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[hsl(210,20%,96%)]">
        <div className="max-w-[390px] mx-auto">
          {step === 1 ? (() => {
            const detailsReady =
              (simType === "psim" ? kit.trim().length > 0 : true) &&
              !!city &&
              !!email &&
              (numberSource === "new" || (portNumber && portOperator)) &&
              (numberMode === "plan" ? !!currentPlan : !!topupValue);
            return (
              <Button
                disabled={!detailsReady}
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-full text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                Continue to Review <ArrowRight className="w-4 h-4" />
              </Button>
            );
          })() : (() => {
            const sigMissing =
              (SHOW_CUSTOMER_SIGNATURE && !customerSig) || !dealerSig;
            const amount = numberMode === "topup"
              ? (parseInt(topupValue || "0", 10) + 0.5)
              : (currentPlan ? currentPlan.price + 0.5 : 0);
            return (
              <>
                {sigMissing && pay && (
                  <p className="text-xs text-destructive text-center mb-2">
                    Please capture {SHOW_CUSTOMER_SIGNATURE && !customerSig ? "customer" : ""}
                    {SHOW_CUSTOMER_SIGNATURE && !customerSig && !dealerSig ? " and " : ""}
                    {!dealerSig ? "dealer" : ""} signature to continue.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-12 rounded-full px-4 border-primary text-primary"
                  >
                    Back
                  </Button>
                  <Button
                    disabled={!pay || (numberMode === "plan" && !currentPlan) || (numberMode === "topup" && !topupValue) || sigMissing}
                    onClick={handlePay}
                    className="flex-1 h-12 rounded-full text-base font-semibold flex items-center justify-between px-6 disabled:opacity-60"
                  >
                    <span>Pay</span>
                    <span>{amount} KSA</span>
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Choose Different Number sheet */}
      <ChooseNumberSheet
        open={numberSheetOpen}
        onClose={() => setNumberSheetOpen(false)}
        onPick={(n) => {
          setPhone(n);
          setNumberSheetOpen(false);
        }}
      />

      <PlanDetailsSheet
        plan={detailsPlan !== null ? plans[detailsPlan] : null}
        onClose={() => setDetailsPlan(null)}
        onSelect={() => {
          if (detailsPlan !== null) {
            const idx = filteredPlans.findIndex(
              (p) => p.title === plans[detailsPlan].title
            );
            if (idx >= 0) {
              setSelectedPlan(idx);
              scrollTo(idx);
            }
          }
          setDetailsPlan(null);
        }}
        isSelected={detailsPlan !== null && selectedPlan === detailsPlan}
      />

      {/* Plan filter sheet */}
      <PlanFilterSheet
        open={filterOpen}
        active={planFilters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setPlanFilters(next);
          setFilterOpen(false);
        }}
      />

      {/* Customer verification step */}
      <SematiVerification
        open={verifyOpen}
        audience="customer"
        onClose={() => setVerifyOpen(false)}
        onMethodSelected={(m) =>
          setVerificationMethod(
            m === "nafath" ? "Nafath" : m === "absher" ? "Absher" : "Fingerprint"
          )
        }
        onVerified={() => {
          setOrderId(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);
          setVerifyOpen(false);
          // Activation completed — discard the saved draft for this customer.
          clearActivationDraft(draftIdNumber);
          setSuccessOpen(true);
        }}
      />


      {/* Success */}
      <SuccessBottomSheet
        open={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          navigate("/");
        }}
        planName={currentPlan?.title ?? "—"}
        orderId={orderId || "ORD-000000"}
        mobileNumber={numberSource === "mnp" ? portNumber : phone}
        verificationMethod={verificationMethod}
        contactPhone={phone}
        email={email}
      />

      {/* Signature capture */}
      <SignaturePadSheet
        open={sigEditor !== null}
        title={sigEditor === "dealer" ? "Dealer Signature" : "Customer Signature"}
        initial={
          sigEditor === "dealer"
            ? dealerSig
            : sigEditor === "customer"
            ? customerSig
            : null
        }
        onClose={() => setSigEditor(null)}
        onSave={(dataUrl) => {
          if (sigEditor === "dealer") setDealerSig(dataUrl);
          else if (sigEditor === "customer") setCustomerSig(dataUrl);
          setSigEditor(null);
        }}
      />
      {/* Cancel / back confirmation — tells the user their progress is saved */}
      <Dialog open={backConfirmOpen} onOpenChange={(o) => !o && setBackConfirmOpen(false)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Progress saved</DialogTitle>
            <DialogDescription>
              Your filled details have been saved for this customer. You can
              resume later by searching the same ID number.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={() => {
                setBackConfirmOpen(false);
                navigate("/");
              }}
              className="w-full h-11 rounded-full"
            >
              Go to Home
            </Button>
            <Button
              variant="outline"
              onClick={() => setBackConfirmOpen(false)}
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

const SimCard = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative rounded-2xl p-4 flex flex-col items-start gap-2 transition-all",
      active ? "bg-primary/10 ring-1 ring-primary/30" : "bg-card shadow-sm"
    )}
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M10 8h4M10 12h4M10 16h4" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-foreground">{label}</p>
    <span
      className={cn(
        "absolute top-3 right-3 w-4 h-4 rounded-full border-2",
        active ? "border-primary bg-primary" : "border-primary/40"
      )}
    >
      {active && <span className="block w-1.5 h-1.5 bg-card rounded-full m-auto mt-[3px]" />}
    </span>
  </button>
);

const StepPill = ({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) => (
  <div className="flex items-center gap-1.5">
    <span
      className={cn(
        "w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center",
        active || done
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : index}
    </span>
    <span
      className={cn(
        "text-[11px] font-semibold",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </span>
  </div>
);

const ReviewSummary = ({
  simType,
  kit,
  email,
  city,
  isPrimary,
  numberSource,
  phone,
  portNumber,
  portOperator,
  numberMode,
  topupValue,
  planTitle,
  planPrice,
  onEdit,
}: {
  simType: SimType;
  kit: string;
  email: string;
  city: string;
  isPrimary: boolean;
  numberSource: NumberSource;
  phone: string;
  portNumber: string;
  portOperator: string;
  numberMode: NumberMode;
  topupValue: string;
  planTitle?: string;
  planPrice?: number;
  onEdit: () => void;
}) => {
  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground text-right">{value}</span>
    </div>
  );
  return (
    <section className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-foreground">Review activation</p>
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
          <Pencil className="w-3 h-3" /> Edit
        </button>
      </div>
      <Row label="SIM type" value={simType === "psim" ? "P-SIM" : "E-SIM"} />
      {simType === "psim" && <Row label="KIT" value={kit || "—"} />}
      <Row
        label="Phone number"
        value={
          numberSource === "mnp"
            ? `${portNumber || "—"} (Port from ${portOperator || "—"})`
            : phone
        }
      />
      <Row label="Primary line" value={isPrimary ? "Yes" : "No"} />
      <Row label="City" value={city || "—"} />
      <Row label="Email" value={email || "—"} />
      <Row
        label={numberMode === "topup" ? "Top-up" : "Plan"}
        value={
          numberMode === "topup"
            ? topupValue
              ? `${topupValue} SAR`
              : "—"
            : `${planTitle ?? "—"}${planPrice != null ? ` · ${planPrice} SAR` : ""}`
        }
      />
    </section>
  );
};

const SourceTab = ({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Phone;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-foreground"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const PlanFilterSheet = ({
  open,
  active,
  onClose,
  onApply,
}: {
  open: boolean;
  active: PlanFilters;
  onClose: () => void;
  onApply: (filters: PlanFilters) => void;
}) => {
  const [draft, setDraft] = useState<PlanFilters>(active);
  useEffect(() => {
    if (open) setDraft(active);
  }, [open, active]);

  const toggleValidity = (v: string) =>
    setDraft((d) => ({
      ...d,
      validity: d.validity.includes(v)
        ? d.validity.filter((x) => x !== v)
        : [...d.validity, v],
    }));

  const fmtData = (n: number) => (n >= DATA_MAX ? "Unlimited" : `${n} GB`);
  const fmtMins = (n: number) => (n >= MINS_MAX ? "Unlimited" : `${n} min`);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[88vh]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
        <div className="relative mb-4 text-center">
          <h3 className="font-semibold text-foreground">Filter</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Please select your filter
          </p>
          <button
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-y-auto -mx-5 px-5 space-y-5 pb-2">
          {/* Validity */}
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Validity</p>
            <div className="flex flex-wrap gap-2">
              {VALIDITY_OPTIONS.map((opt) => {
                const on = draft.validity.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleValidity(opt.value)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                      on
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-foreground/70 border-border",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Price */}
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Price</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{draft.price[0]} KSA</span>
              <span>{draft.price[1]} KSA</span>
            </div>
            <RangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={1}
              value={draft.price}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, price: [v[0], v[1]] as [number, number] }))
              }
            />
          </section>

          {/* Data */}
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Data Allowance</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{fmtData(draft.data[0])}</span>
              <span>{fmtData(draft.data[1])}</span>
            </div>
            <RangeSlider
              min={DATA_MIN}
              max={DATA_MAX}
              step={10}
              value={draft.data}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, data: [v[0], v[1]] as [number, number] }))
              }
            />
          </section>

          {/* Call minutes */}
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Call Minutes</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{fmtMins(draft.mins[0])}</span>
              <span>{fmtMins(draft.mins[1])}</span>
            </div>
            <RangeSlider
              min={MINS_MIN}
              max={MINS_MAX}
              step={10}
              value={draft.mins}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, mins: [v[0], v[1]] as [number, number] }))
              }
            />
          </section>
        </div>

        <div className="mt-5 space-y-2">
          <Button
            onClick={() => onApply(draft)}
            className="w-full h-12 rounded-full text-sm font-semibold"
          >
            Apply
          </Button>
          <button
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className="w-full text-sm font-semibold text-primary py-1"
          >
            Clear
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Dual-handle range slider built on Radix primitive (shadcn's wrapper
// renders a single thumb, so we use the primitive directly here).
const RangeSlider = ({
  value,
  onValueChange,
  min,
  max,
  step,
}: {
  value: [number, number];
  onValueChange: (v: number[]) => void;
  min: number;
  max: number;
  step: number;
}) => (
  <SliderPrimitive.Root
    value={value}
    onValueChange={onValueChange}
    min={min}
    max={max}
    step={step}
    minStepsBetweenThumbs={1}
    className="relative flex w-full touch-none select-none items-center"
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label="Minimum"
      className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    />
    <SliderPrimitive.Thumb
      aria-label="Maximum"
      className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    />
  </SliderPrimitive.Root>
);


const PlanDetailsSheet = ({
  plan,
  isSelected,
  onClose,
  onSelect,
}: {
  plan: typeof plans[number] | null;
  isSelected: boolean;
  onClose: () => void;
  onSelect: () => void;
}) => {
  if (!plan) return null;
  const rows = [
    { icon: Wifi, label: "Internet", value: plan.internet },
    { icon: PhoneCall, label: "Local Minutes", value: plan.mins },
    { icon: MessageSquare, label: "SMS", value: plan.sms },
    { icon: Share2, label: "Social Media", value: plan.social },
    { icon: Calendar, label: "Validity", value: "30 days" },
  ];
  return (
    <Drawer open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[85vh]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground text-lg">{plan.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan details and features
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-primary/5 rounded-2xl p-4 mb-4 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-primary leading-none">
              {plan.price}
              <span className="text-base ml-1">/mo</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              KSA · +15% VAT included
            </p>
          </div>
          {plan.discount && (
            <span className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold">
              {plan.discount}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-5 overflow-y-auto">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/40"
            >
              <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center">
                <r.icon className="w-4 h-4 text-primary" />
              </div>
              <p className="flex-1 text-sm text-muted-foreground">{r.label}</p>
              <p className="text-sm font-semibold text-foreground">{r.value}</p>
            </div>
          ))}

          {plan.features.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold text-foreground mb-2 px-1">
                What's included
              </p>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Button
          onClick={onSelect}
          className="w-full h-12 rounded-full text-base font-semibold"
        >
          {isSelected ? "Selected" : "Select this plan"}
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

const SignatureBox = ({
  title,
  value,
  onEdit,
  onClear,
  required = false,
}: {
  title: string;
  value: string | null;
  onEdit: () => void;
  onClear: () => void;
  required?: boolean;
}) => (
  <section>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-semibold text-foreground">
        {title}
        {required && <span className="text-destructive"> *</span>}
      </h3>
      {value && (
        <button
          onClick={onClear}
          className="text-[11px] text-destructive font-medium flex items-center gap-1"
        >
          <Eraser className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
    {value ? (
      <button
        onClick={onEdit}
        className="w-full bg-card rounded-2xl p-3 border border-emerald-200 shadow-sm flex items-center gap-3"
      >
        <img
          src={value}
          alt={`${title} preview`}
          className="h-16 flex-1 object-contain"
        />
        <span className="flex items-center gap-1 text-xs font-semibold text-primary">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </span>
      </button>
    ) : (
      <button
        onClick={onEdit}
        className="w-full border-2 border-dashed border-primary/30 rounded-2xl bg-card py-8 flex flex-col items-center gap-2 active:bg-primary/5 transition-colors"
      >
        <span className="w-9 h-9 rounded-full border-2 border-primary flex items-center justify-center text-primary">
          <Plus className="w-4 h-4" />
        </span>
        <p className="text-xs text-muted-foreground">Tap to sign</p>
      </button>
    )}
  </section>
);

const SignaturePadSheet = ({
  open,
  title,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  title: string;
  initial: string | null;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  // Init canvas when opened
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    // Restore previous signature if any
    if (initial) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasInk(true);
      };
      img.src = initial;
    } else {
      setHasInk(false);
    }
  }, [open, initial]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = getPos(e);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext("2d");
    if (!ctx || !lastRef.current) return;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Sign with your finger inside the box below.
        </p>

        <div className="relative rounded-2xl border-2 border-dashed border-primary/30 bg-muted/30 mb-3">
          <canvas
            ref={canvasRef}
            className="w-full h-44 rounded-2xl touch-none"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
          />
          <div className="absolute bottom-1.5 left-0 right-0 mx-auto w-3/4 border-b border-muted-foreground/30 pointer-events-none" />
          {!hasInk && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
              Draw your signature here
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clear}
            className="flex-1 h-11 rounded-full"
          >
            <Eraser className="w-4 h-4 mr-1.5" />
            Clear
          </Button>
          <Button
            onClick={save}
            disabled={!hasInk}
            className="flex-1 h-11 rounded-full"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Save
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const PayOption = ({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: typeof CreditCard;
  label: string;
  value: PayMethod;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-xl bg-card border transition-colors",
      selected ? "border-primary" : "border-border"
    )}
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <p className="flex-1 text-left text-sm font-medium text-foreground">{label}</p>
    <span
      className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
        selected ? "border-primary" : "border-primary/40"
      )}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
    </span>
  </button>
);

const ChooseNumberSheet = ({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (n: string) => void;
}) => {
  const [tier, setTier] = useState<Tier>("Purple");
  const [query, setQuery] = useState("");

  const list = numbersByTier[tier].filter((n) => n.includes(query));

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[85vh]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
        <div className="flex items-center justify-between mb-4">
          <div className="w-7" />
          <h3 className="font-semibold text-foreground">Choose Different Number</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-11 pl-10 bg-muted/40 border-0 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "py-2 rounded-full text-sm font-semibold transition-colors",
                tier === t ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 -mx-1">
          {list.map((n, i) => (
            <button
              key={i}
              onClick={() => onPick(n)}
              className="w-full flex items-center justify-between px-3 py-3.5 border-b border-border/60 last:border-0"
            >
              <span className="text-sm font-medium text-foreground">{n}</span>
              <span className="text-xs">
                <span className="font-semibold text-foreground">0</span>{" "}
                <span className="text-muted-foreground">KSA</span>
              </span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PrepaidActivation;