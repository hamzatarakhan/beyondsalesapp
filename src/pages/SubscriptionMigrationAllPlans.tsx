import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlanCard from "@/components/PlanCard";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useBrand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";
import { PREPAID_PLANS, POSTPAID_PLANS, FRIENDI_PLANS } from "@/pages/NewActivation";

type Direction = "pre-to-post" | "post-to-pre";

// Same category lists as SubscriptionMigration.tsx (not exported there, redeclared here).
const ELIGIBLE_PREPAID_CATEGORIES = ["aman", "base-plan", "flex"];
const FM_MIGRATION_CATEGORIES = ["combo", "flexi", "data"];

interface NavState {
  direction: Direction;
  chip?: string;
  selectedPlanTitle?: string;
  msisdn: string;
  /** location.search from SubscriptionMigration (e.g. "?direction=pre-to-post" for the
   * direction-locked Option 2 services) — restored on the way back so the dealer lands on
   * the same locked service they came from. */
  backSearch?: string;
}

const SubscriptionMigrationAllPlans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { brand } = useBrand();
  const isFriendi = brand === "friendi";

  const initial = (location.state as NavState | null) ?? { direction: "pre-to-post" as Direction, msisdn: "" };
  const direction = initial.direction;
  const [chip, setChip] = useState(initial.chip ?? "all");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const planList = direction === "pre-to-post"
    ? POSTPAID_PLANS.filter((p) => p.categories.includes("switch-postpaid"))
    : isFriendi
    ? FRIENDI_PLANS.filter((p) => p.categories.some((c) => FM_MIGRATION_CATEGORIES.includes(c)))
    : PREPAID_PLANS.filter((p) => p.categories.some((c) => ELIGIBLE_PREPAID_CATEGORIES.includes(c)));

  // Category chips only apply to Postpaid → Prepaid (the eligible prepaid catalog spans
  // several categories); Prepaid → Postpaid is a single "switch-postpaid" category.
  const showChips = direction === "post-to-pre";
  const chips = isFriendi
    ? [
        { value: "all", label: t("subscriptionMigration.chipAll") },
        { value: "combo", label: t("subscriptionMigration.categoryCombo") },
        { value: "flexi", label: t("subscriptionMigration.categoryFlexi") },
        { value: "data", label: t("subscriptionMigration.categoryData") },
      ]
    : [
        { value: "all", label: t("subscriptionMigration.chipAll") },
        { value: "aman", label: t("subscriptionMigration.categoryAman") },
        { value: "base-plan", label: t("subscriptionMigration.categoryBaqah") },
        { value: "flex", label: t("subscriptionMigration.categoryBaqahFlex") },
      ];

  const activeFilterCount = chip !== "all" ? 1 : 0;

  const normalizedSearch = search.trim().toLowerCase();
  const visiblePlans = planList
    .filter((p) => !showChips || chip === "all" || p.categories.includes(chip as any))
    .filter((p) => !normalizedSearch || p.title.toLowerCase().includes(normalizedSearch));

  // Back restores the Plan step exactly as it was before this page opened — original chip
  // and whatever plan was already selected, if any — rather than whatever the dealer may
  // have changed while just browsing here.
  const goBack = () => {
    navigate(`/subscription-migration${initial.backSearch ?? ""}`, {
      state: { pickPlan: { msisdn: initial.msisdn, chip: initial.chip ?? "all", title: initial.selectedPlanTitle ?? "" } },
    });
  };

  const pickPlan = (title: string) => {
    navigate(`/subscription-migration${initial.backSearch ?? ""}`, {
      state: { pickPlan: { msisdn: initial.msisdn, chip, title } },
    });
  };

  return (
    <div className="mobile-container pb-8 min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background">
        <header className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label={t("subscriptionMigration.backAria")}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground rtl:rotate-180" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground truncate">{t("subscriptionMigration.allPlansTitle")}</h1>
          <div className="w-10 shrink-0" />
        </header>

        <div className="px-4 flex items-center gap-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("subscriptionMigration.searchPlans")}
              className="h-11 bg-card rounded-xl ps-9"
            />
          </div>
          {showChips && (
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              aria-label={t("subscriptionMigration.filtersAria")}
              className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Vertical plan list */}
      <div className="px-4 space-y-3">
        {visiblePlans.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
            {t("subscriptionMigration.noPlansMatchSearch")}
          </div>
        ) : (
          visiblePlans.map((p) => {
            const cats = p.categories ?? [];
            const layout = cats.includes("switch-postpaid") ? "postpaid"
              : cats.includes("combo") ? "combo"
              : cats.includes("flexi") ? "combo"
              : cats.includes("aman") ? "aman"
              : cats.includes("base-plan") ? "baqa"
              : "flex";
            return (
              <PlanCard
                key={`${p.title}-${p.price}`}
                plan={p}
                selected={false}
                active
                hideRadio
                minsLabel={cats.includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                layout={layout as any}
                onSelect={() => pickPlan(p.title)}
              />
            );
          })
        )}
      </div>

      {/* Filters bottom sheet — only reachable when there's something to filter (Post to
          Pre's several plan categories); Pre to Post's catalog is a single category, so
          neither the trigger button above nor this sheet render for it. */}
      {showChips && (
        <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
          <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh]">
            <button
              onClick={() => setFilterOpen(false)}
              aria-label={t("subscriptionMigration.close")}
              className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            <DrawerHeader className="text-center pt-8">
              <DrawerTitle className="text-lg font-semibold">{t("subscriptionMigration.filtersTitle")}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-5 overflow-y-auto">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t("subscriptionMigration.planTypesTitle")}</h3>
                <div className="flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChip(c.value)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                        chip === c.value ? "bg-primary text-white" : "bg-muted text-foreground",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
              >
                {t("subscriptionMigration.applyFilters")}
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
};

export default SubscriptionMigrationAllPlans;
