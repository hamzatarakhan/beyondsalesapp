import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WidgetConfig {
  id: string;
  enabled: boolean;
}

// Order here is the default/fallback order — matches what's actually rendered on Home
// today. Widgets still commented out there (Tickets) aren't listed since there's
// nothing on Home for the dealer to toggle/reorder yet.
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "working-shift", enabled: true },
  { id: "customer-activities", enabled: true },
  { id: "sim-services", enabled: true },
  { id: "member-onboarding", enabled: true },
];

// Display labels live in i18n (home.*), not here, so switching language relabels
// widgets everywhere immediately instead of leaving stale text baked into storage.
export const WIDGET_LABEL_KEYS: Record<string, string> = {
  "working-shift": "home.workingShift.title",
  "customer-activities": "home.customerActivities",
  "sim-services": "home.simServices",
  "member-onboarding": "home.memberOnboarding",
};

interface WidgetsContextValue {
  widgets: WidgetConfig[];
  toggleWidget: (id: string) => void;
  reorderWidget: (fromIndex: number, toIndex: number) => void;
}

const WidgetsContext = createContext<WidgetsContextValue | undefined>(undefined);

// Bumped to v3 so devices with a pre-existing stored config pick up the new Working
// Shift widget at its designed front-of-list position instead of it being appended
// at the end by the missing-widget merge below.
const STORAGE_KEY = "app-widgets-v3";

function getInitialWidgets(): WidgetConfig[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as WidgetConfig[] | null;
    if (!Array.isArray(stored)) return DEFAULT_WIDGETS;
    // Merge with defaults so a newly-added widget (or one renamed/removed in code)
    // doesn't silently disappear or crash on a stale stored shape.
    const storedIds = new Set(stored.map((w) => w.id));
    const known = stored
      .filter((w) => DEFAULT_WIDGETS.some((d) => d.id === w.id))
      .map((w) => ({ id: w.id, enabled: w.enabled }));
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
