import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, X as XIcon, Minus, Plus, Boxes, Smartphone, CreditCard, Router as RouterIcon, Check, MapPin } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS, addStockTransfer, type ProductId } from "@/data/stockTransferStore";

const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };

type Picker = "from" | "to" | null;

const StockTransferForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [qtys, setQtys] = useState<Record<ProductId, number>>({ esim: 0, psim: 0, router: 0 });

  const [picker, setPicker] = useState<Picker>(null);
  const [branchSearch, setBranchSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const lines = useMemo(() => PURCHASE_ORDER_PRODUCTS.map((p) => ({ productId: p.id, qty: qtys[p.id] })).filter((l) => l.qty > 0), [qtys]);
  const totalQty = lines.reduce((sum, l) => sum + l.qty, 0);
  // A branch can't transfer stock to itself — that's the one rule this form enforces beyond
  // "pick both branches and at least one item".
  const branchesDiffer = !!fromBranch && !!toBranch && fromBranch !== toBranch;
  const canSubmit = totalQty > 0 && branchesDiffer;

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    // The other side's already-picked branch can't be picked again for this side.
    const exclude = picker === "from" ? toBranch : fromBranch;
    return DEMO_DESTINATIONS.filter((d) => d !== exclude && (!q || d.toLowerCase().includes(q)));
  }, [branchSearch, picker, fromBranch, toBranch]);

  const setQty = (id: ProductId, next: number) => setQtys((prev) => ({ ...prev, [id]: Math.max(0, Math.min(next, PURCHASE_ORDER_PRODUCTS.find((p) => p.id === id)!.availableStocks)) }));

  const submit = () => {
    setConfirmOpen(false);
    addStockTransfer(fromBranch, toBranch, lines);
    setSuccessOpen(true);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t("stockTransfer.createTitle")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">{t("stockTransfer.fromBranch")}</p>
          <button
            type="button"
            onClick={() => { setBranchSearch(""); setPicker("from"); }}
            className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
          >
            <span className={fromBranch ? "text-foreground font-medium" : "text-muted-foreground"}>{fromBranch || t("stockTransfer.selectBranch")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">{t("stockTransfer.toBranch")}</p>
          <button
            type="button"
            onClick={() => { setBranchSearch(""); setPicker("to"); }}
            className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
          >
            <span className={toBranch ? "text-foreground font-medium" : "text-muted-foreground"}>{toBranch || t("stockTransfer.selectBranch")}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          </button>
          {fromBranch && toBranch && !branchesDiffer && (
            <p className="text-xs text-destructive px-1">{t("stockTransfer.sameBranchError")}</p>
          )}
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
              <div className="flex items-center h-11 rounded-full bg-card border border-border overflow-hidden">
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
            {t("stockTransfer.submitTransfer")}
          </span>
        </button>
      </div>

      {/* ---------- Branch picker (shared for From / To) ---------- */}
      <Drawer open={!!picker} onOpenChange={(o) => { if (!o) setPicker(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setPicker(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t(picker === "from" ? "stockTransfer.fromBranch" : "stockTransfer.toBranch")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={branchSearch} onChange={(e) => setBranchSearch(e.target.value)} placeholder={t("purchaseOrders.searchPlaceholder")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
            {filteredBranches.map((d) => {
              const selected = picker === "from" ? fromBranch === d : toBranch === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => { if (picker === "from") setFromBranch(d); else setToBranch(d); setPicker(null); }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-2xl transition text-start",
                    selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "bg-muted/50",
                  )}
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">{d}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      <ConfirmMessageDrawer
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("stockTransfer.submitRequestTitle")}
        description={t("stockTransfer.submitRequestDesc")}
        confirmLabel={t("purchaseOrders.submit")}
        onConfirm={submit}
        cancelLabel={t("purchaseOrders.cancel")}
      />

      {/* ---------- Success ---------- */}
      <Drawer open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); navigate("/stock-transfer"); } }}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1 text-center">{t("stockTransfer.submitSuccessTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-2 text-center">{t("stockTransfer.submitSuccessDesc")}</p>
          </div>
          <button
            type="button"
            onClick={() => { setSuccessOpen(false); navigate("/stock-transfer"); }}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            {t("purchaseOrders.done")}
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default StockTransferForm;
