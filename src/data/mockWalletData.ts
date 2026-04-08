export type WalletType = "e-topup" | "e-voucher" | "e-cash" | "rewards" | "credit-line";
export type TransactionType = "credit" | "debit";
export type ActivityType = "recharge" | "transfer" | "rollback" | "voucher" | "bill-payment" | "erp-transfer" | "refund" | "cashback" | "commission" | "adjustment" | "penalty" | "bonus" | "subscription" | "top-up-reversal" | "loyalty-redeem" | "service-charge";
export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  referenceId: string;
  date: Date;
  activityType: ActivityType;
  transactionType: TransactionType;
  memberName: string;
  amount: number;
  status: TransactionStatus;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  walletType: WalletType;
}

export interface Wallet {
  id: WalletType;
  name: string;
  balance: number;
  currency: string;
}

export interface Member {
  id: string;
  name: string;
}

// Parent user wallets
export const parentWallets: Wallet[] = [
  { id: "e-topup", name: "E-Topup", balance: 556.0, currency: "KD" },
  { id: "e-voucher", name: "E-Voucher", balance: 234.5, currency: "KD" },
  { id: "e-cash", name: "E-Cash", balance: 120.0, currency: "KD" },
  { id: "rewards", name: "Rewards", balance: 85.0, currency: "KD" },
  { id: "credit-line", name: "Credit Line", balance: 500.0, currency: "KD" },
];

// Child user wallets
export const childWallets: Wallet[] = [
  { id: "e-topup", name: "E-Topup", balance: 150.0, currency: "KD" },
  { id: "e-voucher", name: "E-Voucher", balance: 80.0, currency: "KD" },
  { id: "e-cash", name: "E-Cash", balance: 45.0, currency: "KD" },
  { id: "rewards", name: "Rewards", balance: 30.0, currency: "KD" },
  { id: "credit-line", name: "Credit Line", balance: 200.0, currency: "KD" },
];

// Member wallet balances (for aggregation when filtering)
export interface MemberWalletBalance {
  memberId: string;
  memberName: string;
  wallets: {
    "e-topup": number;
    "e-voucher": number;
    "e-cash": number;
    "rewards": number;
    "credit-line": number;
  };
}

// Child members (for parent to filter)
export const childMembers: Member[] = [
  { id: "child-1", name: "Ahmed Hassan" },
  { id: "child-2", name: "Sara Ali" },
  { id: "child-3", name: "Mohammed Khalid" },
];

// Member-specific wallet balances
export const memberWalletBalances: MemberWalletBalance[] = [
  { 
    memberId: "parent", 
    memberName: "Hamza", 
    wallets: { "e-topup": 300.0, "e-voucher": 120.0, "e-cash": 75.0, "rewards": 50.0, "credit-line": 300.0 } 
  },
  { 
    memberId: "child-1", 
    memberName: "Ahmed Hassan", 
    wallets: { "e-topup": 120.0, "e-voucher": 65.0, "e-cash": 25.0, "rewards": 20.0, "credit-line": 100.0 } 
  },
  { 
    memberId: "child-2", 
    memberName: "Sara Ali", 
    wallets: { "e-topup": 85.0, "e-voucher": 35.5, "e-cash": 15.0, "rewards": 10.0, "credit-line": 75.0 } 
  },
  { 
    memberId: "child-3", 
    memberName: "Mohammed Khalid", 
    wallets: { "e-topup": 51.0, "e-voucher": 14.0, "e-cash": 5.0, "rewards": 5.0, "credit-line": 25.0 } 
  },
];

