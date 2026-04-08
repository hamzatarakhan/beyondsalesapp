import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { Transaction, WalletType } from "@/data/mockWalletData";

interface ActivityDistributionProps {
  transactions: Transaction[];
  walletType: WalletType;
}

// Colors for pie chart slices
const COLORS: Record<string, string> = {
  "bill-payment": "#F59E0B",
  recharge: "#3B82F6",
  transfer: "#22C55E",
  rollback: "#EC4899",
  voucher: "#8B5CF6",
  "erp-transfer": "#14B8A6",
  refund: "#F97316",
  cashback: "#06B6D4",
  commission: "#84CC16",
  adjustment: "#EF4444",
  penalty: "#DC2626",
  bonus: "#A855F7",
  subscription: "#0EA5E9",
  "top-up-reversal": "#D946EF",
  "loyalty-redeem": "#10B981",
  "service-charge": "#6366F1",
};

// Activity labels for display
const ACTIVITY_LABELS: Record<string, string> = {
  transfer: "Transfer",
  "bill-payment": "Bill Payment",
  rollback: "Rollback",
  recharge: "Recharge",
  voucher: "Voucher",
  "erp-transfer": "ERP Transfer",
  refund: "Refund",
  cashback: "Cashback",
  commission: "Commission",
  adjustment: "Adjustment",
  penalty: "Penalty",
  bonus: "Bonus",
  subscription: "Subscription",
  "top-up-reversal": "Top-up Reversal",
  "loyalty-redeem": "Loyalty Redeem",
  "service-charge": "Service Charge",
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
      <div>
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No transactions to display</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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

        {/* Two-column Legend */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 w-full px-2">
          {chartData.map((item) => (
            <div key={item.activityKey} className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityDistribution;
