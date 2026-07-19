import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: typeof CreditCard;
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}

const PayOption = ({ icon: Icon, label, description, selected, onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
      selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border",
    )}
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="flex-1 text-start">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <span
      className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
        selected ? "border-primary" : "border-primary/40",
      )}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
    </span>
  </button>
);

export default PayOption;