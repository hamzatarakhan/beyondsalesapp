import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { quantityError, serialCountError, serialError } from "@/lib/stockReturnValidation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { cn } from "@/lib/utils";
import { Minus, Plus, Boxes, ScanBarcode, ChevronDown, CheckCircle2 } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, RETURN_REASONS, addStockReturn, type ProductId, type ReturnReasonKey } from "@/data/stockReturnStore";

type ScanMode = "range" | "item";

const StockReturnForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: ProductId }>();
  const product = PURCHASE_ORDER_PRODUCTS.find((p) => p.id === productId);

  const [qty, setQty] = useState(0);
  const [qtyInput, setQtyInput] = useState("");
  const [qtyTouched, setQtyTouched] = useState(false);
  const [serialFeedback, setSerialFeedback] = useState<ReturnType<typeof serialError>>();
  const [countErrorShown, setCountErrorShown] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const failureToast = useRef<ReturnType<typeof toast>>();
  const [scanMode, setScanMode] = useState<ScanMode>("range");
  const [serial, setSerial] = useState("");
  const [serials, setSerials] = useState<string[]>([]);
  const [reason, setReason] = useState<ReturnReasonKey>("damagedSim");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

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
    // Prototype: each added serial counts toward the returned quantity, but never
    // raises a quantity the dealer already entered.
    setQtyClamped(Math.max(qty, serials.length + 1));
  };

  const canSubmit = !qtyFeedback && qty > 0 && !!reason && !submitted;

  const submit = () => {
    if (!product || !canSubmit) return;
    if (countFeedback) {
      setCountErrorShown(true);
      return;
    }
    setCountErrorShown(false);
    failureToast.current?.dismiss();
    try {
      addStockReturn([{ productId: product.id, qty, serials, reason: t(`stockReturn.reasons.${reason}`), remark: remark.trim() || undefined }]);
      setSubmitted(true);
      setSuccessOpen(true);
    } catch {
      failureToast.current = toast({ title: t("stockReturn.errors.submitTitle"), description: t("stockReturn.errors.submitRetry"), variant: "destructive" });
    }
  };

  const scannedLabel = useMemo(() => t("stockReturn.scannedCount", { scanned: serials.length, total: qty }), [serials.length, qty, t]);

  if (!product) {
    return null;
  }

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={productName} showBack onBackClick={() => navigate("/stock-returns/new")} />

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
            <p className="text-sm font-bold text-foreground">{t("stockReturn.memberName")}</p>
            <span className="px-2.5 py-1 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{scannedLabel}</span>
          </div>

          <div className="flex border-b border-border">
            {(["range", "item"] as ScanMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setScanMode(mode)}
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
                placeholder={t(scanMode === "range" ? "stockReturn.firstSerial" : "stockReturn.serialNumber")}
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
            <div className="flex items-center gap-1.5 flex-wrap">
              {serials.map((s, i) => (
                <span key={`${s}-${i}`} className="px-2.5 py-1 rounded-full bg-muted/70 border border-border/60 text-[11px] font-medium text-muted-foreground">
                  {s}
                </span>
              ))}
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
                    onClick={() => { setReason(r); setReasonOpen(false); }}
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
          <p className="text-sm font-medium text-foreground px-1">{t("stockReturn.reasonRemark")}</p>
          <Textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder={t("stockReturn.reasonRemarkPlaceholder")}
            className="min-h-[110px] bg-card rounded-xl resize-none"
          />
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

      {/* Success dialog */}
      <Dialog open={successOpen} onOpenChange={(open) => { setSuccessOpen(open); if (!open && submitted) navigate("/stock-returns"); }}>
        <DialogContent className="max-w-[320px] rounded-2xl text-center">
          <div className="flex flex-col items-center gap-3 py-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="text-base font-bold text-foreground">{t("stockReturn.successTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("stockReturn.successMessage")}</p>
            <button
              type="button"
              onClick={() => { setSuccessOpen(false); navigate("/stock-returns"); }}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm mt-1"
            >
              {t("stockReturn.goToList")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockReturnForm;
