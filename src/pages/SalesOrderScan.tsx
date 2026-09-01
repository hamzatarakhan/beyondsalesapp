import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ScanLine, Camera, X as XIcon } from "lucide-react";
import { getSalesOrder, updateSalesOrder, PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/salesOrdersStore";

// Identical fake-capture convention to PurchaseOrderScan.tsx — no real camera access.
const fakeSerial = () => `SN-${Math.floor(100000000 + Math.random() * 900000000)}`;

type CameraTarget = { kind: "start" } | { kind: "last" } | { kind: "item"; index: number };

const SalesOrderScan = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id, productId } = useParams<{ id: string; productId: ProductId }>();
  const order = id ? getSalesOrder(id) : undefined;
  const line = order?.lines.find((l) => l.productId === productId);
  const product = PURCHASE_ORDER_PRODUCTS.find((p) => p.id === productId);

  const [mode, setMode] = useState<"range" | "item">("range");
  const [startRange, setStartRange] = useState("");
  const [lastNumber, setLastNumber] = useState("");

  const remaining = line ? Math.max(0, line.qty - line.scanned) : 0;
  const itemSlots = Math.min(remaining, 5);
  const [itemSerials, setItemSerials] = useState<string[]>(() => Array(itemSlots).fill(""));

  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
  const [cameraPreview] = useState(() => Math.floor(100000000 + Math.random() * 900000000));

  const setItemSerial = (i: number, v: string) => setItemSerials((prev) => prev.map((s, idx) => (idx === i ? v : s)));

  const hint = useMemo(() => {
    if (!cameraTarget) return "";
    if (cameraTarget.kind === "start") return t("purchaseOrders.scanHintFirst");
    if (cameraTarget.kind === "last") return t("purchaseOrders.scanHintLast");
    return t("purchaseOrders.scanHintItem", { n: cameraTarget.index + 1 });
  }, [cameraTarget, t]);

  const capture = () => {
    const serial = fakeSerial();
    if (cameraTarget?.kind === "start") setStartRange(serial);
    else if (cameraTarget?.kind === "last") setLastNumber(serial);
    else if (cameraTarget?.kind === "item") setItemSerial(cameraTarget.index, serial);
    setCameraTarget(null);
  };

  const canSubmit = mode === "range" ? !!startRange && !!lastNumber : itemSerials.some((s) => s.trim());

  const submit = () => {
    if (!order || !line || !productId) return;
    let newSerials: string[] = [];
    if (mode === "range") {
      newSerials = Array.from({ length: remaining }, () => fakeSerial());
    } else {
      newSerials = itemSerials.filter((s) => s.trim());
    }
    const mergedSerials = [...line.serials, ...newSerials].slice(0, line.qty);
    updateSalesOrder(order.id, {
      // Scanning can start straight from Awaiting Delivery (no separate "mark received"
      // step) — the first scan is what actually moves the order into Awaiting Scanning.
      status: order.status === "awaitingDelivery" ? "awaitingScanning" : order.status,
      lines: order.lines.map((l) => (l.productId === productId ? { ...l, serials: mergedSerials, scanned: mergedSerials.length } : l)),
    });
    navigate(`/sales-orders/${order.id}`);
  };

  if (!order || !line || !product) {
    return (
      <div className="mobile-container min-h-screen bg-background">
        <AppHeader title={t("purchaseOrders.scanIdTitle")} showBack />
        <p className="text-center text-sm text-muted-foreground py-16">{t("salesOrders.noOrders")}</p>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t("purchaseOrders.scanIdTitle")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        <div className="flex items-center gap-6 border-b border-border">
          {(["range", "item"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                mode === m ? "border-primary text-primary" : "border-transparent text-muted-foreground",
              )}
            >
              {t(m === "range" ? "purchaseOrders.rangeScan" : "purchaseOrders.itemByItemScan")}
            </button>
          ))}
        </div>

        {mode === "range" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("purchaseOrders.startRange")}</p>
              <div className="relative">
                <Input value={startRange} onChange={(e) => setStartRange(e.target.value)} placeholder={t("purchaseOrders.enterSerial")} className="h-11 rounded-xl pe-11" />
                <button type="button" onClick={() => setCameraTarget({ kind: "start" })} aria-label={t("purchaseOrders.scanAria")} className="absolute end-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("purchaseOrders.lastNumber")}</p>
              <div className="relative">
                <Input value={lastNumber} onChange={(e) => setLastNumber(e.target.value)} placeholder={t("purchaseOrders.enterSerial")} className="h-11 rounded-xl pe-11" />
                <button type="button" onClick={() => setCameraTarget({ kind: "last" })} aria-label={t("purchaseOrders.scanAria")} className="absolute end-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ScanLine className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {itemSerials.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">{t("purchaseOrders.itemN", { n: i + 1 })}</p>
                <div className="relative">
                  <Input value={s} onChange={(e) => setItemSerial(i, e.target.value)} placeholder={t("purchaseOrders.enterSerial")} className="h-11 rounded-xl pe-11" />
                  <button type="button" onClick={() => setCameraTarget({ kind: "item", index: i })} aria-label={t("purchaseOrders.scanAria")} className="absolute end-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ScanLine className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned to the bottom of the screen, matching every other flow's action bar. */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3 space-y-3">
        <button type="button" disabled={!canSubmit} onClick={submit} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {t("purchaseOrders.submit")}
        </button>
        <button type="button" onClick={() => setCameraTarget(mode === "range" ? { kind: "start" } : { kind: "item", index: 0 })} className="w-full text-center text-sm font-semibold text-primary">
          {t("purchaseOrders.scan")}
        </button>
      </div>

      {/* ---------- Fake camera viewfinder ---------- */}
      {cameraTarget && (
        <div className="fixed inset-0 z-50 mobile-container bg-slate-950 flex flex-col">
          <button onClick={() => setCameraTarget(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium mb-8">{hint}</span>
            <div className="relative w-full max-w-[260px] aspect-square">
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => (
                <span
                  key={corner}
                  className={cn(
                    "absolute w-8 h-8 border-emerald-400",
                    corner === "top-left" && "top-0 start-0 border-t-4 border-s-4 rounded-tl-lg",
                    corner === "top-right" && "top-0 end-0 border-t-4 border-e-4 rounded-tr-lg",
                    corner === "bottom-left" && "bottom-0 start-0 border-b-4 border-s-4 rounded-bl-lg",
                    corner === "bottom-right" && "bottom-0 end-0 border-b-4 border-e-4 rounded-br-lg",
                  )}
                />
              ))}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="flex items-end gap-[3px] h-16">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span key={i} className="bg-white" style={{ width: (i % 3) + 1, height: `${40 + ((i * 37) % 60)}%` }} />
                  ))}
                </div>
                <p className="text-white font-mono text-lg tracking-wider">{cameraPreview}</p>
              </div>
            </div>
          </div>
          <div className="px-8 pb-10 pt-4">
            <p className="text-center text-amber-400 text-xs font-semibold mb-4 tracking-wide">{t("purchaseOrders.photo")}</p>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setCameraTarget(null)} className="text-white text-sm font-medium">
                {t("purchaseOrders.cancel")}
              </button>
              <button type="button" onClick={capture} aria-label={t("purchaseOrders.captureAria")} className="w-16 h-16 rounded-full bg-white border-4 border-white/30" />
              <Camera className="w-6 h-6 text-white/70" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrderScan;
