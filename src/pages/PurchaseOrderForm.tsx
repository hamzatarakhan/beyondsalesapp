import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, X as XIcon, Minus, Plus, Boxes, Smartphone, CreditCard, Router as RouterIcon, Check, MapPin } from "lucide-react";
import {
  PURCHASE_ORDER_PRODUCTS,
  DEMO_DESTINATIONS,
  computeTotals,
  getPurchaseOrder,
  updatePurchaseOrder,
  addPurchaseOrder,
  type ProductId,
} from "@/data/purchaseOrdersStore";

const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };

const SummaryRow = ({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className={cn("text-xs", bold ? "font-bold text-primary" : "text-muted-foreground")}>{label}</span>
    <span className={cn("text-xs", bold ? "font-bold text-primary" : "font-semibold text-foreground")}>{value}</span>
  </div>
);

const PurchaseOrderForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const existing = isEdit ? getPurchaseOrder(id!) : undefined;

  const [destination, setDestination] = useState(existing?.destination ?? "");
  const [qtys, setQtys] = useState<Record<ProductId, number>>(() => {
    const initial: Record<ProductId, number> = { esim: 0, psim: 0, router: 0 };
    existing?.lines.forEach((l) => { initial[l.productId] = l.qty; });
    return initial;
  });

  const [destinationOpen, setDestinationOpen] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // Not found (e.g. stale/bad :id) — bounce back to the list rather than render a blank form.
  useEffect(() => {
    if (isEdit && !existing) navigate("/purchase-orders", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, existing]);

  const lines = useMemo(() => PURCHASE_ORDER_PRODUCTS.map((p) => ({ productId: p.id, qty: qtys[p.id] })), [qtys]);
  const totals = useMemo(() => computeTotals(lines), [lines]);
  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
  const canSubmit = totalQty > 0 && !!destination;

  const filteredDestinations = useMemo(() => {
    const q = destinationSearch.trim().toLowerCase();
    if (!q) return DEMO_DESTINATIONS;
    return DEMO_DESTINATIONS.filter((d) => d.toLowerCase().includes(q));
  }, [destinationSearch]);

  const setQty = (id: ProductId, next: number) => setQtys((prev) => ({ ...prev, [id]: Math.max(0, Math.min(next, PURCHASE_ORDER_PRODUCTS.find((p) => p.id === id)!.availableStocks)) }));

  const submit = () => {
    setConfirmOpen(false);
    const nonZeroLines = lines.filter((l) => l.qty > 0).map((l) => ({ ...l, scanned: 0, serials: [] }));
    if (isEdit && existing) {
      updatePurchaseOrder(existing.id, { destination, lines: nonZeroLines, ...computeTotals(lines) });
    } else {
      addPurchaseOrder(destination, nonZeroLines);
    }
    setSuccessOpen(true);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t(isEdit ? "purchaseOrders.editOrderTitle" : "purchaseOrders.createOrderTitle")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">{t("purchaseOrders.destinations")}</p>
          <button
            type="button"
            onClick={() => setDestinationOpen(true)}
            className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
          >
            <span className={destination ? "text-foreground font-medium" : "text-muted-foreground"}>{destination || t("purchaseOrders.selectDestination")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          </button>
        </div>

        {PURCHASE_ORDER_PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICON[p.id];
          const qty = qtys[p.id];
          return (
            <div key={p.id} className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${p.nameKey}`)}</p>
                  <p className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <Boxes className="w-3 h-3" /> {t("purchaseOrders.availableStocks", { count: p.availableStocks })}
                  </p>
                </div>
              </div>
              <div className="flex items-center h-11 rounded-full bg-card overflow-hidden">
                <button
                  type="button"
                  disabled={qty <= 0}
                  onClick={() => setQty(p.id, qty - 1)}
                  aria-label={t("purchaseOrders.decreaseAria", { product: t(`purchaseOrders.product.${p.nameKey}`) })}
                  className="flex-1 h-full flex items-center justify-center text-primary bg-primary/10 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={qty === 0 ? "" : String(qty)}
                  onChange={(e) => setQty(p.id, parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
                  placeholder="0"
                  aria-label={t(`purchaseOrders.product.${p.nameKey}`)}
                  className="flex-1 h-full bg-card text-center text-sm font-bold text-foreground outline-none"
                />
                <button
                  type="button"
                  disabled={qty >= p.availableStocks}
                  onClick={() => setQty(p.id, qty + 1)}
                  aria-label={t("purchaseOrders.increaseAria", { product: t(`purchaseOrders.product.${p.nameKey}`) })}
                  className="flex-1 h-full flex items-center justify-center text-primary bg-primary/10 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <SummaryRow label={t("purchaseOrders.untaxedAmount")} value={<><RiyalSymbol /> {totals.untaxed.toFixed(2)}</>} />
          <SummaryRow label={t("purchaseOrders.tax")} value={<><RiyalSymbol /> {totals.tax.toFixed(2)}</>} />
          <SummaryRow label={t("purchaseOrders.total")} bold value={<><RiyalSymbol /> {totals.total.toFixed(2)}</>} />
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setConfirmOpen(true)}
          className={cn(
            "w-full h-12 rounded-full font-semibold text-sm flex items-center justify-between px-5 transition-colors",
            canSubmit ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          <span className="flex items-center gap-2">
            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", canSubmit ? "bg-white/20" : "bg-background")}>{totalQty}</span>
            {t(isEdit ? "purchaseOrders.save" : "purchaseOrders.submitOrder")}
          </span>
          <span className="flex items-center gap-1">
            <RiyalSymbol /> {totals.total.toFixed(2)}
          </span>
        </button>
      </div>

      {/* ---------- Destinations picker ---------- */}
      <Drawer open={destinationOpen} onOpenChange={setDestinationOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setDestinationOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("purchaseOrders.destinations")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={destinationSearch} onChange={(e) => setDestinationSearch(e.target.value)} placeholder={t("purchaseOrders.searchPlaceholder")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
            {filteredDestinations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDestination(d); setDestinationOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-2xl transition text-start",
                  destination === d ? "border-[0.5px] bg-primary/10 border-primary/20" : "bg-muted/50",
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                </div>
                <span className="text-sm font-semibold text-foreground flex-1">{d}</span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmMessageDrawer
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t(isEdit ? "purchaseOrders.saveRequestTitle" : "purchaseOrders.submitRequestTitle")}
        description={t(isEdit ? "purchaseOrders.saveRequestDesc" : "purchaseOrders.submitRequestDesc")}
        confirmLabel={t(isEdit ? "purchaseOrders.save" : "purchaseOrders.submit")}
        onConfirm={submit}
        cancelLabel={t("purchaseOrders.cancel")}
      />

      {/* ---------- Success ---------- */}
      <Drawer open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); navigate("/purchase-orders"); } }}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1 text-center">{t(isEdit ? "purchaseOrders.saveSuccessTitle" : "purchaseOrders.submitSuccessTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-2 text-center">{t(isEdit ? "purchaseOrders.saveSuccessDesc" : "purchaseOrders.submitSuccessDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => { setSuccessOpen(false); navigate("/purchase-orders"); }}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            {t("purchaseOrders.done")}
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default PurchaseOrderForm;
