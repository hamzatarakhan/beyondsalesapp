import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import nafithLogo from "@/assets/nafith-logo.svg";

type Step = "notice" | "waiting";

interface Props {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

// Dedicated Nafith promissory-note verification modal — opens directly into the
// notice/waiting states (no method-select step) since Nafith is the only method here.
const NafithVerificationModal = ({ open, onClose, onVerified }: Props) => {
  const [step, setStep] = useState<Step>("notice");

  const runValidation = () => {
    setStep("waiting");
    setTimeout(() => {
      onVerified();
    }, 3000);
  };

  useEffect(() => {
    if (open) setStep("notice");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[320px] rounded-3xl border-0 p-8 text-center [&>button]:hidden">
        {step === "notice" && (
          <div className="flex flex-col items-center gap-4">
            <img src={nafithLogo} alt="Nafith" className="h-10" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Customer Action Needed</h4>
              <p className="text-xs text-muted-foreground">
                There's an additional promissory note linked to this application. Please inform the customer to review and accept it in Nafith to proceed.
              </p>
            </div>
            <button
              onClick={runValidation}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm"
            >
              Continue
            </button>
            <button onClick={onClose} className="text-primary text-sm font-medium">
              Cancel
            </button>
          </div>
        )}

        {step === "waiting" && (
          <div className="flex flex-col items-center gap-4">
            <img src={nafithLogo} alt="Nafith" className="h-10" />
            <div>
              <h4 className="font-semibold text-foreground mb-1">Waiting for Nafith Validation</h4>
              <p className="text-xs text-muted-foreground">
                We're validating your information with Nafith. You'll be redirected automatically once it's complete.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NafithVerificationModal;
