import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

export type Brand = "virgin" | "friendi";

interface BrandContextValue {
  brand: Brand;
  setBrand: (b: Brand) => void;
  /** Brand currently being switched to — non-null while its loader plays. */
  switchingTo: Brand | null;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

const STORAGE_KEY = "app-brand";
// How long the brand-specific loader shows before the switch takes effect.
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
    timeoutRef.current = setTimeout(() => {
      setBrandState(b);
      setSwitchingTo(null);
    }, LOADER_DURATION_MS);
  };

  return (
    <BrandContext.Provider value={{ brand, setBrand, switchingTo }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
};
