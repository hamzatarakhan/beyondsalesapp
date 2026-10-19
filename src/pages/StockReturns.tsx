import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, Clock, Plus } from "lucide-react";
import { stockReturns, PURCHASE_ORDER_PRODUCTS, type StockReturnStatus } from "@/data/stockReturnStore";

const STATUSES: StockReturnStatus[] = ["pending", "approved", "rejected"];

const STATUS_STYLE: Record<StockReturnStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const StockReturns = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StockReturnStatus | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stockReturns
      .filter((o) => {
        if (q && !o.id.toLowerCase().includes(q)) return false;
        if (status && o.status !== status) return false;
        return true;
      })
      .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
  }, [search, status]);

  const productName = (productId: string) =>
    t(`purchaseOrders.product.${PURCHASE_ORDER_PRODUCTS.find((p) => p.id === productId)?.nameKey}`);

  return (
    <div className="mobile-container min-h-screen bg-background pb-24">
      <AppHeader title={t("stockReturn.title")} showBack />

      <div className="px-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("stockReturn.searchPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
          </div>
          <button
            type="button"
            aria-label={t("stockReturn.filterAria")}
            className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setStatus(null)}
            className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", status === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
          >
            {t("purchaseOrders.filter.all")}
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              {t(`stockReturn.status.${s}`)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("stockReturn.noReturns")}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const shown = o.lines.slice(0, 3);
              const extra = o.lines.length - shown.length;
              return (
                <div
                  key={o.id}
                  className="w-full text-start bg-card rounded-2xl border-s-4 border-s-primary border border-border/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">{o.id}</p>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[o.status])}>{t(`stockReturn.status.${o.status}`)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {o.date}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {shown.map((l) => (
                      <span key={l.productId} className="px-2.5 py-1 rounded-full bg-muted/70 border border-border/60 text-[11px] font-medium text-muted-foreground">
                        {productName(l.productId)}
                      </span>
                    ))}
                    {extra > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-muted/70 border border-border/60 text-[11px] font-medium text-muted-foreground">
                        {t("stockReturn.moreItems", { count: extra })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/stock-returns/new")}
        className="fixed bottom-6 end-6 z-40 h-12 ps-4 pe-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-primary/30"
      >
        <Plus className="w-4 h-4" /> {t("stockReturn.newOrder")}
      </button>
    </div>
  );
};

export default StockReturns;
