// Shared demo data for the Stock Transfer service — same plain mutable module-store
// convention as purchaseOrdersStore.ts (no backend, every page reads a fresh snapshot on
// mount). Reuses that file's product catalog/branch list, since a transfer moves the exact
// same E-SIM/P-SIM/Router stock — just between two of the dealer's own branches, not to/from
// an external party, so unlike Purchase/Sales Orders there's no supplier quotation, no
// approval step, and no VAT/pricing — it's a stock ledger move, not a commercial transaction.
import { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS, type ProductId } from "@/data/purchaseOrdersStore";

export { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS };
export type { ProductId };

export type StockTransferStatus = "pending" | "inTransit" | "received" | "cancelled";

export interface StockTransferLine {
  productId: ProductId;
  qty: number;
}

export interface StockTransfer {
  id: string;
  status: StockTransferStatus;
  fromBranch: string;
  toBranch: string;
  date: string;
  dateObj: Date;
  lines: StockTransferLine[];
  reason?: string;
}

const line = (productId: ProductId, qty: number): StockTransferLine => ({ productId, qty });

const mk = (id: string, status: StockTransferStatus, fromBranch: string, toBranch: string, date: string, dateObj: Date, lines: StockTransferLine[], extra?: Partial<StockTransfer>): StockTransfer => ({
  id, status, fromBranch, toBranch, date, dateObj, lines, ...extra,
});

// One demo transfer per status, so every View layout is directly reachable from the list.
export const stockTransfers: StockTransfer[] = [
  mk("ST-2026-3004", "pending", "Riyadh Main Warehouse", "Khobar Branch", "31 Aug 2026 - 10:15 AM", new Date(2026, 7, 31), [line("esim", 10), line("router", 3)]),
  mk("ST-2026-3003", "inTransit", "Jeddah Branch", "Mecca Branch", "28 Aug 2026 - 2:40 PM", new Date(2026, 7, 28), [line("psim", 8)]),
  mk("ST-2026-3002", "received", "Dammam Branch", "Riyadh Main Warehouse", "20 Aug 2026 - 9:05 AM", new Date(2026, 7, 20), [line("esim", 5), line("psim", 5)]),
  mk("ST-2026-3001", "cancelled", "Medina Branch", "Jeddah Branch", "12 Aug 2026 - 1:00 AM", new Date(2026, 7, 12), [line("router", 4)], {
    reason: "Wrong destination branch selected — resubmitted as ST-2026-3004.",
  }),
];

export const getStockTransfer = (id: string) => stockTransfers.find((o) => o.id === id);

export const updateStockTransfer = (id: string, patch: Partial<StockTransfer>) => {
  const idx = stockTransfers.findIndex((o) => o.id === id);
  if (idx === -1) return;
  stockTransfers[idx] = { ...stockTransfers[idx], ...patch };
};

let nextSeq = 3005;
export const addStockTransfer = (fromBranch: string, toBranch: string, lines: StockTransferLine[]) => {
  const transfer: StockTransfer = {
    id: `ST-2026-${nextSeq++}`,
    status: "pending",
    fromBranch,
    toBranch,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateObj: new Date(),
    lines,
  };
  stockTransfers.unshift(transfer);
  return transfer;
};
