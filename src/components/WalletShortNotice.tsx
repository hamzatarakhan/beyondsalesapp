import { useNavigate, useLocation } from "react-router-dom";
import { Info, Zap } from "lucide-react";

interface WalletShortNoticeProps {
  message: string;
  buttonLabel: string;
}

/**
 * Insufficient-wallet-balance banner + "Top up now" action, shared by every payment flow
 * that charges the Dealer Wallet. Navigates to the full eWallet Recharge page (passing the
 * current location so a successful recharge sends the dealer back to this exact flow)
 * rather than opening an inline sheet.
 */
const WalletShortNotice = ({ message, buttonLabel }: WalletShortNoticeProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mt-2 space-y-2">
      <div className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2.5 flex items-center gap-2">
        <Info className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
        <p className="text-[12px] font-medium text-red-600 dark:text-red-400">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/wallet-recharge", { state: { returnTo: location.pathname + location.search } })}
        className="w-full py-2.5 rounded-full bg-violet-100 dark:bg-violet-500/15 border border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-300 font-semibold text-sm flex items-center justify-center gap-1.5"
      >
        {buttonLabel}
        <Zap className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WalletShortNotice;
