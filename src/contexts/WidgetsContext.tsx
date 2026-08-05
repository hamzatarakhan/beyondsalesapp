import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WidgetConfig {
  id: string;
  label: string;
  enabled: boolean;
}

// Order here is the default/fallback order — matches what's actually rendered on Home
// today. Widgets still commented out there (Working Shift, Tickets) aren't listed since
// there's nothing on Home for the dealer to toggle/reorder yet.
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "sim-activation-options", label: "SIM Activation Options", enabled: true },
  { id: "customer-activities", label: "Customer Activities", enabled: true },
  { id: "sim-services", label: "SIM Services", enabled: true },
  { id: "member-onboarding", label: "Member Onboarding", enabled: true },
];

interface WidgetsContextValue {
  widgets: WidgetConfig[];
  toggleWidget: (id: string) => void;
  reorderWidget: (fromIndex: number, toIndex: number) => void;
}

const WidgetsContext = createContext<WidgetsContextValue | undefined>(undefined);

const STORAGE_KEY = "app-widgets";

function getInitialWidgets(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as WidgetConfig[] | null;
    if (!Array.isArray(stored)) return DEFAULT_WIDGETS;
    // Merge with defaults so a newly-added widget (or one renamed/removed in code)
    // doesn't silently disappear or crash on a stale stored shape.
    const storedIds = new Set(stored.map((w) => w.id));
    const known = stored.filter((w) => DEFAULT_WIDGETS.some((d) => d.id === w.id));
    const missing = DEFAULT_WIDGETS.filter((d) => !storedIds.has(d.id));
    return [...known, ...missing];
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export const WidgetsProvider = ({ children }: { children: ReactNode }) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(getInitialWidgets);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = (id: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)));
  };

  const reorderWidget = (fromIndex: number, toIndex: number) => {
    setWidgets((prev) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <WidgetsContext.Provider value={{ widgets, toggleWidget, reorderWidget }}>
      {children}
    </WidgetsContext.Provider>
  );
};

export const useWidgets = () => {
  const ctx = useContext(WidgetsContext);
  if (!ctx) throw new Error("useWidgets must be used within WidgetsProvider");
  return ctx;
};
