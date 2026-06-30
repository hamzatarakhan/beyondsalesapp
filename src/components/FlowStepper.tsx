import { ScanLine, ClipboardEdit, Wallet, ChevronRight, Check, Smartphone, FileText, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_STEPS = [
  { label: "Identity", Icon: ScanLine },
  { label: "Subscription", Icon: ClipboardEdit },
  { label: "Checkout", Icon: Wallet },
];

export const STAGED_STEPS = [
  { label: "Identity", Icon: ScanLine },
  { label: "SIM & KIT", Icon: Smartphone },
  { label: "Details", Icon: FileText },
  { label: "Checkout", Icon: Wallet },
];

export const NEW_ACTIVATION_STEPS = [
  { label: "Identity", Icon: ScanLine },
  { label: "Subscription", Icon: Settings2 },
  { label: "Checkout", Icon: Wallet },
];

interface FlowStepperProps {
  /** Zero-based index of the current step */
  current: number;
  className?: string;
  steps?: { label: string; Icon: typeof ScanLine }[];
}

const FlowStepper = ({ current, className, steps = DEFAULT_STEPS }: FlowStepperProps) => (
  <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
    {steps.map((step, i) => {
      const isActive = i === current;
      const isDone = i < current;
      const Icon = step.Icon;
      return (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors",
                isActive && "border-primary text-primary bg-card",
                isDone && "border-primary bg-primary text-primary-foreground",
                !isActive && !isDone &&
                  "border-muted-foreground/25 text-muted-foreground bg-card",
              )}
            >
              {isDone ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-5 h-5" />}
            </div>
            <span
              className={cn(
                "text-[11px] mt-1 font-medium",
                isActive || isDone ? "text-primary" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight
              className={cn(
                "w-4 h-4 -mt-4 shrink-0",
                i < current ? "text-primary" : "text-muted-foreground/40",
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

export default FlowStepper;