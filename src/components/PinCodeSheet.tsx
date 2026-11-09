import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// Prototype PIN — any other 4 digits count as wrong so QA can reach the error state.
// Real PIN verification must happen server-side.
export const PROTOTYPE_PIN = "1234";

interface PinCodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with a correct PIN; the sheet closes itself first. */
  onVerified: () => void;
  /** Keeps the digit input ids unique per page. */
  idPrefix: string;
  /** Overrides for reusing the sheet as an OTP step (e.g. E-Voucher number verification). */
  title?: string;
  description?: string;
}

// "PIN Code" bottom sheet: 4 round digit boxes, Resend link and Submit — shared by the
// Customer Recharge (E-Reload) and Wallet Top-Up flows.
const PinCodeSheet = ({ open, onOpenChange, onVerified, idPrefix, title, description }: PinCodeSheetProps) => {
  const { t } = useTranslation();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [resent, setResent] = useState(false);
  const pin = digits.join("");
  const box = (i: number) => document.getElementById(`${idPrefix}-pin-${i}`) as HTMLInputElement | null;

  // Fresh sheet every time it opens; focus without scrolling so the slide-in doesn't
  // push the title out of view.
  useEffect(() => {
    if (!open) return;
    setDigits(["", "", "", ""]);
    setError(false);
    setResent(false);
    setTimeout(() => box(0)?.focus({ preventScroll: true }), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setDigits((prev) => { const next = [...prev]; next[i] = d; return next; });
    setError(false);
    if (d && i < 3) box(i + 1)?.focus({ preventScroll: true });
    if (!d && i > 0) box(i - 1)?.focus({ preventScroll: true });
  };

  const submit = () => {
    if (!/^\d{4}$/.test(pin)) return;
    if (pin !== PROTOTYPE_PIN) { setError(true); return; }
    onOpenChange(false);
    onVerified();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="relative flex flex-col items-center gap-4 py-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute end-0 top-3 w-8 h-8 rounded-full border border-border flex items-center justify-center"
            aria-label={t("customerRecharge.close")}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-center">
            <DrawerTitle className="text-lg font-bold text-foreground">{title ?? t("customerRecharge.pinTitle")}</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground mt-1">{description ?? t("customerRecharge.pinDesc")}</DrawerDescription>
          </div>
          <div className="flex gap-3" dir="ltr">
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                id={`${idPrefix}-pin-${i}`}
                inputMode="numeric"
                autoComplete="off"
                maxLength={1}
                value={digits[i]}
                onChange={(e) => setDigitAt(i, e.target.value)}
                className={cn(
                  "w-12 h-12 rounded-full border-2 text-center text-base font-semibold focus:outline-none text-foreground",
                  error ? "border-destructive" : "border-border focus:border-primary",
                )}
              />
            ))}
          </div>
          {error ? (
            <p className="text-xs text-destructive">{t("customerRecharge.pinInvalid")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {resent ? t("customerRecharge.otpResent") : t("customerRecharge.noOtp")}{" "}
              {!resent && (
                <button type="button" className="text-link font-semibold" onClick={() => setResent(true)}>
                  {t("customerRecharge.resend")}
                </button>
              )}
            </p>
          )}
          <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 text-center">{t("customerRecharge.pinHint")}</p>
          <Button type="submit" className="w-full h-12 rounded-full font-semibold" disabled={pin.length !== 4}>
            {t("customerRecharge.submit")}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default PinCodeSheet;
