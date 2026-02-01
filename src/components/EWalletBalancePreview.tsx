import { Wallet } from "lucide-react";
import { parentWallets } from "@/data/mockWalletData";

const EWalletBalancePreview = () => {
  // Calculate total balance across all wallets
  const totalBalance = parentWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-4 text-primary-foreground">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium opacity-90">E-Wallet Balance</span>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-2xl font-bold">{totalBalance.toFixed(2)} KD</p>
        <p className="text-xs opacity-75">Total across all wallets</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {parentWallets.map((wallet) => (
          <div
            key={wallet.id}
            className="bg-primary-foreground/10 rounded-xl px-3 py-2"
          >
            <p className="text-xs opacity-75">{wallet.name}</p>
            <p className="text-sm font-semibold">{wallet.balance.toFixed(2)} {wallet.currency}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EWalletBalancePreview;
