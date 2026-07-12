import { ComponentType } from "react";
import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
}

const DefaultSimIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="3" width="12" height="18" rx="2" />
    <path d="M10 8h4M10 12h4M10 16h4" />
  </svg>
);

const SimCard = ({ active, label, onClick, disabled, icon: Icon = DefaultSimIcon }: Props) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={cn(
      "relative flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all border",
      active ? "bg-primary/10 border-primary/30" : "bg-card border-border/60",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", active ? "bg-primary/15" : "bg-muted")}>
      <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
    </div>
    <p className={cn("text-sm font-semibold", active ? "text-foreground" : "text-muted-foreground")}>{label}</p>
    <span
      className={cn(
        "ml-auto w-4 h-4 rounded-full border-2 shrink-0",
        active ? "border-primary bg-primary" : "border-muted-foreground/30",
      )}
    >
      {active && <span className="block w-1.5 h-1.5 bg-card rounded-full m-auto mt-[3px]" />}
    </span>
  </button>
);

export default SimCard;