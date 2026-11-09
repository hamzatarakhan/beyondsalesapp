import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import PinCodeSheet from "@/components/PinCodeSheet";
import RiyalSymbol from "@/components/RiyalSymbol";
import { cn } from "@/lib/utils";
import friendiLogo from "@/assets/friendi-mobile-logo.svg";
import virginLogo from "@/assets/virgin-mobile-logo.svg";
import { Apple, BadgeCheck, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Gamepad2, MessageSquareText, Printer, Ticket, X, AlertCircle } from "lucide-react";

// E-Voucher: the dealer sells prepaid vouchers from the E-Voucher wallet, either sent to a
// customer by SMS (number verified by OTP first) or printed. Both end with PIN → confirm → success.

// ---------- Demo data ----------
const E_VOUCHER_BALANCE = 456.789;
const AMOUNTS = [10, 20, 30, 40, 50, 60, 70, 80];
const MAX_VOUCHERS = 99;
const isValidMsisdn = (v: string) => /^05\d{8}$/.test(v);

type Operator = { id: string; name: string; render: () => React.ReactNode };
const OPERATORS: Operator[] = [
  { id: "ooredoo", name: "Ooredoo", render: () => <span className="text-base font-bold lowercase tracking-tight text-red-600">ooredoo</span> },
  { id: "friendi", name: "Friendi", render: () => <img src={friendiLogo} alt="" className="h-7 w-auto" /> },
  { id: "virgin", name: "Virgin", render: () => <img src={virginLogo} alt="" className="h-7 w-auto" /> },
  { id: "apple", name: "Apple", render: () => <Apple className="w-7 h-7 text-foreground" fill="currentColor" /> },
  { id: "playstation", name: "PlayStation", render: () => <Gamepad2 className="w-7 h-7 text-blue-700" /> },
];

// ---------- E-Voucher — choose Send by SMS or Print ----------
const EVoucher = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const options = [
    { icon: MessageSquareText, label: t("eVoucher.sendBySms"), path: "/e-voucher/sms" },
    { icon: Printer, label: t("eVoucher.printVoucher"), path: "/e-voucher/print" },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-10">
      <AppHeader title={t("eVoucher.title")} showBack onBackClick={() => navigate("/")} />
      <div className="px-4 space-y-3">
        {options.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/60 text-start transition-colors hover:bg-muted/40"
          >
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </span>
            <span className="flex-1 min-w-0 text-sm font-medium text-foreground">{label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
          </button>
        ))}
      </div>
    </div>
  );
};

