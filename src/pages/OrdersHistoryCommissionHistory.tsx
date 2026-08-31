import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, ArrowUpRight, Clock } from "lucide-react";
import { ORDERS, type OrderStatus } from "@/pages/OrdersHistory";

// Full list behind the Commission tab's "See all" — same rows the tab already renders,
// just every commission-bearing order instead of the tab's date-scoped subset, plus search.
const STATUS_STYLE: Record<OrderStatus, string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const OrdersHistoryCommissionHistory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ORDERS.filter((o) => o.commission > 0)
      .filter((o) => !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.phone.includes(q))
      .map((o, i) => ({ ...o, kind: i % 2 === 0 ? ("instance" as const) : ("scheduled" as const) }));
  }, [search]);

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
          rows.map((o) => (
            <div key={o.id} className="bg-card rounded-2xl p-4 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {o.kind === "instance" ? <ArrowUpRight className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">{t(`ordersHistory.${o.kind === "instance" ? "instanceCommission" : "scheduledCommission"}`)}</p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    +<RiyalSymbol /> {o.commission.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{o.member} · {o.memberCode}</p>
                <p className="text-[11px] text-muted-foreground truncate">{o.id}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{o.date}</span>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[o.commissionStatus])}>
                    {t(`ordersHistory.status.${o.commissionStatus}`)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersHistoryCommissionHistory;
