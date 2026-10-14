import { memo } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceTabProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "filled" | "underline";
  disabled?: boolean;
  className?: string;
}

// Plain button (no ghost hover/transition) so taps switch instantly and no
// sticky hover highlight lingers on the previously tapped tab on touch devices.
export const SourceTab = memo(({
  active,
  icon: Icon,
  label,
  onClick,
  variant = "underline",
  disabled = false,
  className,
}: SourceTabProps) => (
  <button
    type="button"
    disabled={disabled}
    aria-pressed={active}
    // Switch on press-down for immediate feedback; keep click for keyboard.
    onPointerDown={(e) => {
      if (disabled || active || e.button !== 0) return;
      onClick();
    }}
    onClick={() => { if (!disabled && !active) onClick(); }}
    className={cn(
      "flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold select-none touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-ring",
      variant === "filled" && (
        active
          ? "bg-primary text-primary-foreground rounded-xl"
          : "bg-muted text-foreground rounded-xl active:bg-muted/70"
      ),
      variant === "underline" && (
        active ? "relative text-primary" : "relative text-muted-foreground"
      ),
      disabled && "opacity-40 cursor-not-allowed",
      className
    )}
  >
    <Icon className="w-4 h-4 shrink-0" />
    {label}
    {variant === "underline" && active && (
      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
    )}
  </button>
));

export default SourceTab;
