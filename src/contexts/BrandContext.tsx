import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Brand = "virgin" | "friendi";

interface BrandContextValue {
  brand: Brand;
  setBrand: (b: Brand) => void;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

const STORAGE_KEY = "app-brand";

function getInitialBrand(): Brand {
  if (typeof window === "undefined") return "virgin";
  const stored = localStorage.getItem(STORAGE_KEY) as Brand | null;
  if (stored === "virgin" || stored === "friendi") return stored;
  return "virgin";
}

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const [brand, setBrandState] = useState<Brand>(getInitialBrand);

  useEffect(() => {
    document.documentElement.setAttribute("data-brand", brand);
    localStorage.setItem(STORAGE_KEY, brand);
  }, [brand]);

  const setBrand = (b: Brand) => setBrandState(b);

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used within BrandProvider");
  return ctx;
};
