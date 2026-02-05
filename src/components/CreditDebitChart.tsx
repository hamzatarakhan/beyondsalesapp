import { useMemo } from "react";
import type { Transaction } from "@/data/mockWalletData";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface CreditDebitChartProps {
  transactions: Transaction[];
}

const CreditDebitChart = ({ transactions }: CreditDebitChartProps) => {
  const stats = useMemo(() => {
    let credit = 0;
    let debit = 0;
    let creditCount = 0;
    let debitCount = 0;
    let largestCredit = 0;
    let largestDebit = 0;

    transactions.forEach((txn) => {
      if (txn.transactionType === "credit") {
        credit += txn.amount;
        creditCount++;
        if (txn.amount > largestCredit) largestCredit = txn.amount;
      } else {
        debit += txn.amount;
        debitCount++;
        if (txn.amount > largestDebit) largestDebit = txn.amount;
      }
    });

    const netFlow = credit - debit;
    const totalCount = creditCount + debitCount;
    const totalVolume = credit + debit;
    const avgTransaction = totalCount > 0 ? totalVolume / totalCount : 0;
    const creditPercentage = totalVolume > 0 ? (credit / totalVolume) * 100 : 0;
    const debitPercentage = totalVolume > 0 ? (debit / totalVolume) * 100 : 0;

    return { 
      credit, 
      debit, 
      netFlow, 
      totalCount, 
      totalVolume,
      avgTransaction, 
      creditCount, 
      debitCount,
      creditPercentage,
      debitPercentage,
      largestCredit,
      largestDebit
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
    <div className="space-y-4">
      {/* Visual Comparison Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Credits ({stats.creditPercentage.toFixed(0)}%)</span>
          <span>Debits ({stats.debitPercentage.toFixed(0)}%)</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <div 
            className="h-full bg-success transition-all duration-300"
            style={{ width: `${stats.creditPercentage}%` }}
          />
          <div 
            className="h-full bg-destructive transition-all duration-300"
            style={{ width: `${stats.debitPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs font-medium">
          <span className="text-success">{stats.credit.toFixed(2)} KD</span>
          <span className="text-destructive">{stats.debit.toFixed(2)} KD</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Credits */}
        <div className="bg-success/5 rounded-xl p-3 border border-success/20">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-success" />
            </div>
            <span className="text-[10px] font-medium text-success bg-success/10 px-1.5 py-0.5 rounded">
              {stats.creditCount} txn
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Credits</p>
          <p className="text-lg font-bold text-foreground">{stats.credit.toFixed(2)} <span className="text-xs font-normal">KD</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Largest: <span className="text-success font-medium">{stats.largestCredit.toFixed(2)} KD</span>
          </p>
        </div>

        {/* Total Debits */}
        <div className="bg-destructive/5 rounded-xl p-3 border border-destructive/20">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
              {stats.debitCount} txn
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Debits</p>
          <p className="text-lg font-bold text-foreground">{stats.debit.toFixed(2)} <span className="text-xs font-normal">KD</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Largest: <span className="text-destructive font-medium">{stats.largestDebit.toFixed(2)} KD</span>
          </p>
        </div>

        {/* Net Flow */}
        <div className="bg-muted/50 rounded-xl p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              stats.netFlow >= 0 ? "bg-success/10" : "bg-destructive/10"
            )}>
              {stats.netFlow >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded",
              stats.netFlow >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
            )}>
              {stats.netFlow >= 0 ? "Positive" : "Negative"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Net Flow</p>
          <p className={cn(
            "text-lg font-bold",
            stats.netFlow >= 0 ? "text-success" : "text-destructive"
          )}>
            {stats.netFlow >= 0 ? "+" : ""}{stats.netFlow.toFixed(2)} <span className="text-xs font-normal">KD</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {stats.netFlow >= 0 ? "More money in than out" : "More money out than in"}
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="bg-muted/50 rounded-xl p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {stats.totalCount} total
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Avg Transaction</p>
          <p className="text-lg font-bold text-foreground">{stats.avgTransaction.toFixed(2)} <span className="text-xs font-normal">KD</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Volume: <span className="text-foreground font-medium">{stats.totalVolume.toFixed(2)} KD</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditDebitChart;