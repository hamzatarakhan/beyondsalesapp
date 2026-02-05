 import { useMemo } from "react";
 import type { Transaction } from "@/data/mockWalletData";
 import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
 
 interface CreditDebitChartProps {
   transactions: Transaction[];
 }
 
 const CreditDebitChart = ({ transactions }: CreditDebitChartProps) => {
   const { totals, netFlow, creditPercent } = useMemo(() => {
     const sums = transactions.reduce(
       (acc, txn) => {
         if (txn.transactionType === "credit") {
           acc.credit += txn.amount;
         } else {
           acc.debit += txn.amount;
         }
         return acc;
       },
       { credit: 0, debit: 0 }
     );
     const total = sums.credit + sums.debit;
     const percent = total > 0 ? Math.round((sums.credit / total) * 100) : 50;
     return {
       totals: sums,
       netFlow: sums.credit - sums.debit,
       creditPercent: percent,
     };
   }, [transactions]);
 
   const hasData = totals.credit > 0 || totals.debit > 0;
 
   if (!hasData) {
     return (
       <div className="h-32 flex items-center justify-center">
         <p className="text-sm text-muted-foreground">No transaction data to display</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-3">
       {/* Visual ratio bar */}
       <div className="h-3 rounded-full overflow-hidden flex bg-muted">
         <div 
           className="bg-success transition-all duration-300" 
           style={{ width: `${creditPercent}%` }} 
         />
         <div 
           className="bg-destructive transition-all duration-300" 
           style={{ width: `${100 - creditPercent}%` }} 
         />
       </div>
 
       {/* Credit / Debit Row */}
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
             <ArrowDownLeft className="w-4 h-4 text-success" />
           </div>
           <div>
             <p className="text-xs text-muted-foreground">Credit</p>
             <p className="text-sm font-semibold text-foreground">{totals.credit.toFixed(2)} KD</p>
           </div>
         </div>
         <div className="flex items-center gap-2 text-right">
           <div>
             <p className="text-xs text-muted-foreground">Debit</p>
             <p className="text-sm font-semibold text-foreground">{totals.debit.toFixed(2)} KD</p>
           </div>
           <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
             <ArrowUpRight className="w-4 h-4 text-destructive" />
           </div>
         </div>
       </div>
 
       {/* Net Flow */}
       <div className="pt-2 border-t border-border">
         <div className="flex items-center justify-between">
           <span className="text-xs text-muted-foreground">Net Flow</span>
           <span className={`text-sm font-bold ${netFlow >= 0 ? "text-success" : "text-destructive"}`}>
             {netFlow >= 0 ? "+" : ""}{netFlow.toFixed(2)} KD
           </span>
         </div>
       </div>
     </div>
   );
 };
 
 export default CreditDebitChart;