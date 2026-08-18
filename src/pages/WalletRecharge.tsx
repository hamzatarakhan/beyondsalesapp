import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PayOption from "@/components/activation/PayOption";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import { DEALER_WALLET_BALANCE } from "@/pages/NewActivation";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Ticket,
  CreditCard,
  Wallet,
  Info,
  AlertCircle,
  Check,
  XCircle,
  Plus,
  Trash2,
} from "lucide-react";

// ---------- Local UI primitives (mirrors CreditLimitAdjustment.tsx) ----------
const CardSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Wallet;
  children: React.ReactNode;
}) => (
  <section className="bg-card rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    {children}
  </section>
);

// Real Apple/Google marks (as small inline SVGs) instead of a generic icon-font stand-in,
// so the payment rows read correctly rather than approximating the brand.
const AppleMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden="true">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const GoogleMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.7-5.3l-6.3-5.3C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.5 16.3 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C39.9 37.1 44 31.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
  </svg>
);

const RadioDot = ({ selected }: { selected: boolean }) => (
  <div
    className={cn(
      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
      selected ? "border-primary" : "border-muted-foreground/40"
    )}
  >
    {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
  </div>
);

const SWIPE_DELETE_WIDTH = 84;

// Drag the row left with a finger/mouse to reveal a Delete panel behind it — tap without
// dragging selects the row, tap while revealed closes it back.
const SwipeableCardRow = ({
  isOpen,
  onOpenChange,
  onSelect,
  onDelete,
  deleteLabel,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: () => void;
  onDelete: () => void;
  deleteLabel: string;
  children: React.ReactNode;
}) => {
  const [dragX, setDragX] = useState(isOpen ? -SWIPE_DELETE_WIDTH : 0);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);

  useEffect(() => {
    setDragX(isOpen ? -SWIPE_DELETE_WIDTH : 0);
  }, [isOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
    dragging.current = true;
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || startX.current == null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 4) moved.current = true;
    const base = isOpen ? -SWIPE_DELETE_WIDTH : 0;
    setDragX(Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, base + delta)));
  };
  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!moved.current) {
      if (isOpen) onOpenChange(false);
      else onSelect();
      setDragX(isOpen ? -SWIPE_DELETE_WIDTH : 0);
      return;
    }
    const shouldOpen = dragX < -SWIPE_DELETE_WIDTH / 2;
    onOpenChange(shouldOpen);
    setDragX(shouldOpen ? -SWIPE_DELETE_WIDTH : 0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 bg-destructive text-destructive-foreground"
        style={{ width: SWIPE_DELETE_WIDTH }}
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-[10px] font-semibold">{deleteLabel}</span>
      </button>
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
        style={{ transform: `translateX(${dragX}px)`, touchAction: "pan-y" }}
        className="relative bg-background rounded-xl transition-transform duration-150 ease-out"
      >
        {children}
      </div>
    </div>
  );
};

// ---------- Demo data ----------
const DEALER_MSISDN = "0555123456";
const CARD_AMOUNTS = [50, 100, 150, 250, 350, 500];
const SAVED_CARD_ID = "saved-1";
const SAVED_CARD = { id: SAVED_CARD_ID, brand: "Visa", last4: "4242", expiry: "12/27", holder: "Ahmed Mohammed" };
// Any other 14-digit code "succeeds" in this prototype — this one demos the rejected case.
const INVALID_VOUCHER_CODE = "00000000000000";
// Physical/digital vouchers are fixed-denomination — this prototype only has one valid
// demo code, so it's pinned to a single realistic amount rather than a made-up 0.
const VOUCHER_AMOUNT = 100;

type Method = "voucher" | "card";
type CardEntry = { id: string; brand: string; last4: string; expiry: string; holder: string };

