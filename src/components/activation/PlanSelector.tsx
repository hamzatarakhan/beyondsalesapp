import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/drawer";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import PlanCard, { PlanCardData } from "@/components/PlanCard";

// ---------- Types & constants (shared with PrepaidActivation) ----------
export type Plan = PlanCardData & {
  categories: ("base-plan" | "minutes" | "data" | "flex" | "aman" | "switch-postpaid" | "vnet")[];
  validity: string[];
  tags: string[];
};

type PlanFilters = {
  validity: string[];
  price: [number, number];
  data: [number, number];
  mins: [number, number];
};

const PRICE_MIN = 10;
const PRICE_MAX = 600;
const DATA_MIN = 6;
const DATA_MAX = 500;
const MINS_MIN = 0;
const MINS_MAX = 1000;

const DEFAULT_FILTERS: PlanFilters = {
  validity: [],
  price: [PRICE_MIN, PRICE_MAX],
  data: [DATA_MIN, DATA_MAX],
  mins: [MINS_MIN, MINS_MAX],
};

const VALIDITY_OPTIONS: { value: string; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "1m", label: "1 month" },
  { value: "3m", label: "3 months" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
];

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

// Shared catalogue (subset matching PrepaidActivation).
export const PLANS: Plan[] = [
  { title: "Starter Plan", internet: "60 GB", mins: "100", sms: "500", social: "Unlimited", price: 30, discount: "Discount 50%", validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["1m"], tags: ["5G", "Roaming", "Social"], features: ["Free roaming in GCC countries", "5G access included", "Unlimited WhatsApp & social apps"] },
  { title: "Smart Plan", internet: "80 GB", mins: "200", sms: "1000", social: "Unlimited", price: 45, discount: "Discount 30%", validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["3m"], tags: ["5G", "Roaming", "Social"], features: ["Free roaming in GCC + Egypt", "5G+ access included", "Unlimited social & streaming apps"] },
  { title: "Ultimate Plan", internet: "120 GB", mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 60, discount: null, validityLabel: "Valid 30 days", categories: ["base-plan"], validity: ["12m"], tags: ["5G", "Roaming", "Social", "Unlimited"], features: ["Truly unlimited local calls & SMS", "5G+ priority network access", "Premium customer support 24/7"] },
  { title: "Basic Minutes Pack", internet: "5 GB", mins: "500", sms: "100", social: "Unlimited", price: 20, discount: "Discount 20%", validityLabel: "Valid 7 days", categories: ["minutes"], validity: ["7d"], tags: ["Social"], features: ["500 local minutes", "Unlimited WhatsApp calls"] },
  { title: "Talk More Pack", internet: "10 GB", mins: "Unlimited", sms: "250", social: "Unlimited", price: 35, discount: null, validityLabel: "Valid 30 days", categories: ["minutes"], validity: ["1m"], tags: ["Unlimited"], features: ["Unlimited local calls", "10 GB high-speed data"] },
  { title: "Data Boost 50", internet: "50 GB", mins: "50", sms: "50", social: "Unlimited", price: 25, discount: "Discount 25%", validityLabel: "Valid 30 days", categories: ["data"], validity: ["1m"], tags: ["5G", "Social"], features: ["50 GB high-speed data", "Unlimited social apps"] },
  { title: "Data Boost 100", internet: "100 GB", mins: "50", sms: "50", social: "Unlimited", price: 40, discount: null, validityLabel: "Valid 30 days", categories: ["data"], validity: ["3m", "6m"], tags: ["5G", "Social"], features: ["100 GB high-speed data", "Unlimited streaming"] },
  { title: "Unlimited Data", internet: "Unlimited", mins: "100", sms: "100", social: "Unlimited", price: 75, discount: "Discount 10%", validityLabel: "Valid 30 days", categories: ["data"], validity: ["6m", "12m"], tags: ["5G", "Unlimited"], features: ["Truly unlimited data", "Hotspot allowance 50 GB"] },
  { title: "Flex 30", internet: "30 GB", mins: "100", sms: "100", social: "Unlimited", price: 20, discount: "Discount 15%", validityLabel: "Valid 30 days", categories: ["flex"], validity: ["1m"], tags: ["5G", "Social"], features: ["30 GB flexible data", "Unlimited social apps", "No contract required"] },
  { title: "Flex 60", internet: "60 GB", mins: "200", sms: "200", social: "Unlimited", price: 35, discount: null, validityLabel: "Valid 30 days", categories: ["flex"], validity: ["1m", "3m"], tags: ["5G", "Social"], features: ["60 GB flexible data", "Unlimited social & streaming", "Cancel anytime"] },
  { title: "Flex Max", internet: "100 GB", mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 55, discount: "Discount 20%", validityLabel: "Valid 30 days", categories: ["flex"], validity: ["3m", "6m"], tags: ["5G", "Unlimited"], features: ["100 GB flexible data", "Unlimited calls & SMS", "5G priority access"] },
  { title: "Aman Basic", internet: "20 GB", mins: "200", sms: "200", social: "Unlimited", price: 18, discount: null, validityLabel: "Valid 30 days", categories: ["aman"], validity: ["1m"], tags: ["Social"], features: ["20 GB secure data", "Family safety features", "Parental controls included"] },
  { title: "Aman Plus", internet: "50 GB", mins: "500", sms: "500", social: "Unlimited", price: 38, discount: "Discount 10%", validityLabel: "Valid 30 days", categories: ["aman"], validity: ["1m", "3m"], tags: ["5G", "Social"], features: ["50 GB secure data", "Advanced parental controls", "Family sharing up to 4 lines"] },
  { title: "Aman Pro", internet: "80 GB", mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 58, discount: null, validityLabel: "Valid 30 days", categories: ["aman"], validity: ["3m", "6m", "12m"], tags: ["5G", "Unlimited"], features: ["80 GB secure data", "Full family protection suite", "Priority customer support"] },
];

