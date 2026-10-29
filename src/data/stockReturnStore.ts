// Shared demo data for the Stock Return service — same plain mutable module-store
// convention as stockTransferStore.ts (no backend, every page reads a fresh snapshot on
// mount). A return moves the dealer's own stock back, so like Stock Transfer there is no
// pricing/VAT — just quantities, serials, and a return reason.
import { PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/purchaseOrdersStore";

export { PURCHASE_ORDER_PRODUCTS };
export type { ProductId };

export type StockReturnStatus = "pending" | "approved" | "rejected";

export interface StockReturnLine {
  productId: ProductId;
  qty: number;
  serials: string[];
  reason: string;
  remark?: string;
}

export interface StockReturn {
  id: string;
  status: StockReturnStatus;
  date: string;
  dateObj: Date;
  lines: StockReturnLine[];
  location?: string;
  destination?: string;
}

// Location & Destination picked on the first step of New Order (Dealer / Team Leader only),
// carried through the product screens and stamped onto the return when it's submitted.
export let returnDraft: { location?: string; destination?: string } = {};
export const setReturnDraft = (d: { location?: string; destination?: string }) => { returnDraft = d; };

export const RETURN_REASONS = ["damagedSim", "defectiveDevice", "wrongItem", "expiredVoucher", "excessStock"] as const;
export type ReturnReasonKey = (typeof RETURN_REASONS)[number];

const line = (productId: ProductId, qty: number, reason: ReturnReasonKey = "damagedSim"): StockReturnLine => ({
  productId,
  qty,
  serials: Array.from({ length: qty }, (_, i) => `SN-${productId.toUpperCase()}-${2000 + i}`),
  reason,
});

const mk = (id: string, status: StockReturnStatus, date: string, dateObj: Date, lines: StockReturnLine[]): StockReturn => ({
  id, status, date, dateObj, lines,
});

// One demo return per status, so every state is directly visible in the list.
export const stockReturns: StockReturn[] = [
  mk("3515165613", "rejected", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 4), line("router1", 2), line("fingerprint", 1), line("voucher10", 5), line("voucher20", 3)]),
  mk("3515165612", "approved", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 10), line("router1", 1), line("fingerprint", 2), line("voucher50", 4), line("router2", 1)]),
  mk("3515165611", "pending", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 6), line("router3", 1), line("fingerprint", 1), line("digitalVoucher", 8), line("voucher100", 2)]),
  mk("3515165610", "approved", "14, Dec, 2026 – 11:30 AM", new Date(2026, 11, 14), [line("voucher10", 20)],),
  mk("3515165609", "approved", "13, Dec, 2026 – 4:15 PM", new Date(2026, 11, 13), [line("router1", 3), line("router2", 2)]),
  mk("3515165608", "pending", "12, Dec, 2026 – 9:00 AM", new Date(2026, 11, 12), [line("vmSim", 15), line("voucher20", 10)]),
];

export const getStockReturn = (id: string) => stockReturns.find((o) => o.id === id);

let nextSeq = 3515165614;
export const addStockReturn = (lines: StockReturnLine[]) => {
  const order: StockReturn = {
    id: String(nextSeq++),
    status: "pending",
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateObj: new Date(),
    lines,
    ...returnDraft,
  };
  stockReturns.unshift(order);
  return order;
};
