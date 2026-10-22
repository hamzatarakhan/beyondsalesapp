import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import KpiDonut from "@/components/KpiDonut";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { ORDERS, SELF_MEMBER_CODE, type OrderStatus } from "@/pages/OrdersHistory";

// Full list behind the Commission tab's "See all" — same rows the tab already renders,
// just every commission-bearing order instead of the tab's date-scoped subset, plus search.
// Each row uses the KPI Group card shell (grey surface, leading ring, title + sub-lines)
// so the commission list reads as one system with the Commission tab's KPI cards.
const STATUS_STYLE: Record<OrderStatus, string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const OrdersHistoryCommissionHistory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view") === "member" ? "member" : "parent";
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ORDERS.filter((o) => o.commission > 0)
      .filter((o) => view === "parent" || o.memberCode === SELF_MEMBER_CODE)
      .filter((o) => !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.phone.includes(q))
      .map((o, i) => ({ ...o, kind: i % 2 === 0 ? ("instance" as const) : ("scheduled" as const) }));
  }, [search, view]);

  // The ring shows each order's share of the commission total currently on screen.
  const totalCommission = useMemo(() => rows.reduce((sum, o) => sum + o.commission, 0), [rows]);

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("ordersHistory.commissionHistory")} showBack onBackClick={() => navigate(-1)} />
      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("ordersHistory.searchOrdersPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
        </div>

        {rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("ordersHistory.noOrders")}</div>
        ) : (
          rows.map((o) => {
            const share = totalCommission > 0 ? Math.round((o.commission / totalCommission) * 100) : 0;
            return (
              <div key={o.id} className="rounded-2xl bg-surface border border-border/60 shadow-sm px-4 py-3 flex items-center gap-3">
                <KpiDonut percent={share} size={48} label={`${o.commission % 1 === 0 ? o.commission : o.commission.toFixed(2)}`} labelClassName="text-[10px]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {t(`ordersHistory.${o.kind === "instance" ? "instanceCommission" : "scheduledCommission"}`)}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight mt-0.5 flex items-center gap-1 tabular-nums">
                    +<RiyalSymbol /> {o.commission.toFixed(2)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{o.id} · {o.date.split(" - ")[0]}</p>
                  {view === "parent" && (
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">{o.member} · {o.memberCode}</p>
                  )}
                </div>
                <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[o.commissionStatus])}>
                  {t(`ordersHistory.status.${o.commissionStatus}`)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OrdersHistoryCommissionHistory;
