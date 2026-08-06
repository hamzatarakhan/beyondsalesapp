import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PhoneNumberInputProps {
  /** Full local number with its leading 0 (e.g. "0501234567"), or "" when empty. */
  value: string;
  /** Receives the full local number with a leading 0 reattached, or "" when cleared. */
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Switches the border/ring to the destructive color, matching the app's error-state Inputs. */
  error?: boolean;
  /** Optional trailing icon, e.g. a Phone icon. */
  icon?: ReactNode;
}

// Saudi mobile numbers are always entered as +966 followed by the 9-digit local number
// (the leading 0 of the domestic 05XXXXXXXX form is dropped). The leading-0 reattachment
// happens here, not at call sites, so an emptied field reports back "" rather than a
// stray "0" that would read as "filled" by a truthy required-field check. Locked to
// dir="ltr" like the app's OTP digit rows, so the prefix and digits always read
// left-to-right regardless of the active app language.
const PhoneNumberInput = ({ value, onChange, onBlur, placeholder = "5XXXXXXXX", className, disabled, error, icon }: PhoneNumberInputProps) => (
  <div
    dir="ltr"
    className={cn(
      "flex items-center h-12 rounded-xl border border-input bg-card ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      error && "border-destructive focus-within:ring-destructive",
      disabled && "opacity-50 cursor-not-allowed",
      className,
    )}
  >
    <span className="shrink-0 px-3 h-full flex items-center text-sm font-medium text-muted-foreground border-e border-input">
      +966
    </span>
    <input
      type="text"
      inputMode="numeric"
      value={value.replace(/^0/, "")}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
        onChange(digits ? "0" + digits : "");
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className="flex-1 min-w-0 h-full bg-transparent px-3 text-sm placeholder:text-muted-foreground outline-none disabled:cursor-not-allowed"
    />
    {icon && <span className="shrink-0 pe-3 text-muted-foreground flex items-center">{icon}</span>}
  </div>
);

export default PhoneNumberInput;
