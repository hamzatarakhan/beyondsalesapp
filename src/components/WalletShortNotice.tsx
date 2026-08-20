import { Info, Zap } from "lucide-react";
import { useWalletTopUpOverlay } from "@/contexts/WalletTopUpOverlayContext";

interface WalletShortNoticeProps {
  message: string;
  buttonLabel: string;
}

/**
 * Compact insufficient-balance notice + "Top up now" action, rendered inside the Dealer
 * Wallet PayOption card itself (as its children). Opens eWallet Recharge as a full-screen
 * overlay on top of the current flow instead of routing to it — the flow stays mounted
 * underneath, so all of its state is exactly as left once the overlay closes.
 */
const WalletShortNotice = ({ message, buttonLabel }: WalletShortNoticeProps) => {
  const { openTopUp } = useWalletTopUpOverlay();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-destructive shrink-0" />
        <p className="text-[11px] font-medium text-destructive">{message}</p>
      </div>
      <button
        type="button"
        onClick={openTopUp}
        className="w-full py-2 rounded-lg bg-primary/10 text-primary font-semibold text-xs flex items-center justify-center gap-1"
      >
        {buttonLabel}
        <Zap className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default WalletShortNotice;
