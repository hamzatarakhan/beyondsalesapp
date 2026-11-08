import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import RiyalSymbol from "@/components/RiyalSymbol";
import PinCodeSheet from "@/components/PinCodeSheet";
import { Ticket } from "lucide-react";

// Wallet Top-Up: the dealer tops up their own wallet by redeeming a voucher code,
// confirmed with the 4-digit PIN.

// ---------- Demo data ----------
const WALLET_OWNER = "Ahmad Hassan";
const WALLET_BALANCE = 456.78;
const MIN_VOUCHER_LENGTH = 8;

const WalletTopUp = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [reference, setReference] = useState("");

  const canRecharge = code.length >= MIN_VOUCHER_LENGTH;

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("walletTopUp.title")} showBack onBackClick={() => navigate("/")} />
      <div className="px-4 space-y-4">
        <div className="rounded-2xl bg-teal-700 text-white p-4 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-base font-medium truncate">{WALLET_OWNER}</p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <Ticket className="w-3.5 h-3.5" />
              </span>
              <span className="text-sm">{t("walletTopUp.walletName")}</span>
            </div>
          </div>
          <p className="text-lg font-semibold shrink-0"><RiyalSymbol /> {WALLET_BALANCE.toFixed(2)}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{t("walletTopUp.paymentMethod")}</label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 16))}
            placeholder={t("walletTopUp.voucherCode")}
            inputMode="numeric"
            className="h-12 bg-card rounded-xl"
          />
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="sm:max-w-[390px] mx-auto">
          <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canRecharge} onClick={() => setPinOpen(true)}>
            {t("walletTopUp.recharge")}
          </Button>
        </div>
      </div>

      <PinCodeSheet
        open={pinOpen}
        onOpenChange={setPinOpen}
        onVerified={() => setReference(`WT-${Math.floor(100000 + Math.random() * 900000)}`)}
        idPrefix="wallet-top-up"
      />

      <SuccessBottomSheet
        open={!!reference}
        onClose={() => { setReference(""); navigate("/"); }}
        orderId={reference}
        title={t("walletTopUp.successTitle")}
        message={t("walletTopUp.successMessage")}
      />
    </div>
  );
};

export default WalletTopUp;
