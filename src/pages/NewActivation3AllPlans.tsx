import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import PlanCard from "@/components/PlanCard";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import {
  FRIENDI_PLANS,
  PREPAID_CHIPS,
  FRIENDI_CHIPS,
  getVmCatalogPlans,
  isPlanMnpEligible,
  type PayType,
  type LineType,
} from "./NewActivation3";

interface NavState {
  payType?: PayType;
  lineType?: LineType;
  chip?: string;
  // The plan (if any) already selected back on the Subscription step before the dealer
  // opened this page — carried along so the Back button can restore it untouched.
  selectedPlanTitle?: string;
  // Forwarded from SIM Activation 3 untouched, and forwarded straight back on pick — this
  // page never reads it, it just carries the dealer's in-progress Identity fields across
  // the round trip so they survive /new-activation-3 remounting on return.
  resume?: unknown;
}

const NewActivation3AllPlans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brand } = useBrand();
  const isFriendi = brand === "friendi";

  const initial = (location.state as NavState | null) ?? {};
  const [payType, setPayType] = useState<PayType>(initial.payType ?? "prepaid");
  const [lineType, setLineType] = useState<LineType>(initial.lineType ?? "mobile");
  const [chip, setChip] = useState<string>(isFriendi ? (initial.chip ?? "all") : "all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const showPlanTypeChips = isFriendi ? true : (lineType === "mobile" && payType !== "postpaid");

  const effectiveChip = isFriendi
    ? chip
    : payType === "postpaid"
      ? (lineType === "data" ? "vnet" : "switch-postpaid")
      : (lineType === "data" ? "data" : chip);

  const catalogPlans = isFriendi ? FRIENDI_PLANS : getVmCatalogPlans(payType, effectiveChip);
  const activePlanChips = isFriendi ? FRIENDI_CHIPS : PREPAID_CHIPS.filter((c) => c.value !== "data");

  const normalizedSearch = search.trim().toLowerCase();
  const visiblePlans = catalogPlans
    .filter((p) => showPlanTypeChips ? (effectiveChip === "all" ? !p.categories?.includes("payg") : p.categories?.includes(effectiveChip as any)) : true)
    .filter((p) => !normalizedSearch || p.title.toLowerCase().includes(normalizedSearch));

  const selectLineType = (v: LineType) => { setLineType(v); setChip("all"); };
  const selectPayType = (v: PayType) => { setPayType(v); setChip("all"); };

  const pickPlan = (title: string) => {
    navigate("/new-activation-3", { state: { pickPlan: { payType, lineType, chip: effectiveChip, title }, resume: initial.resume } });
  };

  // Back restores the Subscription step exactly as it was before this page opened —
  // original payType/lineType/chip, plus whatever plan was already selected, if any —
  // rather than whatever filters the dealer may have changed while just browsing here.
  const goBack = () => {
    navigate("/new-activation-3", {
      state: {
        pickPlan: {
          payType: initial.payType ?? "prepaid",
          lineType: initial.lineType ?? "mobile",
          chip: initial.chip ?? "all",
          title: initial.selectedPlanTitle ?? "",
        },
        resume: initial.resume,
      },
    });
  };

  const activeFilterCount = (payType !== "prepaid" ? 1 : 0) + (lineType !== "mobile" ? 1 : 0) + (chip !== "all" ? 1 : 0);

  return (
    <div className="mobile-container pb-8 min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background">
        <header dir="ltr" className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground truncate">All Plans</h1>
          <div className="w-10 shrink-0" />
        </header>

        {/* Search + filter, side by side */}
        <div className="px-4 flex items-center gap-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plans"
              className="h-11 bg-card rounded-xl ps-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            aria-label="Filters"
            className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-foreground" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Vertical plan list */}
      <div className="px-4 space-y-3">
        {visiblePlans.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
            No plans match your search.
          </div>
        ) : (
          visiblePlans.map((p) => {
            const cats = p.categories ?? [];
            const layout = cats.includes("switch-postpaid") ? "postpaid"
              : cats.includes("payg") ? "payg"
              : cats.includes("calls") ? "calls"
              : cats.includes("combo") ? "combo"
              : cats.includes("flexi") ? "combo"
              : cats.includes("aman") ? "aman"
              : cats.includes("base-plan") || cats.includes("basic") ? "baqa"
              : "flex";
            return (
              <PlanCard
                key={`${p.title}-${p.price}`}
                plan={p}
                selected={false}
                active
                hideRadio
                minsLabel={cats.includes("switch-postpaid") ? "Local Mins" : "Flex Mins"}
                layout={layout as any}
                onSelect={() => pickPlan(p.title)}
                mnpEligible={isFriendi ? undefined : isPlanMnpEligible(p)}
              />
            );
          })
        )}
      </div>

      {/* Filters bottom sheet */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh]">
          <button
            onClick={() => setFilterOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">Filters</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-5 overflow-y-auto">
            {!isFriendi && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Line Type</h3>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: "mobile" as const, label: "Mobile" },
                    { key: "data" as const, label: "Data" },
                  ]).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectLineType(key)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        lineType === key ? "bg-primary text-white" : "bg-muted text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Subscription Type</h3>
              <div className="flex flex-wrap gap-2">
                {(isFriendi
                  ? [
                      { key: "prepaid" as const, label: "Prepaid" },
                      { key: "basic-postpaid" as const, label: "Basic Postpaid" },
                    ]
                  : [
                      { key: "prepaid" as const, label: "Prepaid" },
                      { key: "basic-postpaid" as const, label: "Basic Postpaid" },
                      { key: "postpaid" as const, label: "Postpaid" },
                    ]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectPayType(key)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                      payType === key ? "bg-primary text-white" : "bg-muted text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {showPlanTypeChips && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Plan Types</h3>
                <div className="flex flex-wrap gap-2">
                  {activePlanChips.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChip(c.value)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        chip === c.value ? "bg-primary text-white" : "bg-muted text-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              Apply Filters
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default NewActivation3AllPlans;
