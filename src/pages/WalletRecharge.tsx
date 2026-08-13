import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
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
  Apple,
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
  const [paymentMethod, setPaymentMethod] = useState<"applepay" | string | null>(null);
  const [savedCardCvv, setSavedCardCvv] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");
  const [newCardExpiry, setNewCardExpiry] = useState("");
  const [newCardCvv, setNewCardCvv] = useState("");
  const [newCardHolder, setNewCardHolder] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(true);

  const selectedCard = cards.find((c) => c.id === paymentMethod);
  const cardValid =
    cardAmount != null &&
    (paymentMethod === "applepay"
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
                className={cn("h-12 bg-card rounded-xl", voucherError && "border-destructive focus-visible:ring-destructive")}
              />
              {voucherError && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {voucherError}
                </p>
              )}
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
                  onClick={() => setPaymentMethod("applepay")}
                  className={cn(
                    "w-full rounded-xl p-3 flex items-center gap-3 border transition-colors",
                    paymentMethod === "applepay" ? "border-primary bg-primary/5" : "border-border bg-background"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-foreground flex items-center justify-center shrink-0">
                    <Apple className="w-5 h-5 text-background" fill="currentColor" />
                  </div>
                  <span className="flex-1 text-start text-sm font-semibold text-foreground">{t("walletRecharge.applePay")}</span>
                  <RadioDot selected={paymentMethod === "applepay"} />
                </button>

                {/* Saved / newly-added cards */}
                {cards.map((card) => (
                  <div key={card.id} className="space-y-1.5">
                    <div
                      className={cn(
                        "w-full rounded-xl p-3 flex items-center gap-3 border transition-colors",
                        paymentMethod === card.id ? "border-primary bg-primary/5" : "border-border bg-background"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setPaymentMethod(card.id)}
                        className="flex items-center gap-3 flex-1 text-start min-w-0"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#1a1f71] flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold italic tracking-tight">{card.brand}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground" dir="ltr">XXXX-{card.last4}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{card.expiry}</p>
                        </div>
                      </button>
                      <RadioDot selected={paymentMethod === card.id} />
                      {paymentMethod === card.id && (
                        <button
                          type="button"
                          onClick={() => deleteCard(card.id)}
                          className="flex items-center gap-1 text-destructive text-xs font-semibold shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t("walletRecharge.delete")}
                        </button>
                      )}
                    </div>

                    {paymentMethod === card.id && card.id === SAVED_CARD_ID && (
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
                ))}

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

      <BrandLoadingOverlay open={voucherChecking || processing} />
    </div>
  );
};

export default WalletRecharge;
