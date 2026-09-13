import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Clock, Boxes, ArrowRight, Plus } from "lucide-react";
import { stockTransfers, PURCHASE_ORDER_PRODUCTS, type StockTransferStatus } from "@/data/stockTransferStore";

const STATUSES: StockTransferStatus[] = ["pending", "inTransit", "received", "cancelled"];

const STATUS_STYLE: Record<StockTransferStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  inTransit: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  received: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
};

const StockTransfers = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StockTransferStatus | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stockTransfers
      .filter((o) => {
        if (q && !o.id.toLowerCase().includes(q)) return false;
        if (status && o.status !== status) return false;
        return true;
      })
      .sort((a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status));
  }, [search, status]);

  const itemsSummary = (lines: { productId: string; qty: number }[]) =>
    lines
      .map((l) => `${t(`purchaseOrders.product.${PURCHASE_ORDER_PRODUCTS.find((p) => p.id === l.productId)?.nameKey}`)} (${l.qty})`)
      .join(" , ");

  return (
    <div className="mobile-container min-h-screen bg-background pb-24">
      <AppHeader title={t("stockTransfer.title")} showBack />

      <div className="px-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("stockTransfer.searchPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
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
              {t(`stockTransfer.status.${s}`)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("stockTransfer.noTransfers")}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => navigate(`/stock-transfer/${o.id}`)}
                className="w-full text-start bg-card rounded-2xl border-s-4 border-s-primary border border-border/60 p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{o.id}</p>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[o.status])}>{t(`stockTransfer.status.${o.status}`)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  {o.date}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <span className="truncate">{o.fromBranch}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                  <span className="truncate">{o.toBranch}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Boxes className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{itemsSummary(o.lines)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => navigate("/stock-transfer/new")}
        className="fixed bottom-6 end-6 z-40 h-12 ps-4 pe-5 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-primary/30"
      >
        <Plus className="w-4 h-4" /> {t("stockTransfer.newTransfer")}
      </button>
    </div>
  );
};

export default StockTransfers;
