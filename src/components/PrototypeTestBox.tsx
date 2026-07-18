import { useState } from "react";
import { Info, ArrowUpRight, CheckCircle2 } from "lucide-react";

export interface PrototypeTestItem {
  /** The value used to fill the field — keep this just the raw test value (email, MSISDN, etc). */
  value: string;
  /** Optional trailing description shown after the value, e.g. "P-SIM, free replacement available". */
  note?: string;
}

interface PrototypeTestBoxProps {
  /** Short heading after "Prototype only — ", e.g. "test emails" or "test numbers". */
  heading: string;
  description: string;
  items: (string | PrototypeTestItem)[];
  /** Called with the raw value when its button is tapped — fill the relevant field with it. */
  onSelect: (value: string) => void;
}

/**
 * Dashed-border "prototype only" callout listing demo values (emails, MSISDNs, etc.)
 * a tester can use to exercise every case of a feature, with a one-tap button per value
 * that fills the field above instead of requiring manual retyping. Shared so every
 * current and future prototype feature gets the same box instead of a hand-rolled copy.
 */
const PrototypeTestBox = ({ heading, description, items, onSelect }: PrototypeTestBoxProps) => {
  const [filledValue, setFilledValue] = useState<string | null>(null);

  const normalized = items.map((item) => (typeof item === "string" ? { value: item } : item));

  const handleSelect = (value: string) => {
    onSelect(value);
    setFilledValue(value);
    setTimeout(() => setFilledValue((cur) => (cur === value ? null : cur)), 1500);
  };

  return (
    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Info className="w-3 h-3 text-amber-500 shrink-0" />
        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Prototype only — {heading}</p>
      </div>
      <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mb-1.5 leading-snug">{description}</p>
      <div className="space-y-1">
        {normalized.map(({ value, note }) => (
          <div key={value} className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
              <span className="font-mono">{value}</span>
              {note && <span> — {note}</span>}
            </p>
            <button
              type="button"
              onClick={() => handleSelect(value)}
              className="text-amber-500 shrink-0"
              aria-label={`Use ${value}`}
            >
              {filledValue === value ? <CheckCircle2 className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrototypeTestBox;
