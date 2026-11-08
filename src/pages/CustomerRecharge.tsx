import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import RiyalSymbol from "@/components/RiyalSymbol";
import PinCodeSheet from "@/components/PinCodeSheet";
import { ChevronRight, Ticket, Wallet } from "lucide-react";

// Customer Recharge: the dealer tops up a customer's line either from the dealer's
// E-Reload wallet (amount + PIN) or by redeeming a charge voucher code.

// ---------- Demo data ----------
const E_RELOAD_BALANCE = 456.78;
const isValidMsisdn = (v: string) => /^05\d{8}$/.test(v);
const newReference = (prefix: string) => `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const StickyAction = ({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) => (
  <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
    <div className="sm:max-w-[390px] mx-auto">
      <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </div>
  </div>
);

// ---------- Customer Recharge — choose the recharge method ----------
const CustomerRecharge = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const methods = [
    { icon: Wallet, label: t("customerRecharge.eReloadWallet"), path: "/customer-recharge/e-reload" },
    { icon: Ticket, label: t("customerRecharge.chargeVoucher"), path: "/customer-recharge/voucher" },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-10">
      <AppHeader title={t("customerRecharge.title")} showBack onBackClick={() => navigate("/")} />
      <div className="px-4 space-y-3">
        {methods.map(({ icon: Icon, label, path }) => (
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

// ---------- E-Reload Wallet — phone + amount, confirmed with a 4-digit PIN ----------
export const EReloadWallet = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [msisdn, setMsisdn] = useState("");
  const [amountText, setAmountText] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [reference, setReference] = useState("");

  const amount = amountText === "" ? 0 : Number(amountText);
  const overBalance = amount > E_RELOAD_BALANCE;
  const canRecharge = isValidMsisdn(msisdn) && amount > 0 && !overBalance;

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("customerRecharge.eReloadTitle")} showBack onBackClick={() => navigate("/customer-recharge")} />
      <div className="px-4 space-y-4">
        <div className="rounded-2xl bg-teal-700 text-white p-4 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("customerRecharge.eReloadBalance")}</p>
            <p className="text-base font-semibold"><RiyalSymbol /> {E_RELOAD_BALANCE.toFixed(2)}</p>
          </div>
        </div>

        <Field label={t("customerRecharge.phoneNumber")}>
          <PhoneNumberInput value={msisdn} onChange={setMsisdn} placeholder={t("customerRecharge.phonePlaceholder")} />
        </Field>

        <Field label={t("customerRecharge.rechargeAmount")}>
          <div className="relative">
            <Input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
              placeholder="0.00"
              inputMode="decimal"
              className="h-12 bg-card rounded-xl pe-10"
            />
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"><RiyalSymbol /></span>
          </div>
          {overBalance && <p className="text-[11px] text-destructive">{t("customerRecharge.overBalance")}</p>}
        </Field>
      </div>

      <StickyAction label={t("customerRecharge.recharge")} disabled={!canRecharge} onClick={() => setPinOpen(true)} />

      <PinCodeSheet open={pinOpen} onOpenChange={setPinOpen} onVerified={() => setReference(newReference("ER"))} idPrefix="customer-recharge" />

      <SuccessBottomSheet
        open={!!reference}
        onClose={() => { setReference(""); navigate("/"); }}
        orderId={reference}
        title={t("customerRecharge.successTitle")}
        message={t("customerRecharge.eReloadSuccess", { amount: amount.toFixed(2), msisdn })}
      />
    </div>
  );
};

// ---------- Charge Voucher — phone + voucher code ----------
export const ChargeVoucher = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [msisdn, setMsisdn] = useState("");
  const [code, setCode] = useState("");
  const [reference, setReference] = useState("");

  const canRecharge = isValidMsisdn(msisdn) && code.length >= 8;

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("customerRecharge.voucherTitle")} showBack onBackClick={() => navigate("/customer-recharge")} />
      <div className="px-4 space-y-4">
        <Field label={t("customerRecharge.phoneNumber")}>
          <PhoneNumberInput value={msisdn} onChange={setMsisdn} placeholder={t("customerRecharge.phonePlaceholder")} />
        </Field>

        <Field label={t("customerRecharge.voucherCode")}>
          <div className="relative">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 16))}
              placeholder={t("customerRecharge.voucherPlaceholder")}
              inputMode="numeric"
              className="h-12 bg-card rounded-xl pe-10"
            />
            <Ticket className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
        </Field>
      </div>

      <StickyAction label={t("customerRecharge.recharge")} disabled={!canRecharge} onClick={() => setReference(newReference("CV"))} />

      <SuccessBottomSheet
        open={!!reference}
        onClose={() => { setReference(""); navigate("/"); }}
        orderId={reference}
        title={t("customerRecharge.successTitle")}
        message={t("customerRecharge.voucherSuccess", { msisdn })}
      />
    </div>
  );
};

export default CustomerRecharge;
