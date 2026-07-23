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
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import RiyalSymbol from "@/components/RiyalSymbol";

// ---------- Types & constants (shared with PrepaidActivation) ----------
export type Plan = PlanCardData & {
  categories: ("base-plan" | "minutes" | "data" | "flex" | "aman" | "basic" | "switch-postpaid" | "vnet" | "combo" | "calls" | "payg")[];
  validity: string[];
  tags: string[];
};

type PlanFilters = {
  validity: string[];
  price: [number, number];
  data: [number, number];
  mins: [number, number];
};

const PRICE_MIN = 0;
const PRICE_MAX = 4600;
const DATA_MIN = 0;
const DATA_MAX = 1000;
const MINS_MIN = 0;
const MINS_MAX = 1500;

const DEFAULT_FILTERS: PlanFilters = {
  validity: [],
  price: [PRICE_MIN, PRICE_MAX],
  data: [DATA_MIN, DATA_MAX],
  mins: [MINS_MIN, MINS_MAX],
};

// Family display order in the "All" view: richest service mix first, data-only last.
const FAMILY_ORDER = ["combo", "calls", "aman", "base-plan", "basic", "flex", "data", "payg", "switch-postpaid", "vnet"];
const familyRank = (p: Plan) => {
  const i = FAMILY_ORDER.findIndex((c) => p.categories.includes(c as any));
  return i === -1 ? FAMILY_ORDER.length : i;
};

