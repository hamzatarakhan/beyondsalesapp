import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { expandSerialRange, offsetSerial, remarkError, serialError, serialRangeError } from "@/lib/stockReturnValidation";
import { PRODUCT_ICON } from "@/data/stockProductVisuals";
import { cn } from "@/lib/utils";
import { Boxes, ScanBarcode, ChevronDown, Trash2, X } from "lucide-react";
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

  const [serialFeedback, setSerialFeedback] = useState<ReturnType<typeof serialError> | ReturnType<typeof serialRangeError>>();
  const [remarkErrorShown, setRemarkErrorShown] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("range");
  // There is no quantity stepper: the return quantity is simply how many serials are scanned.
  // Range Scan takes ONE First/Last pair through the single input: Add saves the First Serial
  // Number (rangeFirst, shown below the input), the same input then asks for the Last, and that
  // Add saves the range — after which Range Scan is locked until the range is deleted. Item By
  // Item Scan adds single serials and stays open until the available stock is reached.
  const [serial, setSerial] = useState("");
  const [rangeFirst, setRangeFirst] = useState<string | null>(null);
  const [range, setRange] = useState<{ first: string; last: string } | null>(saved?.range ?? null);
  const [itemSerials, setItemSerials] = useState<string[]>(() => {
    if (!saved) return [];
    const inRange = new Set(saved.range ? expandSerialRange(saved.range.first, saved.range.last) : []);
    return saved.serials.filter((s) => !inRange.has(s));
  });
  const [reason, setReason] = useState<ReturnReasonKey>(saved?.reason ?? "damagedSim");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [remark, setRemark] = useState(saved?.remark ?? "");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const rangeSerials = useMemo(() => (range ? expandSerialRange(range.first, range.last) : []), [range]);
  const serials = useMemo(() => [...rangeSerials, ...itemSerials], [rangeSerials, itemSerials]);

  // What the page started from (the saved product, or a blank one) — anything different is unsaved.
  const [initial] = useState(() => JSON.stringify({ range, itemSerials, reason, remark }));
  const dirty = JSON.stringify({ range, itemSerials, reason, remark }) !== initial;

  // Newest first for display; itemSerials keeps insertion order.
  const recentItems = useMemo(() => [...itemSerials].reverse().slice(0, 5), [itemSerials]);

  const removeItem = (value: string) => {
    setItemSerials((prev) => prev.filter((s) => s !== value));
    setSerialFeedback(undefined);
  };
  // Deleting the saved range resets Range Scan to First Serial Number and re-enables it.
  const removeRange = () => {
    setRange(null);
    setRangeFirst(null);
    setSerialFeedback(undefined);
  };

  const Icon = product ? PRODUCT_ICON[product.id] : Boxes;
  const productName = product ? t(`purchaseOrders.product.${product.nameKey}`) : "";
  const available = product?.availableStocks ?? 0;

  useEffect(() => {
    if (!product) navigate("/stock-returns/new", { replace: true });
  }, [product, navigate]);

  const stockFull = serials.length >= available;
  const inputLocked = scanMode === "range" ? !!range || stockFull : stockFull;

  const addSerial = () => {
    const v = serial.trim();
    if (scanMode === "range" && rangeFirst) {
      const error = serialRangeError(rangeFirst, v, serials, available);
      setSerialFeedback(error);
      if (error) return;
      setRange({ first: rangeFirst, last: v });
      setRangeFirst(null);
      setSerial("");
      return;
    }
    const error = serialError(v, serials, available);
    setSerialFeedback(error);
    if (error) return;
    if (scanMode === "range") setRangeFirst(v);
    else setItemSerials((prev) => [...prev, v]);
    setSerial("");
  };

  // Prototype scan button: the next demo serial, or for a range's last serial one that makes
  // a 5-serial range.
  const scanValue = () => (rangeFirst ? offsetSerial(rangeFirst, 4) : `SN-${product?.id.toUpperCase()}-${3000 + serials.length}`);

  const remarkFeedback = remarkError(reason, remark);
  const canSubmit = serials.length > 0 && !!reason;

  const submit = () => {
    if (!product || !canSubmit) return;
    setRemarkErrorShown(!!remarkFeedback);
    if (remarkFeedback) return;
    saveDraftItem({ productId: product.id, qty: serials.length, serials, range: range ?? undefined, reason, remark });
    navigate("/stock-returns/new");
  };

  const back = () => (dirty ? setDiscardOpen(true) : navigate("/stock-returns/new"));

  const rangeRow = range && (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-3">
      <span className="text-sm font-medium text-foreground min-w-0 truncate" dir="ltr">#{range.first} – #{range.last}</span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{t("stockReturn.scannedTotal", { count: rangeSerials.length })}</span>
        <button type="button" onClick={removeRange} aria-label={t("stockReturn.removeRangeAria")} className="text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </span>
    </div>
  );

  if (!product) {
    return null;
  }

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={productName} showBack onBackClick={back} />

      <div className="px-4 space-y-4">
        {/* Product card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
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
        </div>

        {/* Member / scan card */}
        <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-foreground">{t("stockReturn.serialNumberTitle")}</p>
            <span className="px-2.5 py-1 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">{t("stockReturn.scannedTotal", { count: serials.length })}</span>
          </div>

          <div className="flex border-b border-border">
            {(["range", "item"] as ScanMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { setScanMode(mode); setRangeFirst(null); setSerialFeedback(undefined); }}
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
                disabled={inputLocked}
                aria-invalid={!!serialFeedback}
                aria-describedby={serialFeedback ? "stock-return-serial-error" : undefined}
                placeholder={t(scanMode === "item" ? "stockReturn.serialNumber" : rangeFirst ? "stockReturn.lastSerial" : "stockReturn.firstSerial")}
                className={cn("h-11 bg-card rounded-xl pe-10", serialFeedback && "border-destructive")}
              />
              <button
                type="button"
                aria-label={t("stockReturn.scanAria")}
                disabled={inputLocked}
                onClick={() => { setSerial(scanValue()); setSerialFeedback(undefined); }}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-primary disabled:opacity-40"
              >
                <ScanBarcode className="w-5 h-5" />
              </button>
            </div>
            <Button
              type="button"
              onClick={addSerial}
              disabled={inputLocked || !serial.trim()}
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
          {scanMode === "range" && rangeFirst && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-3">
              <span className="text-sm text-muted-foreground">
                {t("stockReturn.firstSerial")}: <span className="font-medium text-foreground" dir="ltr">#{rangeFirst}</span>
              </span>
              <button type="button" onClick={() => setRangeFirst(null)} aria-label={t("stockReturn.removeSerialAria")} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {serials.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{t("stockReturn.recentlyScanned")}</p>
              {rangeRow}
              {recentItems.map((s) => (
                <div key={s} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-3">
                  <span className="text-sm font-medium text-foreground" dir="ltr">#{s}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(s)}
                    aria-label={t("stockReturn.removeSerialAria")}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {itemSerials.length > 5 && (
                <button
                  type="button"
                  onClick={() => setViewAllOpen(true)}
                  className="w-full text-center text-sm font-semibold text-primary py-1"
                >
                  {t("stockReturn.viewAll", { count: itemSerials.length })}
                </button>
              )}
            </div>
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
            {rangeRow}
            {[...itemSerials].reverse().map((s) => (
              <div key={s} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 border border-border/50 px-3.5 py-3">
                <span className="text-sm font-medium text-foreground" dir="ltr">#{s}</span>
                <button
                  type="button"
                  onClick={() => removeItem(s)}
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
