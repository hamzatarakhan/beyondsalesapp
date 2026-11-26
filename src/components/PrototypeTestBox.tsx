import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Info, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

export interface PrototypeTestItem {
  /** The value used to fill the field — keep this just the raw test value (email, MSISDN, etc). */
  value: string;
  /** Optional trailing description shown after the value, e.g. "P-SIM, free replacement available". */
  note?: string;
  /** Optional section label (e.g. "Prepaid" / "Postpaid") — items sharing a group render under one heading. */
  group?: string;
}

interface PrototypeTestBoxProps {
  /** Short heading after "Prototype only — ", e.g. "test emails" or "test numbers". */
  heading: string;
  description: string;
  items: (string | PrototypeTestItem)[];
  /** Called with the raw value when its button is tapped — fill the relevant field with it. */
  onSelect: (value: string) => void;
  /** Optional extra row (e.g. a prototype-only scenario switch) rendered under the items. */
  extra?: ReactNode;
}

/**
 * Dashed-border "prototype only" callout listing demo values (emails, MSISDNs, etc.)
 * a tester can use to exercise every case of a feature, with a one-tap button per value
 * that fills the field above instead of requiring manual retyping. Shared so every
 * current and future prototype feature gets the same box instead of a hand-rolled copy.
 */
const PrototypeTestBox = ({ heading, description, items, onSelect, extra }: PrototypeTestBoxProps) => {
  const { t } = useTranslation();
  const [filledValue, setFilledValue] = useState<string | null>(null);

  const normalized = items.map((item) => (typeof item === "string" ? { value: item } : item));
  const hasGroups = normalized.some((item) => item.group);
  // Preserve first-appearance order of groups; ungrouped items (if any) form their own
  // trailing "Other" bucket so nothing silently disappears when only some items are grouped.
  const groupOrder: string[] = [];
  if (hasGroups) {
    for (const item of normalized) {
      const g = item.group ?? "Other";
      if (!groupOrder.includes(g)) groupOrder.push(g);
    }
  }
  // Groups start collapsed so a long grouped list doesn't dominate the page by default.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set(groupOrder));
  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setFilledValue(value);
    setTimeout(() => setFilledValue((cur) => (cur === value ? null : cur)), 1500);
  };

  const renderItem = ({ value, note }: PrototypeTestItem) => (
    // The whole row is the button, with a visible "Use" label so testers know it's tappable.
    <button
      key={value}
      type="button"
      onClick={() => handleSelect(value)}
      className="w-full flex items-center justify-between gap-2 py-1 text-start transition-colors hover:bg-amber-100/60 active:bg-amber-100 dark:hover:bg-amber-900/20"
    >
      <span className="min-w-0 text-[10px] leading-tight text-amber-600/90 dark:text-amber-400/80">
        <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">{value}</span>
        {note && <span> — {note}</span>}
      </span>
      <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-amber-500 px-2 py-px text-[9px] font-semibold text-white">
        {filledValue === value ? <><CheckCircle2 className="w-2.5 h-2.5" />{t("common.filled")}</> : t("common.use")}
      </span>
    </button>
  );

  return (
    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-900/10 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Info className="w-3 h-3 text-amber-500 shrink-0" />
        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Prototype only — {heading}</p>
      </div>
      <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mb-1.5 leading-snug">{description}</p>
      {hasGroups ? (
        <div className="space-y-1.5">
          {groupOrder.map((group) => {
            const isCollapsed = collapsedGroups.has(group);
            return (
              <div key={group}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between gap-2 rounded-md bg-amber-100/70 dark:bg-amber-800/25 px-2 py-1"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">{group}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  )}
                </button>
                {!isCollapsed && (
                  <div className="mt-0.5 divide-y divide-amber-200/70 dark:divide-amber-800/60">
                    {normalized.filter((item) => (item.group ?? "Other") === group).map(renderItem)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-amber-200/70 dark:divide-amber-800/60">
          {normalized.map(renderItem)}
        </div>
      )}
      {extra && (
        <div className="mt-2 pt-2 border-t border-dashed border-amber-300/80 dark:border-amber-700/80">
          {extra}
        </div>
      )}
    </div>
  );
};

export default PrototypeTestBox;
