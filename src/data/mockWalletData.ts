export type WalletType = "e-topup" | "e-voucher";
export type TransactionType = "credit" | "debit";
export type ActivityType = "recharge" | "transfer" | "rollback" | "voucher" | "bill-payment";
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
];

// Child user wallets
export const childWallets: Wallet[] = [
  { id: "e-topup", name: "E-Topup", balance: 150.0, currency: "KD" },
  { id: "e-voucher", name: "E-Voucher", balance: 80.0, currency: "KD" },
];

// Child members (for parent to filter)
export const childMembers: Member[] = [
  { id: "child-1", name: "Ahmed Hassan" },
  { id: "child-2", name: "Sara Ali" },
  { id: "child-3", name: "Mohammed Khalid" },
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
];

export const activityTypeLabels: Record<ActivityType, string> = {
  recharge: "Recharge",
  transfer: "Transfer",
  rollback: "Rollback",
  voucher: "Voucher",
  "bill-payment": "Bill Payment",
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
