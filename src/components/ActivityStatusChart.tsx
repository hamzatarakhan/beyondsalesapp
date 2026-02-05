 import { useMemo } from "react";
 import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
 import type { Transaction, TransactionStatus } from "@/data/mockWalletData";
 import { CheckCircle2, Clock, XCircle } from "lucide-react";
 
 interface ActivityStatusChartProps {
   transactions: Transaction[];
 }
 
 const STATUS_CONFIG: Record<TransactionStatus, { color: string; label: string; icon: typeof CheckCircle2 }> = {
   completed: { color: "hsl(var(--success))", label: "Completed", icon: CheckCircle2 },
   pending: { color: "hsl(var(--warning))", label: "Pending", icon: Clock },
   failed: { color: "hsl(var(--destructive))", label: "Failed", icon: XCircle },
 };
 
 const ActivityStatusChart = ({ transactions }: ActivityStatusChartProps) => {
   const { chartData, total } = useMemo(() => {
     const statusCounts: Record<TransactionStatus, number> = {
       completed: 0,
       pending: 0,
       failed: 0,
     };
 
     transactions.forEach((txn) => {
       statusCounts[txn.status]++;
     });
 
     const totalCount = transactions.length;
     if (totalCount === 0) return { chartData: [], total: 0 };
 
     const data = (Object.entries(statusCounts) as [TransactionStatus, number][])
       .filter(([_, count]) => count > 0)
       .map(([status, count]) => ({
         name: STATUS_CONFIG[status].label,
         value: count,
         percentage: Math.round((count / totalCount) * 100),
         status,
         color: STATUS_CONFIG[status].color,
         Icon: STATUS_CONFIG[status].icon,
       }))
       .sort((a, b) => b.value - a.value);
 
     return { chartData: data, total: totalCount };
   }, [transactions]);
 
   if (chartData.length === 0) {
     return (
       <div className="h-32 flex items-center justify-center">
         <p className="text-sm text-muted-foreground">No transactions to display</p>
       </div>
     );
   }
 
   return (
     <div className="flex flex-col items-center">
       {/* Donut Chart with Total in Center */}
       <div className="relative w-36 h-36">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={chartData}
               cx="50%"
               cy="50%"
               innerRadius={40}
               outerRadius={60}
               paddingAngle={2}
               dataKey="value"
               nameKey="name"
               stroke="none"
             >
               {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.color} />
               ))}
             </Pie>
           </PieChart>
         </ResponsiveContainer>
         {/* Center text - Total count */}
         <div className="absolute inset-0 flex flex-col items-center justify-center">
           <span className="text-2xl font-bold text-foreground">{total}</span>
           <span className="text-xs text-muted-foreground">Total</span>
         </div>
       </div>
 
       {/* Horizontal Legend */}
       <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
         {chartData.map((item) => (
           <div key={item.status} className="flex items-center gap-1.5">
             <div
               className="w-2.5 h-2.5 rounded-full"
               style={{ backgroundColor: item.color }}
             />
             <span className="text-xs text-muted-foreground">
               {item.name} ({item.value})
             </span>
           </div>
         ))}
       </div>
     </div>
   );
 };
 
 export default ActivityStatusChart;