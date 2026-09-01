import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import ConfirmMessageDrawer from "@/components/ConfirmMessageDrawer";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, X as XIcon, Minus, Plus, Boxes, Smartphone, CreditCard, Router as RouterIcon, Check, QrCode, User } from "lucide-react";
import {
  PURCHASE_ORDER_PRODUCTS,
  DEMO_DESTINATIONS,
  DEMO_CHANNEL_MEMBERS,
  computeTotals,
  getSalesOrderMulti,
  updateSalesOrderMulti,
  addSalesOrderMulti,
  type ProductId,
  type ChannelMember,
} from "@/data/salesOrdersMultiStore";

// Same Create/Edit flow as the single-location Sales Orders form — Multiple Locations
// doesn't change anything about ordering itself, only how it's later fulfilled.
const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };

const SummaryRow = ({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className={cn("text-xs", bold ? "font-bold text-primary" : "text-muted-foreground")}>{label}</span>
    <span className={cn("text-xs", bold ? "font-bold text-primary" : "font-semibold text-foreground")}>{value}</span>
  </div>
);

const fakeScanMember = () => DEMO_CHANNEL_MEMBERS[Math.floor(Math.random() * DEMO_CHANNEL_MEMBERS.length)];

const SalesOrdersMultiForm = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const existing = isEdit ? getSalesOrderMulti(id!) : undefined;

  const [step, setStep] = useState<0 | 1>(isEdit ? 1 : 0);
  const [channelMember, setChannelMember] = useState<ChannelMember | null>(existing?.channelMember ?? null);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreview] = useState(() => Math.floor(100000000 + Math.random() * 900000000));

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

  useEffect(() => {
    if (isEdit && !existing) navigate("/sales-orders-multi", { replace: true });
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

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return DEMO_CHANNEL_MEMBERS;
    return DEMO_CHANNEL_MEMBERS.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [memberSearch]);

  const setQty = (id: ProductId, next: number) => setQtys((prev) => ({ ...prev, [id]: Math.max(0, Math.min(next, PURCHASE_ORDER_PRODUCTS.find((p) => p.id === id)!.availableStocks)) }));

  const backToList = () => navigate("/sales-orders-multi");

  const submit = () => {
    setConfirmOpen(false);
    const nonZeroLines = lines.filter((l) => l.qty > 0);
    if (isEdit && existing) {
      updateSalesOrderMulti(existing.id, { destination, lines: nonZeroLines.map((l) => ({ ...l, sources: [] })), ...computeTotals(lines) });
    } else if (channelMember) {
      addSalesOrderMulti(destination, channelMember, nonZeroLines);
    }
    setSuccessOpen(true);
  };

  const captureMember = () => {
    setChannelMember(fakeScanMember());
    setCameraOpen(false);
  };

  // ---------- Step 0: Channel Member ----------
  if (step === 0) {
    return (
      <div className="mobile-container min-h-screen bg-background pb-28">
        <AppHeader title={t("purchaseOrders.createOrderTitle")} showBack onBackClick={() => navigate(-1)} />

        <div className="px-4 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground px-1">{t("salesOrders.channelMember")}</p>
            {/* The trigger always stays — picking a member shows their card underneath it
                instead of swapping the field out for a different layout, and the QR
                fallback only makes sense before anything's picked. */}
            <button
              type="button"
              onClick={() => setMemberPickerOpen(true)}
              className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
            >
              <span className={channelMember ? "text-foreground font-medium" : "text-muted-foreground"}>{channelMember ? channelMember.name : t("salesOrders.selectChannelMember")}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </button>
            {channelMember ? (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-[0.5px] bg-primary/10 border-primary/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-card flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{channelMember.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t("salesOrders.dealerCode")}: {channelMember.code}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setChannelMember(null)} aria-label={t("purchaseOrders.removeFilter")} className="w-6 h-6 rounded-full bg-card flex items-center justify-center shrink-0">
                  <XIcon className="w-3.5 h-3.5 text-foreground" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{t("salesOrders.orTapToScan")}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="w-full rounded-2xl border-2 border-dashed border-border bg-card py-8 flex flex-col items-center gap-2"
                >
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">{t("salesOrders.tapToScanCard")}</p>
                  <span className="text-sm font-semibold text-primary flex items-center gap-1">{t("salesOrders.scanQr")} <Plus className="w-3.5 h-3.5" /></span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <button
            type="button"
            disabled={!channelMember}
            onClick={() => setStep(1)}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {t("salesOrders.continue")}
          </button>
        </div>

        {/* ---------- Channel member picker ---------- */}
        <Drawer open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
          <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
            <button onClick={() => setMemberPickerOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
              <XIcon className="w-4 h-4 text-foreground" />
            </button>
            <DrawerHeader className="text-center pt-8">
              <DrawerTitle className="text-lg font-semibold">{t("salesOrders.channelMember")}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder={t("purchaseOrders.searchPlaceholder")} className="h-11 bg-muted/40 rounded-xl ps-9" />
              </div>
            </div>
            <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
              {filteredMembers.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => { setChannelMember(m); setMemberPickerOpen(false); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card text-start"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                    <p className="text-[11px] text-muted-foreground">{m.code}</p>
                  </div>
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>

        {/* ---------- Fake camera viewfinder ---------- */}
        {cameraOpen && (
          <div className="fixed inset-0 z-50 mobile-container bg-slate-950 flex flex-col">
            <button onClick={() => setCameraOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center z-10">
              <XIcon className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium mb-8">{t("salesOrders.scanQr")}</span>
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
                  <QrCode className="w-24 h-24 text-white" strokeWidth={1} />
                  <p className="text-white font-mono text-lg tracking-wider">{cameraPreview}</p>
                </div>
              </div>
            </div>
            <div className="px-8 pb-10 pt-4">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setCameraOpen(false)} className="text-white text-sm font-medium">
                  {t("purchaseOrders.cancel")}
                </button>
                <button type="button" onClick={captureMember} aria-label={t("purchaseOrders.captureAria")} className="w-16 h-16 rounded-full bg-white border-4 border-white/30" />
                <span className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- Step 1: Destination + products ----------
  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t(isEdit ? "purchaseOrders.editOrderTitle" : "purchaseOrders.createOrderTitle")} showBack onBackClick={() => (isEdit ? navigate(-1) : setStep(0))} />

      <div className="px-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">{t("salesOrders.destination")}</p>
          <button
            type="button"
            onClick={() => setDestinationOpen(true)}
            className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
          >
            <span className={destination ? "text-foreground font-medium" : "text-muted-foreground"}>{destination || t("salesOrders.selectDestinations")}</span>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={qty <= 0}
                  onClick={() => setQty(p.id, qty - 1)}
                  aria-label={t("purchaseOrders.decreaseAria", { product: t(`purchaseOrders.product.${p.nameKey}`) })}
                  className="flex-1 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center text-sm font-bold text-foreground">{qty}</span>
                <button
                  type="button"
                  disabled={qty >= p.availableStocks}
                  onClick={() => setQty(p.id, qty + 1)}
                  aria-label={t("purchaseOrders.increaseAria", { product: t(`purchaseOrders.product.${p.nameKey}`) })}
                  className="flex-1 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center disabled:opacity-40"
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
        {isEdit ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => setConfirmOpen(true)}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
          >
            {t("purchaseOrders.save")}
          </button>
        ) : (
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
              {t("purchaseOrders.submitOrder")}
            </span>
            <span className="flex items-center gap-1">
              <RiyalSymbol /> {totals.total.toFixed(2)}
            </span>
          </button>
        )}
        {isEdit && (
          <button type="button" onClick={() => navigate(-1)} className="w-full mt-3 text-center text-sm font-semibold text-primary">
            {t("purchaseOrders.cancel")}
          </button>
        )}
      </div>

      {/* ---------- Destinations picker ---------- */}
      <Drawer open={destinationOpen} onOpenChange={setDestinationOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setDestinationOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("salesOrders.destinations")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={destinationSearch} onChange={(e) => setDestinationSearch(e.target.value)} placeholder={t("salesOrders.searchByDestination")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
            {filteredDestinations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDestination(d); setDestinationOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition text-start",
                  destination === d ? "border-[0.5px] bg-primary/10 border-primary/20" : "border-border bg-card",
                )}
              >
                <span className="text-sm font-medium text-foreground">{d}</span>
                {destination === d && <Check className="w-4 h-4 text-primary shrink-0" />}
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
      <Drawer open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); backToList(); } }}>
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
          <button type="button" onClick={() => { setSuccessOpen(false); backToList(); }} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            {t("purchaseOrders.done")}
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SalesOrdersMultiForm;
