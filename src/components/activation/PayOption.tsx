import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: typeof CreditCard;
  label: string;
  description?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  /** Extra content rendered inside this same card, below the row — e.g. an insufficient-balance notice. */
  children?: ReactNode;
  /** Small confirmation badge pinned to the card's top corner — e.g. right after a wallet top-up. */
  justToppedUp?: boolean;
}

const PayOption = ({ icon: Icon, label, description, selected, disabled, onClick, children, justToppedUp }: Props) => {
  const { t } = useTranslation();
  return (
  <div
    className={cn(
      "relative w-full rounded-xl transition-colors",
      disabled
        ? "border border-border bg-muted/60"
        : selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border bg-card border-border",
    )}
  >
    {justToppedUp && (
      <span className="absolute -top-2 end-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold shadow-sm">
        {t("common.toppedUp")}
      </span>
    )}
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 p-3 disabled:cursor-not-allowed"
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", disabled ? "bg-muted-foreground/10" : "bg-primary/10")}>
        <Icon className={cn("w-4 h-4", disabled ? "text-muted-foreground" : "text-primary")} />
      </div>
      <div className="flex-1 text-start">
        <p className={cn("text-sm font-medium", disabled ? "text-muted-foreground" : "text-foreground")}>{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <span
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
          disabled ? "border-muted-foreground/30" : selected ? "border-primary" : "border-primary/40",
        )}
      >
        {selected && !disabled && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
    </button>
    {children && <div className="px-3 pb-3">{children}</div>}
  </div>
  );
};

export default PayOption;