// ---------- Range slider ----------
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
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow" />
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow" />
  </SliderPrimitive.Root>
);

// ---------- Filter sheet ----------
const PlanFilterSheet = ({
  open,
  active,
  onClose,
  onApply,
}: {
  open: boolean;
  active: PlanFilters;
  onClose: () => void;
  onApply: (f: PlanFilters) => void;
}) => {
  const [draft, setDraft] = useState<PlanFilters>(active);
  useEffect(() => {
    if (open) setDraft(active);
  }, [open, active]);
  const fmtData = (n: number) => (n >= DATA_MAX ? "Unlimited" : `${n} GB`);
  const fmtMins = (n: number) => (n >= MINS_MAX ? "Unlimited" : `${n} min`);
  const toggleValidity = (v: string) =>
    setDraft((d) => ({
      ...d,
      validity: d.validity.includes(v) ? d.validity.filter((x) => x !== v) : [...d.validity, v],
    }));
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[88vh]">
        <div className="relative mb-4 text-center">
          <h3 className="font-semibold text-foreground">Filter</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Please select your filter</p>
          <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto -mx-5 px-5 space-y-5 pb-2">
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
                      on ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-foreground/70 border-border",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Price</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{draft.price[0]} KSA</span><span>{draft.price[1]} KSA</span>
            </div>
            <RangeSlider min={PRICE_MIN} max={PRICE_MAX} step={1} value={draft.price} onValueChange={(v) => setDraft((d) => ({ ...d, price: [v[0], v[1]] as [number, number] }))} />
          </section>
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Data Allowance</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{fmtData(draft.data[0])}</span><span>{fmtData(draft.data[1])}</span>
            </div>
            <RangeSlider min={DATA_MIN} max={DATA_MAX} step={10} value={draft.data} onValueChange={(v) => setDraft((d) => ({ ...d, data: [v[0], v[1]] as [number, number] }))} />
          </section>
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">Call Minutes</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{fmtMins(draft.mins[0])}</span><span>{fmtMins(draft.mins[1])}</span>
            </div>
            <RangeSlider min={MINS_MIN} max={MINS_MAX} step={10} value={draft.mins} onValueChange={(v) => setDraft((d) => ({ ...d, mins: [v[0], v[1]] as [number, number] }))} />
          </section>
        </div>
        <div className="mt-5 space-y-2">
          <Button onClick={() => onApply(draft)} className="w-full h-12 rounded-full text-sm font-semibold">Apply</Button>
          <button onClick={() => setDraft(DEFAULT_FILTERS)} className="w-full text-sm font-semibold text-primary py-1">Clear</button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// ---------- Plan details sheet ----------
const PlanDetailsSheet = ({
  plan,
  onClose,
}: {
  plan: Plan | null;
  onClose: () => void;
}) => {
  if (!plan) return null;
  const priceNum = parseFloat(String(plan.price).replace(/[^\d.]/g, "")) || 0;
  const tax = +(priceNum * 0.15).toFixed(2);
  const total = +(priceNum + tax).toFixed(2);
  const rows = [
    { label: "Internet", value: plan.internet },
    { label: "Tax", value: `${tax} KSA` },
    { label: "Local Mints", value: plan.mins },
    { label: "SMS", value: plan.sms },
    { label: "Validity", value: "30 DAYS" },
    { label: "Renewal Price", value: String(priceNum) },
  ];
  return (
    <Drawer open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 pt-2 pb-6 max-h-[85vh] flex flex-col">
        <div className="relative flex items-center justify-center px-5 py-3 shrink-0">
          <h3 className="font-semibold text-foreground text-lg">Plan Details</h3>
          <button onClick={onClose} className="absolute right-5 w-8 h-8 rounded-full border border-border flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0 px-5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between py-4 border-b border-border">
              <p className="text-sm text-muted-foreground">{r.label}</p>
              <p className="text-sm font-semibold text-foreground uppercase">{r.value}</p>
            </div>
          ))}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
            <p className="text-base font-bold text-primary">Total</p>
            <p className="text-base font-bold text-primary">{total} KSA</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// ---------- Main selector ----------
