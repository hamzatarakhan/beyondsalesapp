import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** True when `verifiedEmail` (what the OTP sheet last confirmed) matches the current value. */
export const isEmailVerified = (value: string, verifiedEmail: string) =>
  !!value.trim() && value.trim() === verifiedEmail;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;
const emptyDigits = () => Array(OTP_LENGTH).fill("");

interface EmailOtpSheetProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
}

// ponytail: OTP is a stub (any 6 digits pass) until a backend exists.
export const EmailOtpSheet = ({ open, email, onClose, onVerified }: EmailOtpSheetProps) => {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(emptyDigits());
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const complete = digits.every((d) => d !== "");

  useEffect(() => {
    if (open) {
      setDigits(emptyDigits());
      setSeconds(RESEND_SECONDS);
    }
  }, [open]);

  useEffect(() => {
    if (!open || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [open, seconds]);

  const focusBox = (i: number) =>
    (document.getElementById(`email-otp-${i}`) as HTMLInputElement | null)?.focus();

  // Handles typing, autofill and paste: spreads all digits from index i onward.
  const setDigit = (i: number, v: string) => {
    const chars = v.replace(/\D/g, "").split("");
    setDigits((prev) => {
      const next = [...prev];
      if (!chars.length) next[i] = "";
      chars.slice(0, OTP_LENGTH - i).forEach((c, k) => (next[i + k] = c));
      return next;
    });
    if (chars.length) focusBox(Math.min(i + chars.length, OTP_LENGTH - 1));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) focusBox(i - 1);
    if (e.key === "Enter" && complete) onVerified();
  };

  const resend = () => {
    setDigits(emptyDigits());
    setSeconds(RESEND_SECONDS);
    focusBox(0);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent
        className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2"
        onOpenAutoFocus={(e) => { e.preventDefault(); focusBox(0); }}
      >
        <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
        <div className="relative text-center pb-5">
          <h3 className="text-lg font-bold text-foreground">{t("emailVerify.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1 break-all px-8">{t("emailVerify.subtitle", { email })}</p>
          <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center absolute end-0 top-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </DrawerClose>
        </div>
        <div className="flex gap-2 justify-center" dir="ltr">
          {digits.map((d, i) => (
            <input
              key={i}
              id={`email-otp-${i}`}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className="w-11 h-11 rounded-full border border-border bg-card text-center text-lg font-semibold text-foreground focus:outline-none focus:border-primary"
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-5">
          {t("emailVerify.didntReceive")}{" "}
          {seconds > 0 ? (
            <span className="font-semibold text-primary tabular-nums" dir="ltr">
              {`00:${String(seconds).padStart(2, "0")}`}
            </span>
          ) : (
            <button type="button" onClick={resend} className="font-semibold text-primary">
              {t("emailVerify.resend")}
            </button>
          )}
        </p>
        <Button className="w-full h-12 rounded-full font-semibold mt-5" disabled={!complete} onClick={onVerified}>
          {t("emailVerify.verify")}
        </Button>
      </DrawerContent>
    </Drawer>
  );
};

interface EmailVerifyInputProps {
  value: string;
  onChange: (v: string) => void;
  /** The email the OTP sheet last confirmed. Parent keeps it so it can gate Submit/Pay. */
  verifiedEmail: string;
  onVerifiedChange: (email: string) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
  onBlur?: () => void;
}

/** Email input + Verify button (OTP bottom sheet) + Verified badge. Editing a verified email un-verifies it. */
const EmailVerifyInput = ({
  value, onChange, verifiedEmail, onVerifiedChange, placeholder, className, invalid, onBlur,
}: EmailVerifyInputProps) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const verified = isEmailVerified(value, verifiedEmail);

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          type="email"
          inputMode="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn("h-12 rounded-xl bg-card flex-1", invalid && "border-destructive focus-visible:ring-destructive", className)}
        />
        {verified ? (
          <span className="shrink-0 flex items-center gap-1 px-3 h-12 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200">
            <Check className="w-3.5 h-3.5" /> {t("emailVerify.verified")}
          </span>
        ) : (
          <button
            type="button"
            disabled={!isValidEmail(value)}
            onClick={() => setSheetOpen(true)}
            className="shrink-0 px-4 h-12 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40"
          >
            {t("emailVerify.verifyBtn")}
          </button>
        )}
      </div>
      <EmailOtpSheet
        open={sheetOpen}
        email={value.trim()}
        onClose={() => setSheetOpen(false)}
        onVerified={() => { onVerifiedChange(value.trim()); setSheetOpen(false); }}
      />
    </>
  );
};

export default EmailVerifyInput;
