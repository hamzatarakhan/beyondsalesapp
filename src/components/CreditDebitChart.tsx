import { useMemo } from "react";
import type { Transaction } from "@/data/mockWalletData";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditDebitChartProps {
  transactions: Transaction[];
}

// Circular progress component
const CircularProgress = ({ 
  percentage, 
  color, 
  size = 80, 
  strokeWidth = 8 
}: { 
  percentage: number; 
  color: string; 
  size?: number; 
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

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
    const debitPercentage = totalVolume > 0 ? (debit / totalVolume) * 100 : 0;

    return { 
      credit, 
      debit, 
      netFlow, 
      creditCount, 
      debitCount,
      creditPercentage,
      debitPercentage,
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
    <div className="space-y-4">
      {/* Progress Rings */}
      <div className="flex items-center justify-around">
        {/* Credits Ring */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <CircularProgress 
              percentage={stats.creditPercentage} 
              color="hsl(var(--success))"
              size={90}
              strokeWidth={10}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-success mb-0.5" />
              <span className="text-sm font-bold text-foreground">
                {stats.creditPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-lg font-bold text-foreground">{stats.credit.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">KD</span></p>
            <p className="text-[10px] text-success font-medium">{stats.creditCount} credits</p>
          </div>
        </div>

        {/* Net Flow Center */}
        <div className="flex flex-col items-center px-2">
          <div className={cn(
            "text-2xl font-bold",
            stats.netFlow >= 0 ? "text-success" : "text-destructive"
          )}>
            {stats.netFlow >= 0 ? "+" : ""}{stats.netFlow.toFixed(0)}
          </div>
          <p className="text-[10px] text-muted-foreground">Net Flow</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.totalVolume.toFixed(0)} KD</p>
          <p className="text-[10px] text-muted-foreground">total volume</p>
        </div>

        {/* Debits Ring */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <CircularProgress 
              percentage={stats.debitPercentage} 
              color="hsl(var(--destructive))"
              size={90}
              strokeWidth={10}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-destructive mb-0.5" />
              <span className="text-sm font-bold text-foreground">
                {stats.debitPercentage.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-center">
            <p className="text-lg font-bold text-foreground">{stats.debit.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">KD</span></p>
            <p className="text-[10px] text-destructive font-medium">{stats.debitCount} debits</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditDebitChart;