export type WalletType = "my-wallet" | "topup-wallet" | "evoucher-wallet";
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
  { id: "my-wallet", name: "My Wallet", balance: 556.0, currency: "KD" },
  { id: "topup-wallet", name: "Top-Up Wallet", balance: 234.5, currency: "KD" },
  { id: "evoucher-wallet", name: "E-Voucher Wallet", balance: 120.0, currency: "KD" },
];

// Child user wallets (only their own)
export const childWallets: Wallet[] = [
  { id: "my-wallet", name: "My Wallet", balance: 150.0, currency: "KD" },
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

// Mock transactions with dynamic recent dates
export const mockTransactions: Transaction[] = [
  {
    id: "txn-001",
    referenceId: "REF2024010001",
    date: daysAgo(0),
    activityType: "recharge",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 50.0,
    status: "completed",
    description: "Wallet Recharge",
    balanceBefore: 506.0,
    balanceAfter: 556.0,
    currency: "KD",
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
  },
  {
    id: "txn-004",
    referenceId: "REF2024010004",
    date: daysAgo(3),
    activityType: "voucher",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 100.0,
    status: "completed",
    description: "E-Voucher Redemption",
    balanceBefore: 466.0,
    balanceAfter: 566.0,
    currency: "KD",
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
    description: "Wallet Recharge",
    balanceBefore: 281.0,
    balanceAfter: 481.0,
    currency: "KD",
  },
  {
    id: "txn-007",
    referenceId: "REF2024010007",
    date: daysAgo(6),
    activityType: "rollback",
    transactionType: "credit",
    memberName: "Hamza",
    amount: 30.0,
    status: "completed",
    description: "Transaction Rollback",
    balanceBefore: 251.0,
    balanceAfter: 281.0,
    currency: "KD",
  },
  {
    id: "txn-008",
    referenceId: "REF2024010008",
    date: daysAgo(10),
    activityType: "bill-payment",
    transactionType: "debit",
    memberName: "Mohammed Khalid",
    amount: 45.0,
    status: "failed",
    description: "Bill Payment - Internet",
    balanceBefore: 296.0,
    balanceAfter: 251.0,
    currency: "KD",
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
