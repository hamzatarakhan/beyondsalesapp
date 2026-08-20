import { createContext, useContext, useRef, useState, ReactNode } from "react";

// Single source of truth for the dealer's wallet balance, shared across every flow that
// charges against it (Bill Payment, Credit Transfer, SIM Termination, Subscription
// Migration, SIM Activation, etc.) — a top-up in one flow should be reflected everywhere.
export const INITIAL_DEALER_WALLET_BALANCE = 550;

// How long the "just topped up" badge stays on the Dealer Wallet option after a recharge.
const JUST_TOPPED_UP_DURATION_MS = 8000;

interface WalletBalanceContextValue {
  balance: number;
  topUp: (amount: number) => void;
  /** True for a short window right after a top-up — lets the Dealer Wallet pay option show
   * a brief confirmation badge once the dealer returns to whatever flow they were in. */
  justToppedUp: boolean;
}

const WalletBalanceContext = createContext<WalletBalanceContextValue | undefined>(undefined);

export const WalletBalanceProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(INITIAL_DEALER_WALLET_BALANCE);
  const [justToppedUp, setJustToppedUp] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout>>();

  const topUp = (amount: number) => {
    setBalance((prev) => Math.round((prev + amount) * 100) / 100);
    setJustToppedUp(true);
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setJustToppedUp(false), JUST_TOPPED_UP_DURATION_MS);
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
