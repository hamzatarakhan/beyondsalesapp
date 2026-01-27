import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import type { Transaction, WalletType } from "@/data/mockWalletData";

interface ActivityDistributionProps {
  transactions: Transaction[];
  walletType: WalletType;
}

// Colors for pie chart slices
const COLORS = {
  "e-topup": {
    transfer: "hsl(var(--primary))",
    "bill-payment": "hsl(var(--warning))",
    rollback: "hsl(var(--destructive))",
    recharge: "hsl(var(--success))",
  },
  "e-voucher": {
    voucher: "hsl(var(--primary))",
    recharge: "hsl(var(--success))",
    "erp-transfer": "hsl(var(--warning))",
    rollback: "hsl(var(--destructive))",
  },
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
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const walletLabel = walletType === "e-topup" ? "E-Topup" : "E-Voucher";
  const colorMap = COLORS[walletType];

  if (chartData.length === 0) {
    return (
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          {walletLabel} Activity Distribution
        </h4>
        <div className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No transactions to display</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold text-foreground mb-2">
        {walletLabel} Activity Distribution
      </h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              label={({ percentage }) => `${percentage}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colorMap[entry.activityKey as keyof typeof colorMap] || `hsl(${index * 90}, 70%, 50%)`}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} transaction${value > 1 ? "s" : ""}`,
                name,
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value, entry: any) => (
                <span className="text-xs text-foreground">
                  {value} ({entry.payload?.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default ActivityDistribution;
