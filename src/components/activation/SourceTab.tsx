import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceTabProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "filled" | "underline";
}

export const SourceTab = ({
  active,
  icon: Icon,
  label,
  onClick,
  variant = "underline",
}: SourceTabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors",
      variant === "filled" && (
        active
          ? "bg-primary text-primary-foreground rounded-xl"
          : "bg-muted text-foreground rounded-xl"
      ),
      variant === "underline" && (
        active
          ? "relative text-primary"
          : "relative text-muted-foreground hover:text-foreground"
      )
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
    {variant === "underline" && active && (
      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
    )}
  </button>
);

export default SourceTab;
