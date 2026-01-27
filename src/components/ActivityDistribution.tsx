import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { Transaction, WalletType } from "@/data/mockWalletData";

interface ActivityDistributionProps {
  transactions: Transaction[];
  walletType: WalletType;
}

// Colors for pie chart slices
const COLORS: Record<string, string> = {
  "bill-payment": "#F59E0B", // Orange/Amber
  recharge: "#3B82F6", // Blue
  transfer: "#22C55E", // Green
  rollback: "#EC4899", // Pink
  voucher: "#8B5CF6", // Purple
  "erp-transfer": "#14B8A6", // Teal
};

// Activity labels for display
const ACTIVITY_LABELS: Record<string, string> = {
  transfer: "Transfer",
  "bill-payment": "Bill Payment",
  rollback: "Rollback",
  recharge: "Recharge",
  voucher: "Voucher",
  "erp-transfer": "ERP Transfer",
};

const ActivityDistribution = ({ transactions, walletType }: ActivityDistributionProps) => {
  const { chartData, total } = useMemo(() => {
    // Count activities by type
    const activityCounts: Record<string, number> = {};
    
    transactions.forEach((txn) => {
      const activity = txn.activityType;
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });

    // Convert to array format for pie chart
    const totalCount = transactions.length;
    if (totalCount === 0) return { chartData: [], total: 0 };

    const data = Object.entries(activityCounts)
      .map(([name, value]) => ({
        name: ACTIVITY_LABELS[name] || name,
        value,
        percentage: Math.round((value / totalCount) * 100),
        activityKey: name,
        color: COLORS[name] || "#94A3B8",
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return { chartData: data, total: totalCount };
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Activity Distribution
          </h4>
        </div>
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No transactions to display</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Activity Distribution
        </h4>
      </div>
      
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
            <div key={item.activityKey} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ActivityDistribution;
