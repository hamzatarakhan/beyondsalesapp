import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import { DEALER_WALLET_BALANCE, VerifiedBanner } from "@/pages/NewActivation";
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

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
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

const CreditTransfer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  // Step 0 — Lookup + amount
  const [msisdn, setMsisdn] = useState("0501111133");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoTransferCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  // Step 1 — Checkout
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
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

  // ---------- OTP handlers ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => {
      setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpOpen]);

  const setOtpDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      if (d && i === 4) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "11111") {
            setOtpError(true);
          } else {
            setOtpError(false);
            setOtpVerified(true);
            setOtpOpen(false);
          }
        }, 300);
      }
      return next;
    });
    if (d && i < 4) {
      const el = document.getElementById(`credit-transfer-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("credit-transfer-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  const canContinueStep0 = eligible && amount != null && amount > 0 && !insufficientBalance;
  const canConfirm = otpVerified;

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
    setStep(0);
    setMsisdn("0501111133");
    setCustomer(null);
    setLookupError(null);
    setAmount(null);
    setOtpVerified(false);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("creditTransfer.title")} showBack onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup + Amount ── */}
        {step === 0 && (
          <>
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

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}

            {customer && (
              <>
                <CardSection title={t("creditTransfer.customerDetails")} icon={ClipboardList}>
                  <SummaryRow label={t("creditTransfer.customerName")} value={customer.name} />
                  <SummaryRow label={t("creditTransfer.msisdn")} value={customer.msisdn} />
                </CardSection>

                <CardSection title={t("creditTransfer.transferAmount")} icon={Send}>
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
                </CardSection>

                {insufficientBalance && (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-[13px] text-destructive leading-snug">{t("creditTransfer.insufficientBalance")}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Step 1: Checkout ── */}
        {step === 1 && customer && amount != null && (
          <>
            <CardSection title={t("creditTransfer.transferSummary")} icon={ClipboardList}>
              <SummaryRow label={t("creditTransfer.customerName")} value={customer.name} />
              <SummaryRow label={t("creditTransfer.msisdn")} value={customer.msisdn} />
              <SummaryRow label={t("creditTransfer.amount")} value={<><RiyalSymbol /> {amount.toFixed(2)}</>} />
            </CardSection>

            <CardSection title={t("creditTransfer.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("creditTransfer.otpVerified")} />
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">{t("creditTransfer.otpHint")}</p>
                  <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("creditTransfer.sendVerifyOtp")}</Button>
                </>
              )}
            </CardSection>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 && customer && (
            <div className="flex items-center justify-center gap-1.5 -mt-0.5 mb-2 px-3.5 py-1 rounded-full bg-primary/5 border border-primary/15 w-fit mx-auto leading-none">
              <Wallet className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[12px] text-muted-foreground">{t("creditTransfer.dealerWalletBalance")}</span>
              <span className="text-[12px] font-bold text-primary"><RiyalSymbol /> {DEALER_WALLET_BALANCE.toFixed(2)}</span>
            </div>
          )}
          {step === 0 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueStep0} onClick={() => setStep(1)}>
              {t("creditTransfer.continue")}
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canConfirm} onClick={() => setConfirmOpen(true)}>
              {t("creditTransfer.transfer")} <RiyalSymbol /> {amount?.toFixed(2)}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("creditTransfer.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("creditTransfer.otpIncorrect") : t("creditTransfer.otpSentToCustomer")}
            </p>
            <div className="flex gap-2" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`credit-transfer-otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigitAt(i, e.target.value)}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 text-center text-base font-semibold focus:outline-none",
                    otpError ? "border-destructive text-destructive" : "border-border focus:border-primary text-foreground",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {otpError ? (
                <>
                  {t("creditTransfer.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("creditTransfer.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("creditTransfer.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("creditTransfer.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("creditTransfer.resend")}</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

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
                {t("creditTransfer.confirmTransferDesc", { amount: amount?.toFixed(2) ?? "0.00", name: customer?.name ?? "" })}
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
              {t("creditTransfer.transferredTo", { amount: amount?.toFixed(2) ?? "0.00", name: customer?.name ?? "" })}
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

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default CreditTransfer;
