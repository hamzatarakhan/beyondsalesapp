import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export type Brand = "virgin" | "friendi";
// "loader": brief brand-specific Lottie. "splash": the app's main splash screen, reused here
// so switching brands feels like the app is rebuilding itself for the new brand.
export type SwitchPhase = "loader" | "splash" | null;

interface BrandContextValue {
  brand: Brand;
  setBrand: (b: Brand) => void;
  /** Brand currently being switched to — non-null for the whole loader→splash sequence. */
  switchingTo: Brand | null;
  switchPhase: SwitchPhase;
  /** Called by the splash screen once its own animation/timers finish. */
  finishBrandSwitch: () => void;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

const STORAGE_KEY = "app-brand";
// How long the brand-specific loader shows before handing off to the splash screen.
const LOADER_DURATION_MS = 1100;

function getInitialBrand(): Brand {
  if (typeof window === "undefined") return "virgin";
  const stored = localStorage.getItem(STORAGE_KEY) as Brand | null;
  if (stored === "virgin" || stored === "friendi") return stored;
  return "virgin";
}

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brand, setBrandState] = useState<Brand>(getInitialBrand);
  const [switchingTo, setSwitchingTo] = useState<Brand | null>(null);
  const [switchPhase, setSwitchPhase] = useState<SwitchPhase>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    document.documentElement.setAttribute("data-brand", brand);
    localStorage.setItem(STORAGE_KEY, brand);
  }, [brand]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const setBrand = (b: Brand) => {
    if (b === brand) return;
    clearTimeout(timeoutRef.current);
    setSwitchingTo(b);
    setSwitchPhase("loader");
    timeoutRef.current = setTimeout(() => {
      setSwitchPhase("splash");
    }, LOADER_DURATION_MS);
  };

  // Splash screen calls this once it's done — apply the new theme as it hands back to the app.
  const finishBrandSwitch = () => {
    setSwitchingTo((pending) => {
      if (pending) setBrandState(pending);
      return null;
    });
    setSwitchPhase(null);
  };

  return (
    <BrandContext.Provider value={{ brand, setBrand, switchingTo, switchPhase, finishBrandSwitch }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
};
