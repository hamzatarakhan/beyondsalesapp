import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { quantityError, remarkError, serialCountError, serialError } from "@/lib/stockReturnValidation";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { cn } from "@/lib/utils";
import { Minus, Plus, Boxes, ScanBarcode, ChevronDown, Trash2, X } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, RETURN_REASONS, getDraftItem, saveDraftItem, type ProductId, type ReturnReasonKey } from "@/data/stockReturnStore";

type ScanMode = "range" | "item";

// One product's return details inside a multi-product Stock Return order. Submit here only
// saves this product into the order draft and goes back to the product list (Submit Order
// there sends the whole order). Opened via Edit, it starts from the last saved version, and
// leaving with unsaved changes asks first so that saved version is never lost by accident.
const StockReturnForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: ProductId }>();
  const product = PURCHASE_ORDER_PRODUCTS.find((p) => p.id === productId);
  const [saved] = useState(() => (productId ? getDraftItem(productId) : undefined));

  const [qty, setQty] = useState(saved?.qty ?? 0);
  const [qtyInput, setQtyInput] = useState(saved?.qty ? String(saved.qty) : "");
  const [qtyTouched, setQtyTouched] = useState(false);
  const [serialFeedback, setSerialFeedback] = useState<ReturnType<typeof serialError>>();
  const [countErrorShown, setCountErrorShown] = useState(false);
  const [remarkErrorShown, setRemarkErrorShown] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("range");
  // Range Scan takes serials in first/last pairs: after a first serial is added, the input
  // asks for the last one, then goes back to asking for the next range's first serial.
  const [awaitingLast, setAwaitingLast] = useState(false);
  const [serial, setSerial] = useState("");
  const [serials, setSerials] = useState<string[]>(saved?.serials ?? []);
  const [reason, setReason] = useState<ReturnReasonKey>(saved?.reason ?? "damagedSim");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [remark, setRemark] = useState(saved?.remark ?? "");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  // What the page started from (the saved product, or a blank one) — anything different is unsaved.
  const [initial] = useState(() => JSON.stringify({ qty, serials, reason, remark }));
  const dirty = JSON.stringify({ qty, serials, reason, remark }) !== initial;

  // Newest first for display; serials state keeps insertion order.
  const recentSerials = useMemo(() => [...serials].reverse().slice(0, 5), [serials]);

  const removeSerial = (value: string) => {
    setSerials((prev) => prev.filter((s) => s !== value));
    setCountErrorShown(false);
  };

  const Icon = product ? PRODUCT_ICON[product.id] : Boxes;
  const productName = product ? t(`purchaseOrders.product.${product.nameKey}`) : "";
  const qtyFeedback = quantityError(qtyInput, product?.availableStocks ?? 0, serials.length);
  const countFeedback = serialCountError(serials.length, qty);

  useEffect(() => {
    if (!product) navigate("/stock-returns/new", { replace: true });
  }, [product, navigate]);

  const setQtyClamped = (next: number) => {
    if (!product) return;
    const value = Math.max(serials.length, Math.min(next, product.availableStocks));
    setQty(value);
    setQtyInput(value ? String(value) : "");
    setQtyTouched(false);
    setCountErrorShown(false);
  };

  const addSerial = () => {
    const v = serial.trim();
    const error = serialError(v, serials, product?.availableStocks ?? 0);
    setSerialFeedback(error);
    if (error) return;
    setSerials((prev) => [...prev, v]);
    setSerial("");
    if (scanMode === "range") setAwaitingLast((a) => !a);
    // Prototype: each added serial counts toward the returned quantity, but never
    // raises a quantity the dealer already entered.
    setQtyClamped(Math.max(qty, serials.length + 1));
  };

  const remarkFeedback = remarkError(reason, remark);
  const canSubmit = !qtyFeedback && qty > 0 && !!reason;

  const submit = () => {
    if (!product || !canSubmit) return;
    setCountErrorShown(!!countFeedback);
    setRemarkErrorShown(!!remarkFeedback);
    if (countFeedback || remarkFeedback) return;
    saveDraftItem({ productId: product.id, qty, serials, reason, remark });
    navigate("/stock-returns/new");
  };

  const back = () => (dirty ? setDiscardOpen(true) : navigate("/stock-returns/new"));

  const scannedLabel = useMemo(() => t("stockReturn.scannedCount", { scanned: serials.length, total: qty }), [serials.length, qty, t]);

  if (!product) {
    return null;
  }

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={productName} showBack onBackClick={back} />

      <div className="px-4 space-y-4">
        {/* Product card with quantity stepper */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{productName}</p>
              <p className="text-[11px] text-primary font-semibold flex items-center gap-1">
                <Boxes className="w-3 h-3" /> {t("purchaseOrders.availableStocks", { count: product.availableStocks })}
              </p>
            </div>
          </div>
          <div className="flex items-center h-11 rounded-full bg-card border border-border overflow-hidden">
            <button
              type="button"
              disabled={qty <= serials.length}
              onClick={() => setQtyClamped(qty - 1)}
              aria-label={t("purchaseOrders.decreaseAria", { product: productName })}
              className="flex-1 h-full flex items-center justify-center text-primary bg-primary/10 disabled:opacity-40"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={qtyInput}
              onChange={(e) => {
                setQtyInput(e.target.value);
                setQty(/^\d+$/.test(e.target.value) ? Number(e.target.value) : 0);
                setCountErrorShown(false);
              }}
              onBlur={() => setQtyTouched(true)}
              aria-invalid={qtyTouched && !!qtyFeedback}
              aria-describedby={qtyTouched && qtyFeedback ? "stock-return-qty-error" : undefined}
              placeholder="0"
              aria-label={productName}
              className="flex-1 h-full bg-card text-center text-sm font-bold text-foreground outline-none"
            />
            <button
              type="button"
              disabled={qty >= product.availableStocks}
              onClick={() => setQtyClamped(qty + 1)}
              aria-label={t("purchaseOrders.increaseAria", { product: productName })}
              className="flex-1 h-full flex items-center justify-center text-primary bg-primary/10 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {qtyTouched && qtyFeedback && (
            <p id="stock-return-qty-error" role="alert" className="text-xs text-destructive px-1">
              {t(`stockReturn.errors.${qtyFeedback}`, { count: product.availableStocks })}
            </p>
          )}
        </div>

        {/* Member / scan card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">{t("stockReturn.serialNumberTitle")}</p>
            <span className="px-2.5 py-1 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{scannedLabel}</span>
          </div>

          <div className="flex border-b border-border">
            {(["range", "item"] as ScanMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setScanMode(mode); setAwaitingLast(false); }}
                className={cn(
                  "flex-1 pb-2 text-sm font-medium transition-colors",
                  scanMode === mode ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground"
                )}
              >
                {t(mode === "range" ? "stockReturn.rangeScan" : "stockReturn.itemScan")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={serial}
                onChange={(e) => { setSerial(e.target.value); setSerialFeedback(undefined); }}
                aria-invalid={!!serialFeedback}
                aria-describedby={serialFeedback ? "stock-return-serial-error" : undefined}
                placeholder={t(scanMode === "item" ? "stockReturn.serialNumber" : awaitingLast ? "stockReturn.lastSerial" : "stockReturn.firstSerial")}
                className={cn("h-11 bg-card rounded-xl pe-10", serialFeedback && "border-destructive")}
              />
              <button
                type="button"
                aria-label={t("stockReturn.scanAria")}
                onClick={() => { setSerial(`SN-${product.id.toUpperCase()}-${3000 + serials.length}`); setSerialFeedback(undefined); }}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-primary"
              >
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>
            <Button
              type="button"
              onClick={addSerial}
              disabled={!serial.trim()}
              className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40"
            >
              {t("stockReturn.add")}
            </Button>
          </div>
          {serialFeedback && (
            <p id="stock-return-serial-error" role="alert" className="text-xs text-destructive">
              {t(`stockReturn.errors.${serialFeedback}`, { count: product.availableStocks })}
            </p>
          )}

          {serials.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("stockReturn.recentlyScanned")}</p>
              {recentSerials.map((s) => (
                <div key={s} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-3">
                  <span className="text-sm font-medium text-foreground" dir="ltr">#{s}</span>
                  <button
                    type="button"
                    onClick={() => removeSerial(s)}
                    aria-label={t("stockReturn.removeSerialAria")}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {serials.length > 5 && (
                <button
                  type="button"
                  onClick={() => setViewAllOpen(true)}
                  className="w-full text-center text-sm font-semibold text-primary py-1"
                >
                  {t("stockReturn.viewAll", { count: serials.length })}
                </button>
              )}
            </div>
          )}
          {countErrorShown && countFeedback && (
            <p id="stock-return-count-error" role="alert" className="text-xs text-destructive">
              {t("stockReturn.errors.serialsShort", { added: serials.length, required: qty, remaining: qty - serials.length })}
            </p>
          )}
        </div>

        {/* Reason */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">
            {t("stockReturn.reasonForReturn")} <span className="text-destructive">*</span>
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setReasonOpen((v) => !v)}
              className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
            >
              <span className="text-foreground font-medium">{t(`stockReturn.reasons.${reason}`)}</span>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", reasonOpen && "rotate-180")} />
            </button>
            {reasonOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-xl bg-card border border-border shadow-lg overflow-hidden">
                {RETURN_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setReason(r); setReasonOpen(false); setRemarkErrorShown(false); }}
                    className={cn("w-full text-start px-3.5 py-2.5 text-sm", r === reason ? "bg-primary/10 text-primary font-semibold" : "text-foreground")}
                  >
                    {t(`stockReturn.reasons.${r}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Remark */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">
            {t("stockReturn.reasonRemark")} {reason === "others" && <span className="text-destructive">*</span>}
          </p>
          <Textarea
            value={remark}
            onChange={(e) => { setRemark(e.target.value); setRemarkErrorShown(false); }}
            placeholder={t("stockReturn.reasonRemarkPlaceholder")}
            aria-required={reason === "others"}
            aria-invalid={remarkErrorShown && !!remarkFeedback}
            aria-describedby={remarkErrorShown && remarkFeedback ? "stock-return-remark-error" : undefined}
            className={cn("min-h-[110px] bg-card rounded-xl resize-none", remarkErrorShown && remarkFeedback && "border-destructive")}
          />
          {remarkErrorShown && remarkFeedback && (
            <p id="stock-return-remark-error" role="alert" className="text-xs text-destructive px-1">
              {t("stockReturn.errors.remarkRequired")}
            </p>
          )}
        </div>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border/60 px-4 py-3">
        <div className="mx-auto max-w-[430px]">
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
          >
            {t("stockReturn.submit")}
          </Button>
        </div>
      </div>

      {/* View All serials bottom sheet */}
      <Drawer open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2 max-h-[92vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-7" />
            <h3 className="font-semibold text-foreground text-base">{t("stockReturn.allSerialsTitle")}</h3>
            <button
              onClick={() => setViewAllOpen(false)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
              aria-label={t("activation.success.close")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 -mx-1 px-1">
            {[...serials].reverse().map((s) => (
              <div key={s} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-3">
                <span className="text-sm font-medium text-foreground" dir="ltr">#{s}</span>
                <button
                  type="button"
                  onClick={() => removeSerial(s)}
                  aria-label={t("stockReturn.removeSerialAria")}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Leaving with unsaved changes */}
      <ConfirmMessageDrawer
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title={t("stockReturn.discardTitle")}
        description={t("stockReturn.discardDesc")}
        confirmLabel={t("stockReturn.continueEditing")}
        onConfirm={() => setDiscardOpen(false)}
        cancelLabel={t("stockReturn.discardChanges")}
        onCancel={() => { setDiscardOpen(false); navigate("/stock-returns/new"); }}
      />
    </div>
  );
};

export default StockReturnForm;
