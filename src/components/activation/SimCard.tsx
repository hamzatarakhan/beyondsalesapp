import { cn } from "@/lib/utils";

interface Props {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const SimCard = ({ active, label, onClick, disabled }: Props) => (
  <button
    type="button"
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={cn(
      "relative rounded-2xl p-4 flex flex-col items-start gap-2 transition-all text-left",
      active ? "bg-primary/10 ring-1 ring-primary/30" : "bg-card shadow-sm",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M10 8h4M10 12h4M10 16h4" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-foreground">{label}</p>
    <span
      className={cn(
        "absolute top-3 right-3 w-4 h-4 rounded-full border-2",
        active ? "border-primary bg-primary" : "border-primary/40",
      )}
    >
      {active && <span className="block w-1.5 h-1.5 bg-card rounded-full m-auto mt-[3px]" />}
    </span>
  </button>
);

export default SimCard;