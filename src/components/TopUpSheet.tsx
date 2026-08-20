import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import RiyalSymbol from "@/components/RiyalSymbol";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import { cn } from "@/lib/utils";
import { Wallet, Check } from "lucide-react";

const PRESET_AMOUNTS = [50, 100, 150, 250, 350, 500];

interface TopUpSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Quick inline top-up — opened right where a dealer hits an insufficient-balance block
 * (Bill Payment, Credit Transfer, SIM Termination, etc.) instead of sending them to the
 * full eWallet Recharge page. Adds straight to the shared wallet balance and closes, so
 * whatever flow opened it just continues where it was.
 */
const TopUpSheet = ({ open, onOpenChange }: TopUpSheetProps) => {
  const { t } = useTranslation();
  const { topUp } = useWalletBalance();
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const resolvedAmount = customAmount.trim() ? Number(customAmount) : amount;
  const valid = !!resolvedAmount && resolvedAmount > 0;

  const reset = () => {
    setAmount(null);
    setCustomAmount("");
    setProcessing(false);
  };

  const handleTopUp = () => {
    if (!valid || !resolvedAmount) return;
    setProcessing(true);
    setTimeout(() => {
      topUp(resolvedAmount);
      reset();
      onOpenChange(false);
    }, 900);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-3"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{t("topUpSheet.title")}</h3>
              <p className="text-[11px] text-muted-foreground">{t("topUpSheet.subtitle")}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => { setAmount(amt); setCustomAmount(""); }}
                className={cn(
                  "py-2.5 rounded-full text-[12px] font-medium border transition-colors flex items-center justify-center gap-0.5",
                  amount === amt && !customAmount ? "border-primary bg-primary text-white" : "border-border bg-muted text-foreground",
                )}
              >
                <RiyalSymbol /> {amt.toFixed(2)}
              </button>
            ))}
          </div>

          <div className="relative mb-5">
            <Input
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")); setAmount(null); }}
              placeholder={t("topUpSheet.customAmountPlaceholder")}
              inputMode="decimal"
              className="h-12 bg-card rounded-xl ps-10"
            />
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              <RiyalSymbol />
            </span>
          </div>

          <Button className="w-full h-12 rounded-full font-semibold" disabled={!valid} onClick={handleTopUp}>
            <Check className="w-4 h-4" /> {t("topUpSheet.topUpNow")}
          </Button>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={processing} />
    </>
  );
};

export default TopUpSheet;