const WalletRecharge = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [method, setMethod] = useState<Method>("voucher");

  // ---------- Voucher ----------
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const onVoucherChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 14);
    setVoucherCode(digits);
    setVoucherError(null);
    if (digits.length === 14) {
      setVoucherChecking(true);
      setTimeout(() => {
        setVoucherChecking(false);
        if (digits === INVALID_VOUCHER_CODE) setVoucherError(t("walletRecharge.voucherErrorInvalid"));
      }, 800);
    }
  };
  const voucherValid = voucherCode.length === 14 && !voucherError && !voucherChecking;

  // ---------- Card ----------
  const [cardAmount, setCardAmount] = useState<number | null>(null);
  const [cardView, setCardView] = useState<"list" | "addNew">("list");
  const [cards, setCards] = useState<CardEntry[]>([SAVED_CARD]);
  const [paymentMethod, setPaymentMethod] = useState<"applepay" | "googlepay" | string | null>(null);
  const [swipedCardId, setSwipedCardId] = useState<string | null>(null);
  const [savedCardCvv, setSavedCardCvv] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");
  const [newCardHolder, setNewCardHolder] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(true);

  const selectedCard = cards.find((c) => c.id === paymentMethod);
  const cardValid =
    cardAmount != null &&
    (paymentMethod === "applepay" || paymentMethod === "googlepay"
      ? true
      : paymentMethod === SAVED_CARD_ID
      ? savedCardCvv.length === 3
      : !!selectedCard);

  const newCardValid =
    newCardNumber.replace(/\s/g, "").length === 16 &&
    /^\d{2}\/\d{2}$/.test(newCardExpiry) &&
    newCardCvv.length === 3 &&
    newCardHolder.trim().length > 0;

  const addNewCard = () => {
    const id = `new-${Date.now()}`;
    setCards((prev) => [...prev, { id, brand: "Visa", last4: newCardNumber.replace(/\s/g, "").slice(-4), expiry: newCardExpiry, holder: newCardHolder }]);
    setPaymentMethod(id);
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCvv("");
    setNewCardHolder("");
    setCardView("list");
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setPaymentMethod((prev) => (prev === id ? null : prev));
    setSwipedCardId((prev) => (prev === id ? null : prev));
  };

  const selectCard = (id: string) => {
    setPaymentMethod(id);
    setSwipedCardId(null);
  };

  // ---------- Result ----------
  const [processing, setProcessing] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  const resolveRecharge = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const ok = Math.random() < 0.85;
      if (ok) {
        setOrderId(`WR-${Math.floor(100000 + Math.random() * 900000)}`);
        setSuccessOpen(true);
      } else {
        setFailureOpen(true);
      }
    }, 900);
  };

  const rechargeAmount = method === "voucher" ? VOUCHER_AMOUNT : cardAmount;
  const canSubmit = method === "voucher" ? voucherValid : cardValid;

  const resetAll = () => {
    setMethod("voucher");
    setVoucherCode("");
    setVoucherError(null);
    setCardAmount(null);
    setCardView("list");
    setCards([SAVED_CARD]);
    setPaymentMethod(null);
    setSwipedCardId(null);
    setSavedCardCvv("");
    setNewCardNumber("");
    setNewCardExpiry("");
    setNewCardCvv("");
    setNewCardHolder("");
  };

  if (method === "card" && cardView === "addNew") {
    return (
      <div className="mobile-container min-h-screen bg-background pb-28">
        <AppHeader title={t("walletRecharge.addNewCard")} showBack onBackClick={() => setCardView("list")} />
        <div className="px-4 space-y-4 pt-2">
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("walletRecharge.cardNumber")}</label>
              <Input
                value={newCardNumber}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setNewCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
                }}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                dir="ltr"
                className="h-12 bg-background rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("walletRecharge.cardHolder")}</label>
              <Input
                value={newCardHolder}
                onChange={(e) => setNewCardHolder(e.target.value)}
                placeholder={t("walletRecharge.cardHolderPlaceholder")}
                className="h-12 bg-background rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("walletRecharge.expiry")}</label>
                <Input
                  value={newCardExpiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setNewCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                  }}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  dir="ltr"
                  className="h-12 bg-background rounded-xl"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("walletRecharge.cvv")}</label>
                <Input
                  value={newCardCvv}
                  onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="123"
                  inputMode="numeric"
                  dir="ltr"
                  className="h-12 bg-background rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-card rounded-xl px-4 py-3.5 border border-border/60">
            <Checkbox id="save-card" checked={saveForFuture} onCheckedChange={(c) => setSaveForFuture(c as boolean)} />
            <label htmlFor="save-card" className="text-sm font-medium text-foreground">{t("walletRecharge.saveForFuture")}</label>
          </div>
        </div>

        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!newCardValid} onClick={addNewCard}>
              {t("walletRecharge.addCard")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("walletRecharge.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        <div className="space-y-2">
          <PayOption
            icon={Ticket}
            label={t("walletRecharge.voucher")}
            description={t("walletRecharge.voucherDesc")}
            selected={method === "voucher"}
            onClick={() => setMethod("voucher")}
          />
          <PayOption
            icon={CreditCard}
            label={t("walletRecharge.card")}
            description={t("walletRecharge.cardDesc")}
            selected={method === "card"}
            onClick={() => setMethod("card")}
          />
        </div>

        {method === "voucher" && (
          <>
            <CardSection title={t("walletRecharge.walletDetails")} icon={Wallet}>
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] text-muted-foreground">{t("walletRecharge.dealerMsisdn")}</span>
                <span className="text-xs font-semibold text-foreground">{DEALER_MSISDN}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] text-muted-foreground">{t("walletRecharge.currentBalance")}</span>
                <span className="text-xs font-semibold text-foreground"><RiyalSymbol /> {DEALER_WALLET_BALANCE.toFixed(2)}</span>
              </div>
            </CardSection>

            <div className="rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-500/10 dark:border-sky-500/20 px-4 py-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[13px] text-sky-700 dark:text-sky-300 leading-snug">{t("walletRecharge.dataVoucherNote")}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("walletRecharge.voucherCode")}</label>
              <Input
                value={voucherCode}
                onChange={(e) => onVoucherChange(e.target.value)}
                placeholder={t("walletRecharge.voucherCodePlaceholder")}
                inputMode="numeric"
                dir="ltr"
                className="h-12 bg-card rounded-xl"
              />
              {voucherValid && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  {t("walletRecharge.voucherValue", { amount: VOUCHER_AMOUNT.toFixed(2) })}
                </p>
              )}
            </div>

            <PrototypeTestBox
              heading={t("walletRecharge.testVouchersHeading")}
              description={t("walletRecharge.testVouchersDescription")}
              items={[
                { value: "12345678901234", note: t("walletRecharge.testNoteValid") },
                { value: INVALID_VOUCHER_CODE, note: t("walletRecharge.testNoteInvalid") },
              ]}
              onSelect={onVoucherChange}
            />
          </>
        )}

        {method === "card" && (
          <>
            <CardSection title={t("walletRecharge.rechargeAmount")} icon={Wallet}>
              <div className="grid grid-cols-3 gap-2">
                {CARD_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCardAmount(amt)}
                    className={cn(
                      "py-2.5 rounded-full text-[12px] font-medium border transition-colors flex items-center justify-center gap-0.5",
                      cardAmount === amt ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground"
                    )}
                  >
                    <RiyalSymbol /> {amt.toFixed(2)}
                  </button>
                ))}
              </div>
            </CardSection>

            <CardSection title={t("walletRecharge.selectPaymentMethod")} icon={CreditCard}>
              <div className="space-y-2.5">
                {/* Apple Pay */}
                <button
                  type="button"
                  onClick={() => selectCard("applepay")}
                  className={cn(
                    "w-full rounded-xl p-3 flex items-center gap-3 transition-colors",
                    paymentMethod === "applepay" ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
                    <AppleMark className="w-4 h-4 text-white" />
                  </div>
                  <span className={cn("flex-1 text-start text-sm font-semibold", paymentMethod === "applepay" ? "text-primary" : "text-foreground")}>
                    {t("walletRecharge.applePay")}
                  </span>
                  <RadioDot selected={paymentMethod === "applepay"} />
                </button>

                {/* Google Pay */}
                <button
                  type="button"
                  onClick={() => selectCard("googlepay")}
                  className={cn(
                    "w-full rounded-xl p-3 flex items-center gap-3 transition-colors",
                    paymentMethod === "googlepay" ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border/60"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-border/60 flex items-center justify-center shrink-0">
                    <GoogleMark className="w-5 h-5" />
                  </div>
                  <span className={cn("flex-1 text-start text-sm font-semibold", paymentMethod === "googlepay" ? "text-primary" : "text-foreground")}>
                    {t("walletRecharge.googlePay")}
                  </span>
                  <RadioDot selected={paymentMethod === "googlepay"} />
                </button>

                {/* Saved / newly-added cards — shown as real card art, swipe left to delete */}
                {cards.map((card) => {
                  const isSelected = paymentMethod === card.id;
                  return (
                    <div key={card.id} className="space-y-1.5">
                      <SwipeableCardRow
                        isOpen={swipedCardId === card.id}
                        onOpenChange={(open) => setSwipedCardId(open ? card.id : null)}
                        onSelect={() => selectCard(card.id)}
                        onDelete={() => deleteCard(card.id)}
                        deleteLabel={t("walletRecharge.delete")}
                      >
                        <div
                          className={cn(
                            "w-full rounded-xl p-4 text-start bg-gradient-to-br from-primary to-primary/70 text-primary-foreground transition-all",
                            isSelected ? "ring-2 ring-offset-2 ring-primary ring-offset-background" : "opacity-90"
                          )}
                        >
                          <div className="flex items-center justify-between mb-6">
                            <span className="text-xs font-semibold tracking-wide uppercase">{card.brand}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </div>
                          <p className="text-lg font-bold tracking-widest" dir="ltr">•••• •••• •••• {card.last4}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[11px] opacity-90">{card.holder}</span>
                            <span className="text-[11px] opacity-90" dir="ltr">{card.expiry}</span>
                          </div>
                        </div>
                      </SwipeableCardRow>

                      {isSelected && card.id === SAVED_CARD_ID && (
                        <div className="w-28 space-y-1.5 ps-1">
                          <label className="text-xs font-medium text-muted-foreground">{t("walletRecharge.cvv")}</label>
                          <Input
                            value={savedCardCvv}
                            onChange={(e) => setSavedCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                            placeholder="•••"
                            inputMode="numeric"
                            dir="ltr"
                            className="h-11 bg-card rounded-xl text-center"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add new card — opens a dedicated full-page form */}
                <button
                  type="button"
                  onClick={() => setCardView("addNew")}
                  className="w-full rounded-xl p-3 flex items-center gap-3 border-2 border-dashed border-border bg-card"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t("walletRecharge.addNewCard")}</span>
                </button>
              </div>
            </CardSection>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canSubmit} onClick={resolveRecharge}>
            {method === "voucher"
              ? t("walletRecharge.topUp")
              : <>{t("walletRecharge.pay")} <RiyalSymbol /> {rechargeAmount?.toFixed(2)}</>}
          </Button>
        </div>
      </div>

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => !o && (setSuccessOpen(false), resetAll(), navigate("/"))}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("walletRecharge.rechargeSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("walletRecharge.rechargedBy", { amount: (rechargeAmount ?? 0).toFixed(2) })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("walletRecharge.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("walletRecharge.goToHome")}
          </Button>
        </DrawerContent>
      </Drawer>

      {/* Failure */}
      <Drawer open={failureOpen} onOpenChange={setFailureOpen}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-destructive/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("walletRecharge.rechargeFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("walletRecharge.rechargeFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); resolveRecharge(); }}>
              {t("walletRecharge.retry")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => setFailureOpen(false)}
            >
              {t("walletRecharge.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Invalid voucher — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!voucherError} onOpenChange={(o) => { if (!o) setVoucherError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("walletRecharge.voucherErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{voucherError}</p>
          <button
            onClick={() => setVoucherError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("walletRecharge.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      <BrandLoadingOverlay open={voucherChecking || processing} />
    </div>
  );
};

export default WalletRecharge;
