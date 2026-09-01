import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { MapPin, Search, X as XIcon, ChevronDown, Pencil, Minus, Plus, Smartphone, CreditCard, Router as RouterIcon, Check } from "lucide-react";
import {
  PURCHASE_ORDER_PRODUCTS,
  DEMO_SOURCE_LOCATIONS,
  sourceAvailableStock,
  getSalesOrderMulti,
  updateSalesOrderMulti,
  type ProductId,
} from "@/data/salesOrdersMultiStore";

const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };

interface DraftSource {
  location: string;
  qty: number;
}

const SalesOrdersMultiSelectLocation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const order = id ? getSalesOrderMulti(id) : undefined;

  const [draftSources, setDraftSources] = useState<Record<ProductId, DraftSource[]>>(() => {
    const initial: Record<ProductId, DraftSource[]> = { esim: [], psim: [], router: [] };
    order?.lines.forEach((l) => { initial[l.productId] = l.sources.map((s) => ({ location: s.location, qty: s.qty })); });
    return initial;
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pickerProduct, setPickerProduct] = useState<ProductId | null>(null);
  const [pickerDraft, setPickerDraft] = useState<DraftSource[]>([]);
  const [locationSearch, setLocationSearch] = useState("");

  if (!order) {
    return (
      <div className="mobile-container min-h-screen bg-background">
        <AppHeader title={t("salesOrders.selectLocation")} showBack onBackClick={() => navigate("/sales-orders-multi")} />
        <p className="text-center text-sm text-muted-foreground py-16">{t("salesOrders.noOrders")}</p>
      </div>
    );
  }

  const canSubmit = order.lines.every((l) => (draftSources[l.productId]?.length ?? 0) > 0);

  const filteredLocations = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (!q) return DEMO_SOURCE_LOCATIONS;
    return DEMO_SOURCE_LOCATIONS.filter((loc) => loc.toLowerCase().includes(q));
  }, [locationSearch]);

  const openPicker = (productId: ProductId) => {
    setPickerDraft(draftSources[productId] ?? []);
    setLocationSearch("");
    setPickerProduct(productId);
  };

  const toggleLocation = (loc: string) => {
    setPickerDraft((prev) => {
      const exists = prev.find((s) => s.location === loc);
      if (exists) return prev.filter((s) => s.location !== loc);
      const line = order.lines.find((l) => l.productId === pickerProduct);
      return [...prev, { location: loc, qty: line?.qty ?? 1 }];
    });
  };

  const setLocationQty = (loc: string, qty: number) => {
    setPickerDraft((prev) => prev.map((s) => (s.location === loc ? { ...s, qty: Math.max(1, Math.min(qty, sourceAvailableStock())) } : s)));
  };

  const applyPicker = () => {
    if (!pickerProduct) return;
    setDraftSources((prev) => ({ ...prev, [pickerProduct]: pickerDraft }));
    setExpanded((prev) => ({ ...prev, [pickerProduct]: true }));
    setPickerProduct(null);
  };

  const clearPicker = () => setPickerDraft([]);

  const submit = () => {
    updateSalesOrderMulti(order.id, {
      status: "awaitingScanning",
      lines: order.lines.map((l) => ({
        ...l,
        sources: (draftSources[l.productId] ?? []).map((s) => ({ location: s.location, qty: s.qty, scanned: 0, serials: [] })),
      })),
    });
    navigate(`/sales-orders-multi/${order.id}`);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t("salesOrders.selectLocation")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{order.id}</p>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {t(`salesOrders.status.${order.status}`)}
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground">{t("purchaseOrders.shippingTo")}</p>
              <p className="text-sm font-semibold text-foreground">{order.destination}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            {order.date} <span className="text-muted-foreground/50">•</span> <span className="text-primary font-semibold">{order.channelMember.name}</span>
          </p>
        </div>

        {order.lines.map((l) => {
          const product = PURCHASE_ORDER_PRODUCTS.find((p) => p.id === l.productId)!;
          const Icon = PRODUCT_ICON[l.productId];
          const sources = draftSources[l.productId] ?? [];
          const isOpen = !!expanded[l.productId];
          return (
            <div key={l.productId} className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${product.nameKey}`)}</p>
                  <p className="text-[11px] text-muted-foreground">{t("purchaseOrders.pcs", { count: l.qty })}</p>
                </div>
                <button type="button" onClick={() => openPicker(l.productId)} aria-label={t("salesOrders.editSourcesAria")} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                </button>
                {sources.length > 0 && (
                  <button type="button" onClick={() => setExpanded((prev) => ({ ...prev, [l.productId]: !prev[l.productId] }))} aria-label={t("salesOrders.toggleSourcesAria")}>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", !isOpen && "-rotate-90")} />
                  </button>
                )}
              </div>
              {sources.length > 0 && isOpen && (
                <div className="space-y-2">
                  {sources.map((s) => (
                    <div key={s.location} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs font-semibold text-foreground truncate">{s.location}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground shrink-0">{t("purchaseOrders.pcs", { count: s.qty })}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("purchaseOrders.untaxedAmount")}</span>
            <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {order.untaxed.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <span className="text-xs text-muted-foreground">{t("purchaseOrders.tax")}</span>
            <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {order.tax.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-primary">{t("purchaseOrders.total")}</span>
            <span className="text-xs font-bold text-primary"><RiyalSymbol /> {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <button type="button" disabled={!canSubmit} onClick={submit} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {t("salesOrders.approveAndSubmit")}
        </button>
      </div>

      {/* ---------- Select Source Location ---------- */}
      <Drawer open={!!pickerProduct} onOpenChange={(o) => { if (!o) setPickerProduct(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setPickerProduct(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("salesOrders.selectSourceLocation")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("salesOrders.selectSourceLocationSub")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={locationSearch} onChange={(e) => setLocationSearch(e.target.value)} placeholder={t("salesOrders.searchBySourceLocation")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1">
            {filteredLocations.map((loc) => {
              const picked = pickerDraft.find((s) => s.location === loc);
              return (
                <div key={loc} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 rounded-2xl border transition text-start",
                      picked ? "border-[0.5px] bg-primary/10 border-primary/20" : "border-border bg-card",
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center", picked ? "bg-primary border-primary" : "border-primary/40")}>
                      {picked && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1">{loc}</span>
                    <span className="text-[11px] font-semibold text-primary shrink-0">{t("salesOrders.available", { count: sourceAvailableStock() })}</span>
                  </button>
                  {picked && (
                    <div className="flex items-center gap-2 px-1">
                      <button type="button" onClick={() => setLocationQty(loc, picked.qty - 1)} className="flex-1 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-14 text-center text-sm font-bold text-foreground">{picked.qty}</span>
                      <button type="button" onClick={() => setLocationQty(loc, picked.qty + 1)} className="flex-1 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 pb-8 pt-2 space-y-3 border-t border-border/40">
            <button type="button" disabled={pickerDraft.length === 0} onClick={applyPicker} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {t("purchaseOrders.filter.apply")}
            </button>
            <button type="button" onClick={clearPicker} className="w-full text-center text-sm font-medium text-muted-foreground">
              {t("purchaseOrders.filter.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SalesOrdersMultiSelectLocation;