const VALIDITY_OPTION_VALUES = ["7d", "1m", "3m", "6m", "12m"];

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
  const { t } = useTranslation();
  const [draft, setDraft] = useState<PlanFilters>(active);
  useEffect(() => {
    if (open) setDraft(active);
  }, [open, active]);
  const unlimited = t("activation.plan.unlimited");
  const fmtData = (n: number) => (n >= DATA_MAX ? unlimited : `${n} GB`);
  const fmtMins = (n: number) => (n >= MINS_MAX ? unlimited : `${n} min`);
  const toggleValidity = (v: string) =>
    setDraft((d) => ({
      ...d,
      validity: d.validity.includes(v) ? d.validity.filter((x) => x !== v) : [...d.validity, v],
    }));
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[88vh]">
        <div className="relative mb-4 text-center">
          <h3 className="font-semibold text-foreground">{t("activation.plan.filter")}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{t("activation.plan.filterSub")}</p>
          <button onClick={onClose} className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto -mx-5 px-5 space-y-5 pb-2">
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">{t("activation.plan.validity")}</p>
            <div className="flex flex-wrap gap-2">
              {VALIDITY_OPTION_VALUES.map((val) => {
                const on = draft.validity.includes(val);
                return (
                  <button
                    key={val}
                    onClick={() => toggleValidity(val)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                      on ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-foreground/70 border-border",
                    )}
                  >
                    {t(`activation.plan.validityLabels.${val}`, val)}
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">{t("activation.plan.price")}</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span><RiyalSymbol /> {draft.price[0]}</span><span><RiyalSymbol /> {draft.price[1]}</span>
            </div>
            <RangeSlider min={PRICE_MIN} max={PRICE_MAX} step={1} value={draft.price} onValueChange={(v) => setDraft((d) => ({ ...d, price: [v[0], v[1]] as [number, number] }))} />
          </section>
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">{t("activation.plan.dataAllowance")}</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{fmtData(draft.data[0])}</span><span>{fmtData(draft.data[1])}</span>
            </div>
            <RangeSlider min={DATA_MIN} max={DATA_MAX} step={10} value={draft.data} onValueChange={(v) => setDraft((d) => ({ ...d, data: [v[0], v[1]] as [number, number] }))} />
          </section>
          <section>
            <p className="text-sm font-semibold text-foreground mb-2">{t("activation.plan.callMinutes")}</p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>{fmtMins(draft.mins[0])}</span><span>{fmtMins(draft.mins[1])}</span>
            </div>
            <RangeSlider min={MINS_MIN} max={MINS_MAX} step={10} value={draft.mins} onValueChange={(v) => setDraft((d) => ({ ...d, mins: [v[0], v[1]] as [number, number] }))} />
          </section>
        </div>
        <div className="mt-5 space-y-2">
          <Button onClick={() => onApply(draft)} className="w-full h-12 rounded-full text-sm font-semibold">{t("activation.plan.apply")}</Button>
          <button onClick={() => setDraft(DEFAULT_FILTERS)} className="w-full text-sm font-semibold text-primary py-1">{t("activation.plan.clear")}</button>
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
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  const [planType, setPlanType] = useState<string>("all");
  const activePlanType = categoryFilter ?? planType;
  const [planFilters, setPlanFilters] = useState<PlanFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

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
      // In the "All" tab, hide PAYG plans — PAYG is only reachable via its own chip.
      const matchesType = activePlanType === "all"
        ? !p.categories.includes("payg" as any)
        : p.categories.includes(activePlanType as any);
      const matchesValidity = planFilters.validity.length === 0 || planFilters.validity.some((v) => p.validity.includes(v));
      const matchesPrice = p.price >= planFilters.price[0] && p.price <= planFilters.price[1];
      const pData = parsePlanData(p.internet);
      const matchesData = pData >= planFilters.data[0] && pData <= planFilters.data[1];
      const pMins = parsePlanMins(p.mins);
      const matchesMins = pMins >= planFilters.mins[0] && pMins <= planFilters.mins[1];
      return matchesType && matchesValidity && matchesPrice && matchesData && matchesMins;
    })
    // In "All": group families richest-first (Aman → Baqa → Flex → 5G Data →
    // Switch Postpaid → Vnet). In a specific chip: richest plan first.
    .sort((a, b) => {
      if (activePlanType === "all") {
        const fr = familyRank(a) - familyRank(b);
        if (fr !== 0) return fr;
      }
      return b.price - a.price;
    });
  }, [plans, activePlanType, planFilters]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "center", containScroll: "trimSnaps", loop: false, direction: isRtl ? "rtl" : "ltr" });
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

  // After user stops dragging the carousel, snap back to the selected plan
  useEffect(() => {
    if (!emblaApi) return;
    const onSettle = () => {
      const sp = selectedPlanRef.current;
      if (sp == null) return;
      const fp = filteredPlansRef.current;
      const ps = plansRef.current;
      const filteredIdx = fp.findIndex((p) => ps.indexOf(p) === sp);
      if (filteredIdx >= 0 && emblaApi.selectedScrollSnap() !== filteredIdx) {
        emblaApi.scrollTo(filteredIdx);
        setActiveSnap(filteredIdx);
      }
    };
    emblaApi.on("settle", onSettle);
    return () => { emblaApi.off("settle", onSettle); };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    setActiveSnap(0);
  }, [filteredPlans.length, emblaApi]);

  // Re-init when text direction flips (LTR ↔ RTL) so slides scroll the correct way
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ direction: isRtl ? "rtl" : "ltr" });
  }, [isRtl, emblaApi]);

  // Scroll to selected plan when selectedPlan changes (e.g. user taps Select)
  useEffect(() => {
    if (!emblaApi || selectedPlan == null) return;
    const filteredIdx = filteredPlans.findIndex((p) => plans.indexOf(p) === selectedPlan);
    if (filteredIdx >= 0) {
      emblaApi.scrollTo(filteredIdx, true);
      setActiveSnap(filteredIdx);
    }
  }, [emblaApi, selectedPlan, filteredPlans, plans]);

  // On every page scroll, instantly reset the carousel to the selected plan
  // (instant = no animation, so it's ready before the user scrolls back up)
  useEffect(() => {
    const onScroll = () => {
      const sp = selectedPlanRef.current;
      if (sp == null) return;
      const api = emblaApiRef.current;
      if (!api) return;
      const fp = filteredPlansRef.current;
      const ps = plansRef.current;
      const filteredIdx = fp.findIndex((p) => ps.indexOf(p) === sp);
      if (filteredIdx >= 0 && api.selectedScrollSnap() !== filteredIdx) {
        api.scrollTo(filteredIdx, true);
        setActiveSnap(filteredIdx);
      }
    };
    // capture:true catches scroll on any element (container or window)
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
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
              {t("activation.plan.price")}: <RiyalSymbol /> {planFilters.price[0]}–{planFilters.price[1]}
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, price: [PRICE_MIN, PRICE_MAX] })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(planFilters.data[0] !== DATA_MIN || planFilters.data[1] !== DATA_MAX) && (
            <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full border border-primary text-primary bg-transparent text-xs font-medium shrink-0">
              {t("activation.plan.dataAllowance")}: {planFilters.data[0]}–{planFilters.data[1] >= DATA_MAX ? t("activation.plan.unlimited") : `${planFilters.data[1]} GB`}
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, data: [DATA_MIN, DATA_MAX] })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(planFilters.mins[0] !== MINS_MIN || planFilters.mins[1] !== MINS_MAX) && (
            <span className="inline-flex items-center gap-1.5 h-8 pl-3 pr-2 rounded-full border border-primary text-primary bg-transparent text-xs font-medium shrink-0">
              {t("activation.plan.callMinutes")}: {planFilters.mins[0]}–{planFilters.mins[1] >= MINS_MAX ? t("activation.plan.unlimited") : planFilters.mins[1]}
              <button type="button" onClick={() => setPlanFilters({ ...planFilters, mins: [MINS_MIN, MINS_MAX] })} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary/10">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button type="button" onClick={() => setPlanFilters(DEFAULT_FILTERS)} className="inline-flex items-center h-8 px-3 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground shrink-0">
            {t("activation.plan.clearAll")}
          </button>
        </div>
      )}

      {filteredPlans.length === 0 ? (
        <div className="mt-3 bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
          {t("activation.plan.noPlans")}
        </div>
      ) : (
        <div className="-mx-4 -mt-3" ref={carouselContainerRef}>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y items-stretch pt-3">
              {filteredPlans.map((p, i) => {
                const originalIdx = plans.indexOf(p);
                const cats = p.categories;
                const layout = cats.includes("switch-postpaid") ? "postpaid"
                  : cats.includes("payg") ? "payg"
                  : cats.includes("calls") ? "calls"
                  : cats.includes("combo") ? "combo"
                  : cats.includes("aman") ? "aman"
                  : cats.includes("base-plan") || cats.includes("basic") ? "baqa"
                  : "flex";
                // When only one plan is available (e.g. Friendi's PAYG-only view) let the
                // card span the full width instead of the 85% carousel peek.
                const singlePlan = filteredPlans.length === 1;
                return (
                  <div key={`${p.title}-${p.price}`} className={cn("shrink-0 grow-0 flex", singlePlan ? "basis-full px-4" : "basis-[85%] pl-3 first:pl-4 last:pr-4")}>
                    <PlanCard
                      plan={p}
                      selected={selectedPlan === originalIdx}
                      active={activeSnap === i}
                      onSelect={() => onSelect(originalIdx, p)}
                      minsLabel={cats.includes("switch-postpaid") ? "Local Mins" : "Flex Mins"}
                      layout={layout}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {filteredPlans.length > 1 && (() => {
            const total = filteredPlans.length;
            const MAX_DOTS = 7;
            const start = total <= MAX_DOTS ? 0 : Math.min(Math.max(activeSnap - Math.floor(MAX_DOTS / 2), 0), total - MAX_DOTS);
            const shown = total <= MAX_DOTS ? total : MAX_DOTS;
            return (
              <div className="flex justify-center items-center gap-1.5 mt-3">
                {Array.from({ length: shown }, (_, k) => start + k).map((i) => {
                  const isActive = i === activeSnap;
                  const atWindowEdge = total > MAX_DOTS && ((i === start && start > 0) || (i === start + shown - 1 && i < total - 1));
                  return (
                    <button
                      key={i}
                      onClick={() => scrollTo(i)}
                      aria-label={`Go to plan ${i + 1}`}
                      className={cn(
                        "rounded-full transition-all shrink-0",
                        isActive ? "w-5 h-1.5 bg-primary" : atWindowEdge ? "w-1 h-1 bg-primary/30" : "w-1.5 h-1.5 bg-primary/30",
                      )}
                    />
                  );
                })}
              </div>
            );
          })()}
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
    </section>
  );
};

export default PlanSelector;