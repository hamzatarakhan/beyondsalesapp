import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import WalletShortNotice from "@/components/WalletShortNotice";
import {
  Phone,
  ClipboardList,
  Wallet,
  Send,
  AlertCircle,
  Check,
  XCircle,
} from "lucide-react";

// ---------- Local UI primitives (mirrors CreditLimitAdjustment.tsx) ----------
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const CardSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ClipboardList;
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

// ---------- Demo data ----------
interface DemoTransferCustomer {
  msisdn: string;
  name: string;
  status: "active" | "terminated";
}

const DEMO_TRANSFER_CUSTOMERS: DemoTransferCustomer[] = [
  { msisdn: "0501111133", name: "Faisal Al-Harbi", status: "active" },
  { msisdn: "0501111122", name: "Noura Al-Qahtani", status: "active" },
  { msisdn: "0501111199", name: "Khalid Al-Dossary", status: "terminated" },
];

// 600 deliberately exceeds DEALER_WALLET_BALANCE (550) so the insufficient-balance
// case is actually reachable to demo, not just a dead code path.
const AMOUNT_PRESETS = [10, 20, 50, 100, 200, 600];
// Floor for a transfer — same convention as the minimum partial payment elsewhere in the
// app (e.g. SIM Termination). The ceiling is the dealer's own wallet balance, not a fixed
// number — you can't send more than you have.
const MIN_TRANSFER_AMOUNT = 10;

const CreditTransfer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { balance: DEALER_WALLET_BALANCE } = useWalletBalance();

  // ---------- Flow state (single page — no step navigation) ----------
  const [msisdn, setMsisdn] = useState("0501111133");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoTransferCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  // ---------- MSISDN lookup — triggered by the Search button, not on every keystroke ----------
  const handleSearch = () => {
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    setLookupError(null);
    setCustomer(null);
    setAmount(null);
    setTimeout(() => {
      setChecking(false);
      const found = DEMO_TRANSFER_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError(t("creditTransfer.lookupErrorNotFound"));
        return;
      }
      if (found.status === "terminated") {
        setLookupError(t("creditTransfer.lookupErrorTerminated"));
        return;
      }
      setCustomer(found);
    }, 800);
  };

  const eligible = !!customer && !lookupError;
  const insufficientBalance = amount != null && amount > DEALER_WALLET_BALANCE;
  const belowMin = amount != null && amount > 0 && amount < MIN_TRANSFER_AMOUNT;

  // ---------- Gates ----------
  const canTransfer = eligible && amount != null && amount >= MIN_TRANSFER_AMOUNT && !insufficientBalance;

  const resolveTransfer = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`CT-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setMsisdn("0501111133");
    setCustomer(null);
    setLookupError(null);
    setAmount(null);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("creditTransfer.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        <Field label={t("creditTransfer.msisdn")}>
          <div className="flex gap-2">
            <PhoneNumberInput
              value={msisdn}
              onChange={(v) => { setMsisdn(v); setCustomer(null); setLookupError(null); setAmount(null); }}
              icon={<Phone className="w-4 h-4" />}
              className="flex-1"
            />
            <Button
              type="button"
              className="h-12 w-20 rounded-xl shrink-0"
              disabled={!/^\d{10}$/.test(msisdn) || checking}
              onClick={handleSearch}
            >
              {t("creditTransfer.search")}
            </Button>
          </div>
        </Field>

        <PrototypeTestBox
          heading={t("creditTransfer.testNumbersHeading")}
          description={t("creditTransfer.testNumbersDescription")}
          items={[
            { value: "0501111133", note: t("creditTransfer.testNoteActive") },
            { value: "0501111122", note: t("creditTransfer.testNoteActive") },
            { value: "0501111199", note: t("creditTransfer.testNoteTerminated") },
            { value: "0500000099", note: t("creditTransfer.testNoteNotFound") },
          ]}
          onSelect={(v) => { setMsisdn(v); setCustomer(null); setLookupError(null); setAmount(null); }}
        />

        {customer && (
          <>
            <CardSection title={t("creditTransfer.transferAmount")} icon={Send}>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    value={amount != null ? String(amount) : ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                      setAmount(raw === "" ? null : Number(raw));
                    }}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="h-12 bg-card rounded-xl ps-10"
                  />
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    <RiyalSymbol />
                  </span>
                </div>
                <p className={cn("text-[11px]", belowMin || insufficientBalance ? "text-destructive" : "text-muted-foreground")}>
                  {t("creditTransfer.amountRangeHint", { min: MIN_TRANSFER_AMOUNT.toFixed(2), max: DEALER_WALLET_BALANCE.toFixed(2) })}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {AMOUNT_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={cn(
                        "py-2.5 rounded-full text-[12px] font-medium border transition-colors flex items-center justify-center gap-0.5",
                        amount === amt ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground"
                      )}
                    >
                      <RiyalSymbol /> {amt.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </CardSection>

            {insufficientBalance && (
              <WalletShortNotice message={t("creditTransfer.insufficientBalance")} buttonLabel={t("creditTransfer.topUpWallet")} />
            )}
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {customer && (
            <div className="flex items-center justify-center gap-1.5 -mt-0.5 mb-2 px-3.5 py-1 rounded-full bg-primary/5 border border-primary/15 w-fit mx-auto leading-none">
              <Wallet className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[12px] text-muted-foreground">{t("creditTransfer.dealerWalletBalance")}</span>
              <span className="text-[12px] font-bold text-primary"><RiyalSymbol /> {DEALER_WALLET_BALANCE.toFixed(2)}</span>
            </div>
          )}
          <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canTransfer} onClick={() => setConfirmOpen(true)}>
            {t("creditTransfer.transfer")}{amount != null && <> <RiyalSymbol /> {amount.toFixed(2)}</>}
          </Button>
        </div>
      </div>

      {/* Confirm */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("creditTransfer.confirmTransferTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("creditTransfer.confirmTransferDesc", { amount: amount?.toFixed(2) ?? "0.00", msisdn: customer?.msisdn ?? "" })}
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveTransfer}>{t("creditTransfer.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("creditTransfer.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => !o && (setSuccessOpen(false), resetAll(), navigate("/"))}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("creditTransfer.transferSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("creditTransfer.transferredTo", { amount: amount?.toFixed(2) ?? "0.00", msisdn: customer?.msisdn ?? "" })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("creditTransfer.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("creditTransfer.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("creditTransfer.transferFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("creditTransfer.transferFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("creditTransfer.tryAgain")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => { setFailureOpen(false); }}
            >
              {t("creditTransfer.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Lookup error — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => { if (!o) setLookupError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("creditTransfer.lookupErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button
            onClick={() => setLookupError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("creditTransfer.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default CreditTransfer;
