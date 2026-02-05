 import { useMemo } from "react";
 import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
 import type { Transaction } from "@/data/mockWalletData";
 import { format, subDays, startOfDay, isSameDay } from "date-fns";
 
 interface CreditDebitChartProps {
   transactions: Transaction[];
 }
 
 const CreditDebitChart = ({ transactions }: CreditDebitChartProps) => {
   const chartData = useMemo(() => {
     // Get last 7 days
     const today = new Date();
     const days: { date: Date; label: string; credit: number; debit: number }[] = [];
     
     for (let i = 6; i >= 0; i--) {
       const date = startOfDay(subDays(today, i));
       days.push({
         date,
         label: format(date, "EEE"),
         credit: 0,
         debit: 0,
       });
     }
     
     // Aggregate transactions by day
     transactions.forEach((txn) => {
       const txnDate = startOfDay(txn.date);
       const dayEntry = days.find((d) => isSameDay(d.date, txnDate));
       if (dayEntry) {
         if (txn.transactionType === "credit") {
           dayEntry.credit += txn.amount;
         } else {
           dayEntry.debit += txn.amount;
         }
       }
     });
     
     return days;
   }, [transactions]);
 
   const totals = useMemo(() => {
     return chartData.reduce(
       (acc, day) => ({
         credit: acc.credit + day.credit,
         debit: acc.debit + day.debit,
       }),
       { credit: 0, debit: 0 }
     );
   }, [chartData]);
 
   const hasData = totals.credit > 0 || totals.debit > 0;
 
   if (!hasData) {
     return (
       <div className="h-32 flex items-center justify-center">
         <p className="text-sm text-muted-foreground">No transaction data to display</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-4">
       {/* Summary Cards */}
       <div className="grid grid-cols-2 gap-3">
         <div className="bg-success/10 rounded-xl p-3">
           <p className="text-xs text-muted-foreground mb-1">Total Credit</p>
           <p className="text-lg font-bold text-success">{totals.credit.toFixed(2)} KD</p>
         </div>
         <div className="bg-destructive/10 rounded-xl p-3">
           <p className="text-xs text-muted-foreground mb-1">Total Debit</p>
           <p className="text-lg font-bold text-destructive">{totals.debit.toFixed(2)} KD</p>
         </div>
       </div>
 
       {/* Bar Chart */}
       <div className="h-48">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={chartData} barGap={2}>
             <XAxis 
               dataKey="label" 
               axisLine={false} 
               tickLine={false}
               tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
             />
             <YAxis 
               hide 
               domain={[0, "auto"]}
             />
             <Tooltip
               cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
               contentStyle={{
                 backgroundColor: "hsl(var(--card))",
                 border: "1px solid hsl(var(--border))",
                 borderRadius: "8px",
                 fontSize: "12px",
               }}
               formatter={(value: number, name: string) => [
                 `${value.toFixed(2)} KD`,
                 name === "credit" ? "Credit" : "Debit"
               ]}
               labelFormatter={(label) => `Day: ${label}`}
             />
             <Bar 
               dataKey="credit" 
               radius={[4, 4, 0, 0]} 
               maxBarSize={24}
             >
               {chartData.map((_, index) => (
                 <Cell key={`credit-${index}`} fill="hsl(var(--success))" />
               ))}
             </Bar>
             <Bar 
               dataKey="debit" 
               radius={[4, 4, 0, 0]} 
               maxBarSize={24}
             >
               {chartData.map((_, index) => (
                 <Cell key={`debit-${index}`} fill="hsl(var(--destructive))" />
               ))}
             </Bar>
           </BarChart>
         </ResponsiveContainer>
       </div>
 
       {/* Legend */}
       <div className="flex items-center justify-center gap-6">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-sm bg-success" />
           <span className="text-xs text-muted-foreground">Credit (Money In)</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-sm bg-destructive" />
           <span className="text-xs text-muted-foreground">Debit (Money Out)</span>
         </div>
       </div>
     </div>
   );
 };
 
 export default CreditDebitChart;