// ---------- Voucher form — shared by Send by SMS (with verified number) and Print ----------
export const EVoucherForm = ({ mode }: { mode: "sms" | "print" }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isSms = mode === "sms";

  const [msisdn, setMsisdn] = useState("");
  const [verifiedMsisdn, setVerifiedMsisdn] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [operator, setOperator] = useState("");
  const [countText, setCountText] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const verified = isSms && !!msisdn && msisdn === verifiedMsisdn;
  const count = countText === "" ? 0 : Number(countText);
  const total = amount ? amount * count : 0;
  const overBalance = total > E_VOUCHER_BALANCE;
  const canSubmit = (!isSms || verified) && !!operator && count > 0 && !!amount && !overBalance;

  const setCount = (n: number) => setCountText(String(Math.max(0, Math.min(MAX_VOUCHERS, n))));

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("eVoucher.title")} showBack onBackClick={() => navigate("/e-voucher")} />
      <div className="px-4 space-y-4">
        {/* Wallet card */}
        <div className="rounded-2xl bg-teal-700 text-white p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4" />
          </span>
          <p className="flex-1 text-sm font-medium">{t("eVoucher.title")}</p>
          <p className="text-base font-semibold"><RiyalSymbol /> {E_VOUCHER_BALANCE.toFixed(3)}</p>
        </div>

        {/* Mobile number + Verify (SMS only) */}
        {isSms && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("eVoucher.mobileNumber")} <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} placeholder={t("eVoucher.mobilePlaceholder")} className="flex-1" />
              {verified ? (
                <span className="h-12 px-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 shrink-0">
                  <BadgeCheck className="w-4 h-4" /> {t("eVoucher.verified")}
                </span>
              ) : (
                <Button type="button" className="h-12 px-4 rounded-xl text-xs font-semibold shrink-0" disabled={!isValidMsisdn(msisdn)} onClick={() => setOtpOpen(true)}>
                  {t("eVoucher.verify")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Operator */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("eVoucher.operator")}</label>
          <div className="-mx-4 px-4 scroll-px-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {OPERATORS.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setOperator(op.id)}
                aria-pressed={operator === op.id}
                className="shrink-0 w-[84px] flex flex-col items-center gap-1"
              >
                <span
                  className={cn(
                    "w-full h-14 rounded-xl bg-card border-2 flex items-center justify-center px-2",
                    operator === op.id ? "border-primary" : "border-transparent",
                  )}
                >
                  {op.render()}
                </span>
                <span className="text-[11px] font-medium text-foreground">{op.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Number of vouchers */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("eVoucher.numberOfVouchers")}</label>
          <div className="h-12 rounded-xl bg-card border border-input flex items-center ps-3 pe-1">
            <input
              value={countText}
              onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setCountText(d === "" ? "" : String(Math.min(MAX_VOUCHERS, Number(d)))); }}
              placeholder="0"
              inputMode="numeric"
              aria-label={t("eVoucher.numberOfVouchers")}
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <div className="flex flex-col">
              <button type="button" aria-label={t("eVoucher.increase")} onClick={() => setCount(count + 1)} className="h-5 w-8 flex items-center justify-center text-primary">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button type="button" aria-label={t("eVoucher.decrease")} onClick={() => setCount(count - 1)} className="h-5 w-8 flex items-center justify-center text-primary">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t("eVoucher.selectAmount")}</label>
          <div className="grid grid-cols-4 gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                aria-pressed={amount === a}
                className={cn(
                  "h-11 rounded-full text-sm font-semibold transition-colors",
                  amount === a ? "bg-primary/15 text-primary border border-primary/30" : "bg-card text-foreground border border-transparent",
                )}
              >
                {a}
              </button>
            ))}
          </div>
          {overBalance && <p className="text-xs text-destructive">{t("eVoucher.overBalance")}</p>}
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="sm:max-w-[390px] mx-auto">
          {/* Count badge · Submit · total, once a count and amount are picked */}
          <Button className="w-full h-12 text-sm font-semibold rounded-full px-2 pe-5" disabled={!canSubmit} onClick={() => setPinOpen(true)}>
            {total > 0 ? (
              <>
                <span className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm font-semibold shrink-0">{count}</span>
                <span className="flex-1 text-start ps-1 text-base">{t("eVoucher.submit")}</span>
                <span className="text-base font-semibold" aria-label={t("eVoucher.total")}><RiyalSymbol /> {Number.isInteger(total) ? total : total.toFixed(2)}</span>
              </>
            ) : (
              t("eVoucher.submit")
            )}
          </Button>
        </div>
      </div>

      {/* OTP — verifies the customer's number before vouchers can be sent to it */}
      <PinCodeSheet
        open={otpOpen}
        onOpenChange={setOtpOpen}
        onVerified={() => setVerifiedMsisdn(msisdn)}
        idPrefix="e-voucher-otp"
        title={t("eVoucher.otpTitle")}
        description={t("eVoucher.otpDesc", { msisdn })}
      />

      {/* Dealer PIN */}
      <PinCodeSheet open={pinOpen} onOpenChange={setPinOpen} onVerified={() => setConfirmOpen(true)} idPrefix="e-voucher-pin" />

      {/* Confirmation message */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2">
          <div className="relative py-3 text-center">
            <DrawerTitle className="text-lg font-semibold text-foreground">{t("eVoucher.confirmTitle")}</DrawerTitle>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="absolute end-0 top-2 w-8 h-8 rounded-full border border-border flex items-center justify-center"
              aria-label={t("eVoucher.close")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-3 text-center">
            <AlertCircle className="w-10 h-10 text-sky-600" />
            <p className="text-base font-semibold text-sky-600">{t("eVoucher.submitRequest")}</p>
            <DrawerDescription className="text-sm text-muted-foreground">
              {t(isSms ? "eVoucher.confirmSms" : "eVoucher.confirmPrint")}
            </DrawerDescription>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold mt-2" onClick={() => { setConfirmOpen(false); setSuccessOpen(true); }}>
            {t("eVoucher.submit")}
          </Button>
          <button type="button" onClick={() => setConfirmOpen(false)} className="w-full h-10 mt-1 text-sm font-semibold text-primary">
            {t("eVoucher.cancel")}
          </button>
        </DrawerContent>
      </Drawer>

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); navigate("/"); } }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-1.5 pt-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            <DrawerTitle className="text-base font-semibold text-emerald-600">{t("eVoucher.submitRequest")}</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground">
              {t(isSms ? "eVoucher.successSms" : "eVoucher.successPrint", { count, msisdn })}
            </DrawerDescription>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold mt-5" onClick={() => { setSuccessOpen(false); navigate("/"); }}>
            {t("eVoucher.done")}
          </Button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export const EVoucherSms = () => <EVoucherForm mode="sms" />;
export const EVoucherPrint = () => <EVoucherForm mode="print" />;

export default EVoucher;
