 import { useMemo } from "react";
 import type { Transaction } from "@/data/mockWalletData";
 import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, Activity, Hash } from "lucide-react";
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
     const totalCount = creditCount + debitCount;
     const avgTransaction = totalCount > 0 ? (credit + debit) / totalCount : 0;
 
     return { credit, debit, netFlow, totalCount, avgTransaction, creditCount, debitCount };
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
       </div>
 
       {/* Transaction Count & Avg */}
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
       </div>
     </div>
   );
 };
 
 export default CreditDebitChart;