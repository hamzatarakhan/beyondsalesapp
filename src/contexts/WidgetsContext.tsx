import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WidgetConfig {
  id: string;
  enabled: boolean;
}

// Order here is the default/fallback order — matches what's actually rendered on Home
// today. Widgets still commented out there (Tickets) aren't listed since there's
// nothing on Home for the dealer to toggle/reorder yet.
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "customer-activities", enabled: true },
  { id: "credit-limit-options", enabled: true },
  { id: "subscription-migration-options", enabled: true },
  { id: "sim-services", enabled: true },
  { id: "e-wallets", enabled: true },
  { id: "member-onboarding", enabled: true },
  { id: "dealer-visit", enabled: true },
  { id: "tickets", enabled: true },
  { id: "working-shift", enabled: true },
];

// Display labels live in i18n (home.*), not here, so switching language relabels
// widgets everywhere immediately instead of leaving stale text baked into storage.
export const WIDGET_LABEL_KEYS: Record<string, string> = {
  "working-shift": "home.workingShift.title",
  "customer-activities": "home.customerActivities",
  "e-wallets": "home.eWallets",
  "credit-limit-options": "home.creditLimitOptions.title",
  "subscription-migration-options": "home.subscriptionMigrationOptions.title",
  "sim-services": "home.simServices",
  "member-onboarding": "home.memberOnboarding",
  "dealer-visit": "home.dealerVisit.title",
  "tickets": "home.tickets.title",
};

interface WidgetsContextValue {
  widgets: WidgetConfig[];
  toggleWidget: (id: string) => void;
  reorderWidget: (fromIndex: number, toIndex: number) => void;
}

const WidgetsContext = createContext<WidgetsContextValue | undefined>(undefined);

// Bumped to v9 so devices that already stored E Wallets (appended right after Customer
// Activities by the missing-widget merge below when it first shipped) pick up its new
// default position under SIM Services instead of staying wherever it first landed.
const STORAGE_KEY = "app-widgets-v9";

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

  // Debounced — a drag-to-reorder can update `widgets` many times a second, and a
  // synchronous localStorage write on every single step was a real source of jank there.
  // Collapses rapid-fire updates into one write shortly after they settle.
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    }, 150);
    return () => clearTimeout(timer);
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
