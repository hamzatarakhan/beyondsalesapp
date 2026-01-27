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
  const chartData = useMemo(() => {
    // Count activities by type
    const activityCounts: Record<string, number> = {};
    
    transactions.forEach((txn) => {
      const activity = txn.activityType;
      activityCounts[activity] = (activityCounts[activity] || 0) + 1;
    });

    // Convert to array format for pie chart
    const total = transactions.length;
    if (total === 0) return [];

    return Object.entries(activityCounts)
      .map(([name, value]) => ({
        name: ACTIVITY_LABELS[name] || name,
        value,
        percentage: Math.round((value / total) * 100),
        activityKey: name,
        color: COLORS[name] || "#94A3B8",
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [transactions]);

  const walletLabel = walletType === "e-topup" ? "E-Topup" : "E-Voucher";

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
      
      <div className="flex items-center gap-4">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
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
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground uppercase">Usage</span>
            <span className="text-lg font-bold text-foreground">100%</span>
          </div>
        </div>

        {/* Legend with progress bars */}
        <div className="flex-1 space-y-3">
          {chartData.map((item) => (
            <div key={item.activityKey} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{item.percentage}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ActivityDistribution;
