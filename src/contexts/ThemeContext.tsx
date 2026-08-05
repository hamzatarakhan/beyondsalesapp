import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** The dealer's stored preference — may be "system". */
  themeMode: ThemeMode;
  /** The actually-applied theme, with "system" already resolved to light/dark. */
  theme: ResolvedTheme;
  setThemeMode: (m: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "app-theme";

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function getInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getInitialMode);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  // Track the OS preference live so a dealer on "System" sees the app follow it
  // without needing to reopen the app.
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemTheme(mql.matches ? "dark" : "light");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Dark mode is temporarily disabled app-wide — light always renders regardless of
  // the dealer's stored preference or OS setting. themeMode/setThemeMode still track
  // and persist the dealer's choice normally so the Settings picker keeps working;
  // swap the line below back to the commented one to re-enable actually applying it.
  // const theme: ResolvedTheme = themeMode === "system" ? systemTheme : themeMode;
  const theme = "light" as ResolvedTheme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
  }, [themeMode]);

  const setThemeMode = (m: ThemeMode) => setThemeModeState(m);
  const toggleTheme = () => setThemeModeState((prev) => {
    const current = prev === "system" ? systemTheme : prev;
    return current === "dark" ? "light" : "dark";
  });

  return (
    <ThemeContext.Provider value={{ themeMode, theme, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
