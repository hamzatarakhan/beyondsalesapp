import { createContext, useContext, useState, ReactNode } from "react";

interface WalletTopUpOverlayContextValue {
  open: boolean;
  openTopUp: () => void;
  closeTopUp: () => void;
}

const WalletTopUpOverlayContext = createContext<WalletTopUpOverlayContextValue | undefined>(undefined);

// Renders eWallet Recharge as a full-screen overlay ON TOP of whatever flow triggered it,
// instead of routing to /wallet-recharge — the calling page never unmounts, so all of its
// in-progress state (step, selections, lookups, signatures, everything) is still there
// exactly as left the moment the overlay closes. No snapshot/restore needed.
export const WalletTopUpOverlayProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <WalletTopUpOverlayContext.Provider value={{ open, openTopUp: () => setOpen(true), closeTopUp: () => setOpen(false) }}>
      {children}
    </WalletTopUpOverlayContext.Provider>
  );
};

export const useWalletTopUpOverlay = () => {
  const ctx = useContext(WalletTopUpOverlayContext);
  if (!ctx) throw new Error("useWalletTopUpOverlay must be used within WalletTopUpOverlayProvider");
  return ctx;
};
