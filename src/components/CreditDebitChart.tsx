import { useMemo } from "react";
import type { Transaction } from "@/data/mockWalletData";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditDebitChartProps {
  transactions: Transaction[];
}

const CreditDebitChart = ({ transactions }: CreditDebitChartProps) => {
  const stats = useMemo(() => {
    let credit = 0;
    let debit = 0;
    let creditCount = 0;
    let debitCount = 0;

    transactions.forEach((txn) => {
      if (txn.transactionType === "credit") {
        credit += txn.amount;
        creditCount++;
      } else {
        debit += txn.amount;
        debitCount++;
      }
    });

    const netFlow = credit - debit;
    const totalVolume = credit + debit;
    const creditPercentage = totalVolume > 0 ? (credit / totalVolume) * 100 : 0;

    return { 
      credit, 
      debit, 
      netFlow, 
      creditCount, 
      debitCount,
      creditPercentage,
      totalVolume
    };
  }, [transactions]);

  const hasData = stats.credit > 0 || stats.debit > 0;

  if (!hasData) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No transaction data to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Credits & Debits */}
      <div className="flex items-center justify-between">
        {/* Credits */}
        <div className="flex-1 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-success/10 mb-2">
            <ArrowDownLeft className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.credit.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">KD</p>
          <p className="text-xs text-success font-medium mt-1">
            {stats.creditCount} credits
          </p>
        </div>

        {/* Divider with Net */}
        <div className="flex flex-col items-center px-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center mb-1",
            stats.netFlow >= 0 ? "bg-success/10" : "bg-destructive/10"
          )}>
            {stats.netFlow >= 0 ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
          <p className={cn(
            "text-sm font-bold",
            stats.netFlow >= 0 ? "text-success" : "text-destructive"
          )}>
            {stats.netFlow >= 0 ? "+" : ""}{stats.netFlow.toFixed(0)}
          </p>
          <p className="text-[10px] text-muted-foreground">Net</p>
        </div>

        {/* Debits */}
        <div className="flex-1 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 mb-2">
            <ArrowUpRight className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.debit.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">KD</p>
          <p className="text-xs text-destructive font-medium mt-1">
            {stats.debitCount} debits
          </p>
        </div>
      </div>

      {/* Simple Ratio Bar */}
      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div 
            className="h-full bg-success rounded-l-full transition-all duration-500"
            style={{ width: `${stats.creditPercentage}%` }}
          />
          <div 
            className="h-full bg-destructive rounded-r-full transition-all duration-500"
            style={{ width: `${100 - stats.creditPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{stats.creditPercentage.toFixed(0)}% in</span>
          <span className="text-foreground font-medium">{stats.totalVolume.toFixed(0)} KD total</span>
          <span>{(100 - stats.creditPercentage).toFixed(0)}% out</span>
        </div>
      </div>
    </div>
  );
};

export default CreditDebitChart;