interface PlanSelectorProps {
  selectedPlan: number | null;
  onSelect: (idx: number, plan: Plan) => void;
  plans?: Plan[];
  categoryFilter?: string;
}

const PlanSelector = ({ selectedPlan, onSelect, plans = PLANS, categoryFilter }: PlanSelectorProps) => {
  const [planType, setPlanType] = useState<string>("all");
  const activePlanType = categoryFilter ?? planType;
  const [planFilters, setPlanFilters] = useState<PlanFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<number | null>(null);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (planFilters.validity.length > 0) n++;
    if (planFilters.price[0] !== PRICE_MIN || planFilters.price[1] !== PRICE_MAX) n++;
    if (planFilters.data[0] !== DATA_MIN || planFilters.data[1] !== DATA_MAX) n++;
    if (planFilters.mins[0] !== MINS_MIN || planFilters.mins[1] !== MINS_MAX) n++;
    return n;
  }, [planFilters]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesType = activePlanType === "all" || p.categories.includes(activePlanType as any);
      const matchesValidity = planFilters.validity.length === 0 || planFilters.validity.some((v) => p.validity.includes(v));
      const matchesPrice = p.price >= planFilters.price[0] && p.price <= planFilters.price[1];
      const pData = parsePlanData(p.internet);
      const matchesData = pData >= planFilters.data[0] && pData <= planFilters.data[1];
      const pMins = parsePlanMins(p.mins);
      const matchesMins = pMins >= planFilters.mins[0] && pMins <= planFilters.mins[1];
      return matchesType && matchesValidity && matchesPrice && matchesData && matchesMins;
    });
  }, [plans, activePlanType, planFilters]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center", containScroll: "trimSnaps", loop: false });
  const [activeSnap, setActiveSnap] = useState(0);
  const carouselContainerRef = useRef<HTMLDivElement>(null);

  // Keep refs so the IntersectionObserver callback always reads the latest values
  const emblaApiRef = useRef(emblaApi);
  const selectedPlanRef = useRef(selectedPlan);
  const filteredPlansRef = useRef(filteredPlans);
  const plansRef = useRef(plans);
  useEffect(() => { emblaApiRef.current = emblaApi; }, [emblaApi]);
  useEffect(() => { selectedPlanRef.current = selectedPlan; }, [selectedPlan]);
  useEffect(() => { filteredPlansRef.current = filteredPlans; }, [filteredPlans]);
  useEffect(() => { plansRef.current = plans; }, [plans]);

  useEffect(() => {
    if (!emblaApi) return;
    const handler = () => {
      const idx = emblaApi.selectedScrollSnap();
      setActiveSnap(idx);
    };
    emblaApi.on("select", handler);
    handler();
    return () => { emblaApi.off("select", handler); };
  }, [emblaApi, filteredPlans, plans, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    setActiveSnap(0);
  }, [filteredPlans.length, emblaApi]);

  // Scroll to selected plan when selectedPlan changes (e.g. user taps Select)
  useEffect(() => {
    if (!emblaApi || selectedPlan == null) return;
    const filteredIdx = filteredPlans.findIndex((p) => plans.indexOf(p) === selectedPlan);
    if (filteredIdx >= 0) {
      emblaApi.scrollTo(filteredIdx, true);
      setActiveSnap(filteredIdx);
    }
  }, [emblaApi, selectedPlan, filteredPlans, plans]);

  // When carousel leaves viewport, instantly snap back to the selected plan
  // Uses refs so the callback always reads the latest state (no stale closures)
  useEffect(() => {
    const el = carouselContainerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return;
        const api = emblaApiRef.current;
        const sp = selectedPlanRef.current;
        if (!api || sp == null) return;
        const fp = filteredPlansRef.current;
        const ps = plansRef.current;
        const filteredIdx = fp.findIndex((p) => ps.indexOf(p) === sp);
        if (filteredIdx >= 0) {
          api.scrollTo(filteredIdx, true);
          setActiveSnap(filteredIdx);
        }
      },
      { threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  return (
    <section>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {planFilters.validity.map((v) => (
            <span key={`val-${v}`} className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full border border-primary text-primary bg-transparent text-xs font-medium shrink-0">
              {v}
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, validity: planFilters.validity.filter((x) => x !== v) })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {(planFilters.price[0] !== PRICE_MIN || planFilters.price[1] !== PRICE_MAX) && (
            <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full border border-primary text-primary bg-transparent text-xs font-medium shrink-0">
              Price: {planFilters.price[0]}–{planFilters.price[1]} SAR
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, price: [PRICE_MIN, PRICE_MAX] })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(planFilters.data[0] !== DATA_MIN || planFilters.data[1] !== DATA_MAX) && (
            <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full border border-primary text-primary bg-transparent text-xs font-medium shrink-0">
              Data: {planFilters.data[0]}–{planFilters.data[1] >= DATA_MAX ? "Unlimited" : `${planFilters.data[1]} GB`}
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, data: [DATA_MIN, DATA_MAX] })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(planFilters.mins[0] !== MINS_MIN || planFilters.mins[1] !== MINS_MAX) && (
            <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full border border-primary text-primary bg-transparent text-xs font-medium shrink-0">
              Minutes: {planFilters.mins[0]}–{planFilters.mins[1] >= MINS_MAX ? "Unlimited" : planFilters.mins[1]}
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, mins: [MINS_MIN, MINS_MAX] })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button type="button" onClick={() => setPlanFilters(DEFAULT_FILTERS)} className="inline-flex items-center h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground shrink-0">
            Clear all
          </button>
        </div>
      )}

      {filteredPlans.length === 0 ? (
        <div className="mt-3 bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
          No plans match the current filters.
        </div>
      ) : (
        <div className="-mx-4 mt-3" ref={carouselContainerRef}>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y items-stretch">
              {filteredPlans.map((p, i) => {
                const originalIdx = plans.indexOf(p);
                return (
                  <div key={p.title} className="shrink-0 grow-0 basis-[85%] pl-3 first:pl-4 last:pr-4 flex">
                    <PlanCard
                      plan={p}
                      selected={selectedPlan === originalIdx}
                      active={activeSnap === i}
                      onSelect={() => onSelect(originalIdx, p)}
                      onMoreDetails={() => setDetailsPlan(originalIdx)}
                    />
                  </div>
                );
              })}
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
                  activeSnap === i ? "w-5 bg-primary" : "w-1.5 bg-primary/30",
                )}
              />
            ))}
          </div>
        </div>
      )}

      <PlanFilterSheet
        open={filterOpen}
        active={planFilters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => {
          setPlanFilters(f);
          setFilterOpen(false);
        }}
      />
      <PlanDetailsSheet plan={detailsPlan !== null ? plans[detailsPlan] : null} onClose={() => setDetailsPlan(null)} />
    </section>
  );
};

export default PlanSelector;