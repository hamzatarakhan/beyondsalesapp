import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Single source of truth for the dealer's wallet balance, shared across every flow that
// charges against it (Bill Payment, Credit Transfer, SIM Termination, Subscription
// Migration, SIM Activation, etc.) — a top-up in one flow should be reflected everywhere.
export const INITIAL_DEALER_WALLET_BALANCE = 550;

interface WalletBalanceContextValue {
  balance: number;
  topUp: (amount: number) => void;
  /** True once a top-up has happened this session — lets the Dealer Wallet pay option show
   * a "Topped up" badge once the dealer returns to whatever flow they were in. */
  justToppedUp: boolean;
}

const WalletBalanceContext = createContext<WalletBalanceContextValue | undefined>(undefined);

export const WalletBalanceProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(INITIAL_DEALER_WALLET_BALANCE);
  const [justToppedUp, setJustToppedUp] = useState(false);

  // Badge is transient — clear it shortly after the dealer is back in their flow.
  useEffect(() => {
    if (!justToppedUp) return;
    const id = setTimeout(() => setJustToppedUp(false), 20000);
    return () => clearTimeout(id);
  }, [justToppedUp, balance]);

  const topUp = (amount: number) => {
    setBalance((prev) => Math.round((prev + amount) * 100) / 100);
    setJustToppedUp(true);
  };

  return (
    <WalletBalanceContext.Provider value={{ balance, topUp, justToppedUp }}>
      {children}
    </WalletBalanceContext.Provider>
  );
};

export const useWalletBalance = () => {
  const ctx = useContext(WalletBalanceContext);
  if (!ctx) throw new Error("useWalletBalance must be used within WalletBalanceProvider");
  return ctx;
};
