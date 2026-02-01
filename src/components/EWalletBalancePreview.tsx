import { Wallet } from "lucide-react";
import { parentWallets } from "@/data/mockWalletData";

const EWalletBalancePreview = () => {
  // Calculate total balance across all wallets
  const totalBalance = parentWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <div className="space-y-3">
      {/* Total Balance Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-xl font-bold text-foreground">{totalBalance.toFixed(2)} KD</p>
          </div>
        </div>
      </div>

      {/* Horizontally Scrolling Wallet Cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {parentWallets.map((wallet) => (
          <div
            key={wallet.id}
            className="flex-shrink-0 w-40 bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 text-primary-foreground"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center mb-3">
              <Wallet className="w-4 h-4" />
            </div>
            <p className="text-xs opacity-75 mb-1">{wallet.name}</p>
            <p className="text-lg font-bold">{wallet.balance.toFixed(2)} <span className="text-sm font-normal">{wallet.currency}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EWalletBalancePreview;
