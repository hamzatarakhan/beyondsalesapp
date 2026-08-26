import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlanCard from "@/components/PlanCard";
import { Input } from "@/components/ui/input";
import { POSTPAID_PLANS } from "@/pages/NewActivation";

interface NavState {
  selectedPlanTitle?: string;
  msisdn: string;
  /** location.search from ChangePostpaidPlan — restored on the way back. */
  backSearch?: string;
}

const SWITCH_POSTPAID_PLANS = POSTPAID_PLANS.filter((p) => p.categories.includes("switch-postpaid"));

// Single category (Switch Postpaid) — no filter icon needed, same convention as Prepaid
// Change Bundle's 5G MBB catalog and Subscription Migration's Pre to Post.
const ChangePostpaidPlanAllPlans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const initial = (location.state as NavState | null) ?? { msisdn: "" };
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const visiblePlans = SWITCH_POSTPAID_PLANS.filter((p) => !normalizedSearch || p.title.toLowerCase().includes(normalizedSearch));

  const goBack = () => {
    navigate(`/change-postpaid-plan${initial.backSearch ?? ""}`, {
      state: { pickPlan: { msisdn: initial.msisdn, title: initial.selectedPlanTitle ?? "" } },
    });
  };

  const pickPlan = (title: string) => {
    navigate(`/change-postpaid-plan${initial.backSearch ?? ""}`, {
      state: { pickPlan: { msisdn: initial.msisdn, title } },
    });
  };

  return (
    <div className="mobile-container pb-8 min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background">
        <header className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label={t("changePostpaidPlan.backAria")}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-foreground rtl:rotate-180" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground truncate">{t("changePostpaidPlan.allPlansTitle")}</h1>
          <div className="w-10 shrink-0" />
        </header>

        <div className="px-4 flex items-center gap-2 pb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("changePostpaidPlan.searchPlans")}
              className="h-11 bg-card rounded-xl ps-9"
            />
          </div>
        </div>
      </div>

      {/* Vertical plan list */}
      <div className="px-4 space-y-3">
        {visiblePlans.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
            {t("changePostpaidPlan.noPlansMatchSearch")}
          </div>
        ) : (
          visiblePlans.map((p) => (
            <PlanCard
              key={`${p.title}-${p.price}`}
              plan={p}
              selected={false}
              active
              hideRadio
              minsLabel={t("activation.plan.localMins")}
              layout="postpaid"
              onSelect={() => pickPlan(p.title)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChangePostpaidPlanAllPlans;
