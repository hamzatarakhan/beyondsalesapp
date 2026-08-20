import { useNavigate } from "react-router-dom";
import { AlertCircle, Zap } from "lucide-react";

interface WalletShortNoticeProps {
  message: string;
  buttonLabel: string;
}

/**
 * Insufficient-wallet-balance banner + "Top up now" action, shared by every payment flow
 * that charges the Dealer Wallet. Top up now navigates to the full eWallet Recharge page
 * rather than opening an inline sheet — the dealer picks the flow back up manually after.
 */
const WalletShortNotice = ({ message, buttonLabel }: WalletShortNoticeProps) => {
  const navigate = useNavigate();
  return (
    <div className="mt-2 space-y-2">
      <div className="rounded-xl bg-destructive/10 px-3 py-2.5 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
        <p className="text-[12px] font-medium text-destructive">{message}</p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/wallet-recharge")}
        className="w-full py-2.5 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-1.5"
      >
        {buttonLabel}
        <Zap className="w-4 h-4" />
      </button>
    </div>
  );
};

export default WalletShortNotice;
