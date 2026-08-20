import { createContext, useContext, useState, ReactNode } from "react";

// Single source of truth for the dealer's wallet balance, shared across every flow that
// charges against it (Bill Payment, Credit Transfer, SIM Termination, Subscription
// Migration, SIM Activation, etc.) — a top-up in one flow should be reflected everywhere.
export const INITIAL_DEALER_WALLET_BALANCE = 550;

interface WalletBalanceContextValue {
  balance: number;
  topUp: (amount: number) => void;
}

const WalletBalanceContext = createContext<WalletBalanceContextValue | undefined>(undefined);

export const WalletBalanceProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(INITIAL_DEALER_WALLET_BALANCE);

  const topUp = (amount: number) => {
    setBalance((prev) => Math.round((prev + amount) * 100) / 100);
  };

  return (
    <WalletBalanceContext.Provider value={{ balance, topUp }}>
      {children}
    </WalletBalanceContext.Provider>
  );
};

export const useWalletBalance = () => {
  const ctx = useContext(WalletBalanceContext);
  if (!ctx) throw new Error("useWalletBalance must be used within WalletBalanceProvider");
  return ctx;
};
