import { useMemo, useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn, formatValidity } from "@/lib/utils";
import PlanCard from "@/components/PlanCard";
import { PLANS, type Plan } from "@/components/activation/PlanSelector";
import RiyalSymbol from "@/components/RiyalSymbol";

// Same family ordering PlanSelector uses for its "All" tab — kept as its own copy since
// this is a standalone presentation variant (Plans option 3), not meant to share state
// with the carousel/compact-sheet variants used by the other SIM Activation flows.
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

interface PlanExpandableSelectorProps {
  selectedPlan: number | null;
  onSelect: (idx: number, plan: Plan) => void;
  plans?: Plan[];
  categoryFilter?: string;
  isMnpEligible?: (plan: Plan) => boolean;
  searchQuery?: string;
}

// Brief, vertically-stacked plan rows (name / validity / VAT price) — tapping a row expands
// it in place to reveal the full feature breakdown (the same PlanCard used elsewhere),
// instead of opening a separate bottom sheet. Only one row is expanded at a time.
const PlanExpandableSelector = ({ selectedPlan, onSelect, plans = PLANS, categoryFilter, isMnpEligible, searchQuery }: PlanExpandableSelectorProps) => {
  const { t } = useTranslation();
  const activePlanType = categoryFilter ?? "all";
  const normalizedSearch = searchQuery?.trim().toLowerCase() ?? "";
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

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

  return (
    <section>
      {filteredPlans.length === 0 ? (
        <div className="mt-3 bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
          {t("activation.plan.noPlans")}
        </div>
      ) : (
        // Fixed to ~4 collapsed rows so the page doesn't grow with the plan count. Expanding a
        // row grows the cap (animated) to comfortably fit the tallest plan layout in full —
        // the box stays a scroll region throughout (never loses its scrollbar), it just has
        // more room to work with once something's open.
        <div className={cn(
          "mt-3 space-y-2 pe-0.5 overflow-y-auto overscroll-contain scrollbar-thin-light transition-[max-height] duration-300 ease-in-out",
          expandedIdx == null ? "max-h-[290px]" : "max-h-[440px]",
        )}>
          {filteredPlans.map((p) => {
            const originalIdx = plans.indexOf(p);
            const isSelected = selectedPlan === originalIdx;
            const isExpanded = expandedIdx === originalIdx;
            const validity = formatValidity(p.validityLabel);
            return (
              <div
                key={`${p.title}-${p.price}`}
                className={cn(
                  "rounded-xl border transition-colors overflow-hidden",
                  isSelected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60",
                )}
              >
                {/* Radio selects the plan; the rest of the row only expands/collapses it —
                    two separate actions instead of one control doing both. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedIdx(isExpanded ? null : originalIdx)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedIdx(isExpanded ? null : originalIdx); } }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-start cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelect(originalIdx, p); }}
                    aria-label={t("activation.plan.selectPlanAria", { title: p.title })}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30",
                    )}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                    {/* Badge/pill moved here from the card body (hidden there via hideTitleRow)
                        so they add width, not height, when the row expands. */}
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <p className="text-[11px] text-muted-foreground">{validity}</p>
                      {isMnpEligible?.(p) && (
                        <span className="px-1.5 py-[1px] rounded-full bg-sky-600 text-white text-[9px] font-semibold whitespace-nowrap">
                          {t("activation.plan.mnpEligible")}
                        </span>
                      )}
                      {p.badge && (
                        <span className="px-1.5 py-[1px] rounded-full bg-green-600 text-white text-[9px] font-semibold whitespace-nowrap">
                          {t(`activation.plan.badges.${p.badge}`, p.badge)}
                        </span>
                      )}
                      {p.categories.includes("aman") && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-semibold whitespace-nowrap">
                          <ShieldCheck className="w-2.5 h-2.5" /> {t("activation.plan.aman.trustedPill")}
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
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", isExpanded && "rotate-180")} />
                </div>

                {/* Grid-rows 0fr→1fr trick — animates the reveal smoothly without measuring
                    the card's height in JS; the card itself stays mounted throughout. */}
                <div className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-in-out",
                  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}>
                  <div className="overflow-hidden">
                    <div className="px-2 pb-2">
                      <PlanCard
                        plan={p}
                        selected={isSelected}
                        active
                        layout={planLayout(p)}
                        minsLabel={p.categories.includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                        mnpEligible={isMnpEligible?.(p)}
                        onSelect={() => onSelect(originalIdx, p)}
                        hideTitleRow
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PlanExpandableSelector;
