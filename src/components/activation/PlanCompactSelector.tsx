import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatValidity } from "@/lib/utils";
import PlanCard from "@/components/PlanCard";
import { PLANS, type Plan } from "@/components/activation/PlanSelector";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import RiyalSymbol from "@/components/RiyalSymbol";

// Same family ordering PlanSelector uses for its "All" tab — kept as its own copy since
// this is a standalone presentation variant (Plans option 2), not meant to share state
// with the carousel used by the other SIM Activation flows.
const FAMILY_ORDER = ["flexi", "combo", "calls", "aman", "base-plan", "basic", "flex", "data", "payg", "switch-postpaid", "vnet"];
const familyRank = (p: Plan) => {
  const i = FAMILY_ORDER.findIndex((c) => p.categories.includes(c as any));
  return i === -1 ? FAMILY_ORDER.length : i;
};

const planLayout = (p: Plan) => {
  const cats = p.categories;
  return cats.includes("switch-postpaid") ? "postpaid"
    : cats.includes("payg") ? "payg"
    : cats.includes("calls") ? "calls"
    : cats.includes("combo") ? "combo"
    : cats.includes("flexi") ? "combo"
    : cats.includes("aman") ? "aman"
    : cats.includes("base-plan") || cats.includes("basic") ? "baqa"
    : "flex";
};

interface PlanCompactSelectorProps {
  selectedPlan: number | null;
  onSelect: (idx: number, plan: Plan) => void;
  plans?: Plan[];
  categoryFilter?: string;
  isMnpEligible?: (plan: Plan) => boolean;
  searchQuery?: string;
}

// Brief, vertically-stacked plan rows (name / validity / VAT price) instead of the large
// horizontal carousel — tapping a row opens the full feature breakdown (the same PlanCard
// used elsewhere) in a bottom sheet, where tapping again confirms the selection.
const PlanCompactSelector = ({ selectedPlan, onSelect, plans = PLANS, categoryFilter, isMnpEligible, searchQuery }: PlanCompactSelectorProps) => {
  const { t } = useTranslation();
  const activePlanType = categoryFilter ?? "all";
  const normalizedSearch = searchQuery?.trim().toLowerCase() ?? "";
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  const filteredPlans = useMemo(() => {
    return plans
      .filter((p) => {
        const matchesType = activePlanType === "all"
          ? !p.categories.includes("payg" as any)
          : p.categories.includes(activePlanType as any);
        const matchesSearch = !normalizedSearch || p.title.toLowerCase().includes(normalizedSearch);
        return matchesType && matchesSearch;
      })
      .sort((a, b) => {
        if (activePlanType === "all") {
          const fr = familyRank(a) - familyRank(b);
          if (fr !== 0) return fr;
        }
        return b.price - a.price;
      });
  }, [plans, activePlanType, normalizedSearch]);

  const detailPlan = detailIdx != null ? plans[detailIdx] : null;

  return (
    <section>
      {filteredPlans.length === 0 ? (
        <div className="mt-3 bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
          {t("activation.plan.noPlans")}
        </div>
      ) : (
        // Fixed to ~4 rows (64.5px row + 8px gap each) — extra plans scroll inside this box
        // instead of growing the page, so the page height stays constant regardless of how
        // many plans are in the filtered list.
        <div className="mt-3 max-h-[290px] overflow-y-auto overscroll-contain space-y-2 pe-0.5 scrollbar-thin-light">
          {filteredPlans.map((p) => {
            const originalIdx = plans.indexOf(p);
            const isSelected = selectedPlan === originalIdx;
            const validity = formatValidity(p.validityLabel);
            return (
              <button
                key={`${p.title}-${p.price}`}
                type="button"
                onClick={() => setDetailIdx(originalIdx)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-3.5 py-3 text-start transition-colors",
                  isSelected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60",
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30",
                )}>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <p className="text-[11px] text-muted-foreground">{validity}</p>
                    {isMnpEligible?.(p) && (
                      <span className="px-1.5 py-[1px] rounded-full bg-sky-600 text-white text-[9px] font-semibold whitespace-nowrap">
                        {t("activation.plan.mnpEligible")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-[10px] text-muted-foreground">{t("activation.plan.vatIncl")}</p>
                  <p className="text-sm font-bold text-foreground">
                    <span className="text-muted-foreground font-normal text-xs"><RiyalSymbol /></span> {Number(p.price).toFixed(2)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
              </button>
            );
          })}
        </div>
      )}

      <Drawer open={detailPlan != null} onOpenChange={(o) => !o && setDetailIdx(null)}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-4 pb-6 pt-2 max-h-[85vh] flex flex-col">
          <div className="relative mb-3 mt-2 flex items-center justify-center shrink-0">
            <DrawerTitle className="font-semibold text-foreground text-lg truncate px-10">{detailPlan?.title}</DrawerTitle>
            <button
              onClick={() => setDetailIdx(null)}
              aria-label={t("settings.close")}
              className="absolute end-0 w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1 min-h-0">
            {detailPlan && (
              <PlanCard
                plan={detailPlan}
                selected={detailIdx === selectedPlan}
                active
                layout={planLayout(detailPlan)}
                minsLabel={detailPlan.categories.includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                mnpEligible={isMnpEligible?.(detailPlan)}
                onSelect={() => {
                  if (detailIdx != null) onSelect(detailIdx, detailPlan);
                  setDetailIdx(null);
                }}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
};

export default PlanCompactSelector;
