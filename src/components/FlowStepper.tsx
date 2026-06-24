import { ScanLine, ClipboardEdit, Wallet, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Identity", Icon: ScanLine },
  { label: "Subscription", Icon: ClipboardEdit },
  { label: "Checkout", Icon: Wallet },
];

interface FlowStepperProps {
  /** Zero-based index of the current step (0 = Identity, 1 = Subscription, 2 = Checkout) */
  current: number;
  className?: string;
}

const FlowStepper = ({ current, className }: FlowStepperProps) => (
  <div className={cn("flex items-center justify-center gap-2 py-4", className)}>
    {STEPS.map((step, i) => {
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
          {i < STEPS.length - 1 && (
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