// Helper to generate recent dates
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Mock transactions with wallet association
export const mockTransactions: Transaction[] = [
  // E-Topup Transactions
  {
    id: "txn-001",
    referenceId: "REF2024010001",
    date: daysAgo(0),
    activityType: "recharge",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 50.0,
    status: "completed",
    description: "E-Topup Recharge",
    balanceBefore: 506.0,
    balanceAfter: 556.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-002",
    referenceId: "REF2024010002",
    date: daysAgo(1),
    activityType: "transfer",
    transactionType: "debit",
    memberName: "Ahmed Hassan",
    amount: 25.0,
    status: "completed",
    description: "Transfer to Child",
    balanceBefore: 531.0,
    balanceAfter: 506.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-003",
    referenceId: "REF2024010003",
    date: daysAgo(2),
    activityType: "bill-payment",
    transactionType: "debit",
    memberName: "Hamza",
    amount: 35.0,
    status: "completed",
    description: "Bill Payment - Electricity",
    balanceBefore: 566.0,
    balanceAfter: 531.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-005",
    referenceId: "REF2024010005",
    date: daysAgo(4),
    activityType: "transfer",
    transactionType: "debit",
    memberName: "Sara Ali",
    amount: 15.0,
    status: "pending",
    description: "Transfer to Child",
    balanceBefore: 481.0,
    balanceAfter: 466.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-006",
    referenceId: "REF2024010006",
    date: daysAgo(5),
    activityType: "recharge",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 200.0,
    status: "completed",
    description: "E-Topup Recharge",
    balanceBefore: 281.0,
    balanceAfter: 481.0,
    currency: "KD",
    walletType: "e-topup",
  },
  // E-Voucher Transactions
  {
    id: "txn-004",
    referenceId: "REF2024010004",
    date: daysAgo(0),
    activityType: "voucher",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 100.0,
    status: "completed",
    description: "E-Voucher Redemption",
    balanceBefore: 134.5,
    balanceAfter: 234.5,
    currency: "KD",
    walletType: "e-voucher",
  },
  {
    id: "txn-007",
    referenceId: "REF2024010007",
    date: daysAgo(2),
    activityType: "voucher",
    transactionType: "debit",
    memberName: "Ahmed Hassan",
    amount: 50.0,
    status: "completed",
    description: "Voucher Purchase",
    balanceBefore: 184.5,
    balanceAfter: 134.5,
    currency: "KD",
    walletType: "e-voucher",
  },
  {
    id: "txn-008",
    referenceId: "REF2024010008",
    date: daysAgo(3),
    activityType: "rollback",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 30.0,
    status: "completed",
    description: "Voucher Rollback",
    balanceBefore: 154.5,
    balanceAfter: 184.5,
    currency: "KD",
    walletType: "e-voucher",
  },
  {
    id: "txn-009",
    referenceId: "REF2024010009",
    date: daysAgo(5),
    activityType: "voucher",
    transactionType: "credit",
    memberName: "Sara Ali",
    amount: 75.0,
    status: "completed",
    description: "E-Voucher Gift",
    balanceBefore: 79.5,
    balanceAfter: 154.5,
    currency: "KD",
    walletType: "e-voucher",
  },
  {
    id: "txn-010",
    referenceId: "REF2024010010",
    date: daysAgo(6),
    activityType: "voucher",
    transactionType: "debit",
    memberName: "Mohammed Khalid",
    amount: 25.0,
    status: "failed",
    description: "Voucher Redemption Failed",
    balanceBefore: 79.5,
    balanceAfter: 79.5,
    currency: "KD",
    walletType: "e-voucher",
  },
  // Additional activity type transactions - E-Topup
  {
    id: "txn-011",
    referenceId: "REF2024010011",
    date: daysAgo(1),
    activityType: "erp-transfer",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 80.0,
    status: "completed",
    description: "ERP Transfer In",
    balanceBefore: 476.0,
    balanceAfter: 556.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-012",
    referenceId: "REF2024010012",
    date: daysAgo(2),
    activityType: "refund",
    transactionType: "credit",
    memberName: "Ahmed Hassan",
    amount: 15.0,
    status: "completed",
    description: "Refund - Failed Payment",
    balanceBefore: 461.0,
    balanceAfter: 476.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-013",
    referenceId: "REF2024010013",
    date: daysAgo(3),
    activityType: "cashback",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 5.0,
    status: "completed",
    description: "Cashback Reward",
    balanceBefore: 456.0,
    balanceAfter: 461.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-014",
    referenceId: "REF2024010014",
    date: daysAgo(4),
    activityType: "commission",
    transactionType: "credit",
    memberName: "Sara Ali",
    amount: 12.0,
    status: "completed",
    description: "Sales Commission",
    balanceBefore: 444.0,
    balanceAfter: 456.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-015",
    referenceId: "REF2024010015",
    date: daysAgo(5),
    activityType: "adjustment",
    transactionType: "debit",
    memberName: "Hamza",
    amount: 10.0,
    status: "completed",
    description: "Balance Adjustment",
    balanceBefore: 454.0,
    balanceAfter: 444.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-016",
    referenceId: "REF2024010016",
    date: daysAgo(1),
    activityType: "rollback",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 20.0,
    status: "completed",
    description: "Topup Rollback",
    balanceBefore: 536.0,
    balanceAfter: 556.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-017",
    referenceId: "REF2024010017",
    date: daysAgo(3),
    activityType: "erp-transfer",
    transactionType: "debit",
    memberName: "Ahmed Hassan",
    amount: 40.0,
    status: "completed",
    description: "ERP Transfer Out",
    balanceBefore: 576.0,
    balanceAfter: 536.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-018",
    referenceId: "REF2024010018",
    date: daysAgo(2),
    activityType: "cashback",
    transactionType: "credit",
    memberName: "Sara Ali",
    amount: 8.0,
    status: "completed",
    description: "Monthly Cashback",
    balanceBefore: 568.0,
    balanceAfter: 576.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-019",
    referenceId: "REF2024010019",
    date: daysAgo(4),
    activityType: "commission",
    transactionType: "credit",
    memberName: "Mohammed Khalid",
    amount: 22.0,
    status: "pending",
    description: "Dealer Commission",
    balanceBefore: 546.0,
    balanceAfter: 568.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-020",
    referenceId: "REF2024010020",
    date: daysAgo(6),
    activityType: "refund",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 30.0,
    status: "completed",
    description: "Service Refund",
    balanceBefore: 516.0,
    balanceAfter: 546.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-021",
    referenceId: "REF2024010021",
    date: daysAgo(1),
    activityType: "adjustment",
    transactionType: "credit",
    memberName: "Ahmed Hassan",
    amount: 5.0,
    status: "completed",
    description: "Credit Adjustment",
    balanceBefore: 511.0,
    balanceAfter: 516.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-022",
    referenceId: "REF2024010022",
    date: daysAgo(1),
    activityType: "penalty",
    transactionType: "debit",
    memberName: "Hamza",
    amount: 3.0,
    status: "completed",
    description: "Late Payment Penalty",
    balanceBefore: 559.0,
    balanceAfter: 556.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-023",
    referenceId: "REF2024010023",
    date: daysAgo(2),
    activityType: "bonus",
    transactionType: "credit",
    memberName: "Sara Ali",
    amount: 25.0,
    status: "completed",
    description: "Monthly Bonus",
    balanceBefore: 534.0,
    balanceAfter: 559.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-024",
    referenceId: "REF2024010024",
    date: daysAgo(3),
    activityType: "subscription",
    transactionType: "debit",
    memberName: "Hamza",
    amount: 15.0,
    status: "completed",
    description: "Premium Subscription",
    balanceBefore: 549.0,
    balanceAfter: 534.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-025",
    referenceId: "REF2024010025",
    date: daysAgo(4),
    activityType: "top-up-reversal",
    transactionType: "debit",
    memberName: "Ahmed Hassan",
    amount: 50.0,
    status: "completed",
    description: "Top-up Reversal",
    balanceBefore: 599.0,
    balanceAfter: 549.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-026",
    referenceId: "REF2024010026",
    date: daysAgo(5),
    activityType: "loyalty-redeem",
    transactionType: "credit",
    memberName: "Mohammed Khalid",
    amount: 18.0,
    status: "completed",
    description: "Loyalty Points Redemption",
    balanceBefore: 581.0,
    balanceAfter: 599.0,
    currency: "KD",
    walletType: "e-topup",
  },
  {
    id: "txn-027",
    referenceId: "REF2024010027",
    date: daysAgo(6),
    activityType: "service-charge",
    transactionType: "debit",
    memberName: "Hamza",
    amount: 2.0,
    status: "completed",
    description: "Service Charge Fee",
    balanceBefore: 583.0,
    balanceAfter: 581.0,
    currency: "KD",
    walletType: "e-topup",
  },
];

export const activityTypeLabels: Record<ActivityType, string> = {
  recharge: "Recharge",
  transfer: "Transfer",
  rollback: "Rollback",
  voucher: "Voucher",
  "bill-payment": "Bill Payment",
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

export const transactionTypeLabels: Record<TransactionType, string> = {
  credit: "Credit",
  debit: "Debit",
};

export const statusLabels: Record<TransactionStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};
