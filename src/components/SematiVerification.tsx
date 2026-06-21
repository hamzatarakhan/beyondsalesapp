import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Fingerprint, CheckCircle2, XCircle, Scan } from "lucide-react";

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

export type Method = "nafath" | "fingerprint" | "absher";

interface Props {
  open: boolean;
  onClose: () => void;
  onMethodSelected?: (method: Method) => void;
  onVerified: () => void;
}

const SematiVerification = ({ open, onClose, onMethodSelected, onVerified }: Props) => {
  const [step, setStep] = useState<Step>("select");
  const [method, setMethod] = useState<Method | null>(null);

  useEffect(() => {
    if (open) {
      setStep("select");
      setMethod(null);
    }
  }, [open]);

  const startVerification = (m: Method) => {
    setMethod(m);
    onMethodSelected?.(m);
    setStep("connecting");
    // Simulate a connection / verification call. ~85% success rate.
    setTimeout(() => {
      const ok = Math.random() < 0.85;
      setStep(ok ? "success" : "failed");
      if (ok) {
        markSematiVerified();
        setTimeout(() => {
          onVerified();
        }, 1200);
      }
    }, 1800);
  };

  const retry = () => {
    if (method) startVerification(method);
    else setStep("select");
  };

  // Step 1: bottom sheet to pick method
  if (step === "select") {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 text-center">
              <h3 className="font-semibold text-foreground text-base">
                Semati Verification
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-muted-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mb-5 px-6">
            Select a verification method to verify the channel member's identity.
          </p>

          <div className="space-y-3">
            <MethodCard
              onClick={() => startVerification("nafath")}
              iconBg="bg-teal-500"
              iconContent={
                <span className="text-white text-[10px] font-bold tracking-tight" dir="rtl">
                  نفاذ
                </span>
              }
              title="Nafath Verification"
              desc="Approve the verification request through the Nafath app."
            />
            <MethodCard
              onClick={() => startVerification("fingerprint")}
              iconBg="bg-rose-100"
              iconContent={<Fingerprint className="w-5 h-5 text-rose-500" />}
              title="Fingerprint Verification"
              desc="Verify your identity using your device fingerprint."
            />
            <MethodCard
              onClick={() => startVerification("absher")}
              iconBg="bg-emerald-100"
              iconContent={<Scan className="w-5 h-5 text-emerald-600" />}
              title="Absher OTP Verification"
              desc="Enter the one-time password received through Absher."
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Steps 2-4: centered dialog card
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[320px] rounded-3xl border-0 p-8 text-center [&>button]:hidden">
        {step === "connecting" && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Scan className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">
                Connecting To {method === "nafath" ? "Nafath" : method === "absher" ? "Absher" : "Device"} App
              </h4>
              <p className="text-xs text-muted-foreground">
                We're confirming your verification and preparing the next step.
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" strokeWidth={2} />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Verified Successfully !</h4>
              <p className="text-xs text-muted-foreground">
                Your identity has been verified successfully.
              </p>
            </div>
          </div>
        )}

        {step === "failed" && (
          <div className="flex flex-col items-center gap-3">
            <XCircle className="w-16 h-16 text-primary" strokeWidth={2} />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Verification Failed !</h4>
              <p className="text-xs text-muted-foreground">
                The verification could not be completed. Please try again.
              </p>
            </div>
            <button
              onClick={retry}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm mt-2"
            >
              Again
            </button>
            <button
              onClick={onClose}
              className="text-primary text-sm font-medium"
            >
              Cancel
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
    className="w-full bg-card border border-border rounded-2xl p-3 flex items-center gap-3 text-left shadow-sm active:scale-[0.99] transition-transform"
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

export default SematiVerification;