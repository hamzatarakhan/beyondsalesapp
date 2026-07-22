import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Fingerprint, CheckCircle2, XCircle, Scan } from "lucide-react";
import { useTranslation } from "react-i18next";
import absherIcon from "@/assets/absher-icon.svg";

const STORAGE_KEY = "semati_last_verified_at";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export const shouldShowSematiVerification = () => {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) > TWO_HOURS_MS;
};

export const markSematiVerified = () => {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
};

type Step =
  | "select"
  | "nafath_code"
  | "fingerprint_select"
  | "fingerprint_ready"
  | "absher_otp"
  | "connecting"
  | "success"
  | "failed";
export type Method = "nafath" | "fingerprint" | "absher";

interface Props {
  open: boolean;
  onClose: () => void;
  onMethodSelected?: (method: Method) => void;
  onVerified: () => void;
  audience?: "dealer" | "customer" | "manafath";
}

const SematiVerification = ({ open, onClose, onMethodSelected, onVerified, audience = "customer" }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("select");
  const [method, setMethod] = useState<Method | null>(null);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [nafathDigits, setNafathDigits] = useState<[string, string]>(["", ""]);
  const [nafathNumber, setNafathNumber] = useState<number>(22);
  const [nafathSecondsLeft, setNafathSecondsLeft] = useState<number>(60);

  useEffect(() => {
    if (open) {
      setOtp(["", "", "", "", "", ""]);
      setNafathDigits(["", ""]);
      if (audience === "dealer") {
        // Dealer verification always uses Nafath — skip the method-select screen.
        setMethod("nafath");
        setStep("nafath_code");
      } else {
        setStep("select");
        setMethod(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Nafath countdown + auto-verify when on nafath_code step
  useEffect(() => {
    if (step !== "nafath_code") return;
    setNafathNumber(Math.floor(Math.random() * 89) + 10); // 2-digit number
    setNafathSecondsLeft(60);
    const interval = setInterval(() => {
      setNafathSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    // Simulate the customer approving via Nafath app after a short delay
    const approveTimer = setTimeout(() => {
      runConnecting();
    }, 3500);
    return () => {
      clearInterval(interval);
      clearTimeout(approveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const pickMethod = (m: Method) => {
    setMethod(m);
    onMethodSelected?.(m);
    if (m === "nafath") {
      setNafathDigits(["", ""]);
      setStep("nafath_code");
    } else if (m === "fingerprint") {
      setStep("fingerprint_select");
      setTimeout(() => setStep("fingerprint_ready"), 1500);
    } else {
      setOtp(["", "", "", "", "", ""]);
      setStep("absher_otp");
    }
  };

  const runConnecting = () => {
    // Skip connecting/success/failed screens — return immediately to caller.
    markSematiVerified();
    onVerified();
  };

  const retry = () => {
    if (method) pickMethod(method);
    else setStep("select");
  };

  const setOtpDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };
  const otpFilled = otp.every((d) => d !== "");

  const setNafathDigit = (i: 0 | 1, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setNafathDigits((prev) => {
      const next: [string, string] = [...prev] as [string, string];
      next[i] = d;
      return next;
    });
    if (d && i === 0) {
      const el = document.getElementById("nafath-digit-1") as HTMLInputElement | null;
      el?.focus();
    }
  };
  const nafathFilled = nafathDigits.every((d) => d !== "");

  // Step 1: bottom sheet to pick method
  if (step === "select") {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 text-center">
              <h3 className="font-semibold text-foreground text-base">
                {audience === "dealer" ? t("activation.verification.dealerTitle") : audience === "manafath" ? t("activation.verification.manafathTitle") : t("activation.verification.customerTitle")}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground"
              aria-label={t("activation.verification.cancel")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mb-5 px-6">
            {audience === "dealer"
              ? t("activation.verification.dealerDesc")
              : audience === "manafath"
              ? t("activation.verification.manafathDesc")
              : t("activation.verification.customerDesc")}
          </p>

          <div className="space-y-3">
            <MethodCard
              onClick={() => pickMethod("nafath")}
              iconBg="bg-teal-500"
              iconContent={
                <span className="text-white text-[10px] font-bold tracking-tight" dir="rtl">
                  نفاذ
                </span>
              }
              title={audience === "manafath" ? t("activation.verification.manafath") : t("activation.verification.nafath")}
              desc={audience === "manafath" ? t("activation.verification.manafathMethodDesc") : t("activation.verification.nafathMethodDesc")}
            />
            {audience !== "manafath" && (
              <>
                <MethodCard
                  onClick={() => pickMethod("fingerprint")}
                  iconBg="bg-rose-100 dark:bg-rose-500/15"
                  iconContent={<Fingerprint className="w-5 h-5 text-rose-500" />}
                  title={t("activation.verification.fingerprint")}
                  desc={t("activation.verification.fingerprintMethodDesc")}
                />
                <MethodCard
                  onClick={() => pickMethod("absher")}
                  iconBg=""
                  iconContent={<img src={absherIcon} alt="Absher" className="w-10 h-10" />}
                  title={t("activation.verification.absher")}
                  desc={t("activation.verification.absherMethodDesc")}
                />
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Steps 2-4: centered dialog card
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[320px] rounded-3xl border-0 p-8 text-center [&>button]:hidden">
        {step === "nafath_code" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold" dir="rtl">نفاذ</span>
            </div>
            <h4 className="font-semibold text-teal-600 -mt-1">{t("activation.verification.nafathVerification")}</h4>
            <div className="w-full rounded-xl bg-sky-50 border border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20 px-3 py-2 text-start flex gap-2">
              <span className="text-sky-500 text-sm">ⓘ</span>
              <div>
                <p className="text-[12px] font-semibold text-sky-700 dark:text-sky-300">{t("activation.verification.actionRequired")}</p>
                <p className="text-[11px] text-sky-700/80 dark:text-sky-200/80 leading-snug">
                  {audience === "dealer" ? t("activation.verification.nafathInstructionSelf") : t("activation.verification.nafathInstructionCustomer")}
                </p>
              </div>
            </div>
            <div className="w-full rounded-xl bg-muted/40 border border-border px-3 py-3 flex flex-col items-center gap-2">
              <p className="text-[12px] text-muted-foreground">{t("activation.verification.verificationNumber")}</p>
              <div className="w-full rounded-lg bg-card border border-border py-3 flex items-center justify-center">
                <span className="text-4xl font-extrabold text-primary tracking-wide">{nafathNumber}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("activation.verification.timeRemaining")}{" "}
                <span className="text-sky-600 font-semibold">
                  {Math.floor(nafathSecondsLeft / 60)}:{String(nafathSecondsLeft % 60).padStart(2, "0")}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm"
            >
              {t("activation.verification.cancel")}
            </button>
          </div>
        )}

        {(step === "fingerprint_select" || step === "fingerprint_ready") && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/15 flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-rose-500" />
            </div>
            <h4 className="font-semibold text-foreground">{t("activation.verification.fingerprintVerification")}</h4>
            <HandsDiagram active={step === "fingerprint_ready"} />
            <p className="text-[11px] text-muted-foreground">
              {step === "fingerprint_ready"
                ? t("activation.verification.fingerReady")
                : t("activation.verification.fingerSelecting")}
            </p>
            <button
              disabled={step !== "fingerprint_ready"}
              onClick={runConnecting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm disabled:bg-muted disabled:text-muted-foreground"
            >
              {t("activation.verification.start")}
            </button>
            <button onClick={onClose} className="text-primary text-sm font-medium">
              {t("activation.verification.cancel")}
            </button>
          </div>
        )}

        {step === "absher_otp" && (
          <div className="flex flex-col items-center gap-3">
            <img src={absherIcon} alt="Absher" className="w-12 h-12" />
            <h4 className="font-semibold text-foreground">{t("activation.verification.absherVerification")}</h4>
            <div className="w-full rounded-xl bg-sky-50 border border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20 px-3 py-2 text-start flex gap-2">
              <span className="text-sky-500 text-sm">ⓘ</span>
              <div>
                <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">{t("activation.verification.actionRequired")}</p>
                <p className="text-[10px] text-sky-700/80 dark:text-sky-200/80 leading-snug">
                  {t("activation.verification.absherInstruction")}
                </p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground self-start">{t("activation.verification.absherCode")}</p>
            <div className="flex gap-2 w-full justify-between">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigit(i, e.target.value)}
                  className="w-9 h-10 rounded-full border border-border text-center text-sm font-semibold focus:outline-none focus:border-primary"
                />
              ))}
            </div>
            <button
              disabled={!otpFilled}
              onClick={runConnecting}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm mt-2 disabled:bg-muted disabled:text-muted-foreground"
            >
              {t("activation.verification.submit")}
            </button>
            <button onClick={onClose} className="text-primary text-sm font-medium">
              {t("activation.verification.cancel")}
            </button>
          </div>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Scan className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                {t("activation.verification.connectingTo", { app: method === "nafath" ? t("activation.verification.nafath") : method === "absher" ? t("activation.verification.absherApp") : t("activation.verification.device") })}
              </h4>
              <p className="text-xs text-muted-foreground">
                {t("activation.verification.connectingDesc")}
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" strokeWidth={2} />
            <div>
              <h4 className="font-semibold text-foreground mb-1">{t("activation.verification.successTitle")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("activation.verification.successDesc")}
              </p>
            </div>
          </div>
        )}

        {step === "failed" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-16 h-16 text-primary" strokeWidth={2} />
            <div>
              <h4 className="font-semibold text-foreground mb-1">{t("activation.verification.failedTitle")}</h4>
              <p className="text-xs text-muted-foreground">
                {t("activation.verification.failedDesc")}
              </p>
            </div>
            <button
              onClick={retry}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm mt-2"
            >
              {t("activation.verification.again")}
            </button>
            <button
              onClick={onClose}
              className="text-primary text-sm font-medium"
            >
              {t("activation.verification.cancel")}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const MethodCard = ({
  onClick,
  iconBg,
  iconContent,
  title,
  desc,
}: {
  onClick: () => void;
  iconBg: string;
  iconContent: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <button
    onClick={onClick}
    className="w-full bg-card border border-border rounded-2xl p-3 flex items-center gap-3 text-start shadow-sm active:scale-[0.99] transition-transform"
  >
    <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
      {iconContent}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
    </div>
    <span className="text-muted-foreground">›</span>
  </button>
);

const HandsDiagram = ({ active }: { active: boolean }) => (
  <div className="w-full rounded-xl border border-border py-3 flex items-center justify-center gap-3">
    <svg viewBox="0 0 80 90" className="w-16 h-20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 80 V45 C20 40 24 38 26 42 V25 C26 21 32 21 32 25 V40 M32 40 V18 C32 14 38 14 38 18 V40 M38 40 V22 C38 18 44 18 44 22 V44 M44 44 V28 C44 25 50 25 50 28 V60 C50 72 42 80 32 80 Z" />
      {active && <circle cx="26" cy="40" r="3.5" fill="hsl(var(--primary))" stroke="none" />}
    </svg>
    <svg viewBox="0 0 80 90" className="w-16 h-20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M60 80 V45 C60 40 56 38 54 42 V25 C54 21 48 21 48 25 V40 M48 40 V18 C48 14 42 14 42 18 V40 M42 40 V22 C42 18 36 18 36 22 V44 M36 44 V28 C36 25 30 25 30 28 V60 C30 72 38 80 48 80 Z" />
    </svg>
  </div>
);

export default SematiVerification;