// Shared demo data for the Purchase Orders service — a plain mutable module store (not
// React state/context) since every Purchase Order page is reached by full navigation
// (list → view → edit → back), each reading a fresh snapshot on mount. No backend here,
// same "prototype" convention the rest of this app's demo flows already use.

export type PurchaseOrderStatus =
  | "rfq"
  | "quotationSent"
  | "awaitingApproval"
  | "awaitingDelivery"
  | "awaitingScanning"
  | "received"
  | "cancelled"
  | "rejected";

export type ProductId = "esim" | "psim" | "router";

export interface PurchaseOrderProduct {
  id: ProductId;
  nameKey: string;
  availableStocks: number;
  price: number;
}

export const PURCHASE_ORDER_PRODUCTS: PurchaseOrderProduct[] = [
  { id: "esim", nameKey: "eSim", availableStocks: 100, price: 3 },
  { id: "psim", nameKey: "pSim", availableStocks: 100, price: 3 },
  { id: "router", nameKey: "router", availableStocks: 100, price: 3 },
];

export const DEMO_DESTINATIONS = ["Riyadh Main Warehouse", "Jeddah Branch", "Dammam Branch", "Mecca Branch", "Medina Branch", "Khobar Branch"];

const VAT_RATE = 0.15;

export interface PurchaseOrderLine {
  productId: ProductId;
  qty: number;
  scanned: number;
  serials: string[];
}

export interface PurchaseOrder {
  id: string;
  status: PurchaseOrderStatus;
  destination: string;
  date: string;
  dateObj: Date;
  lines: PurchaseOrderLine[];
  untaxed: number;
  tax: number;
  total: number;
  reason?: string;
  partiallyReserved?: boolean;
}

export const computeTotals = (lines: { productId: ProductId; qty: number }[]) => {
  const untaxed = lines.reduce((sum, l) => sum + qty(l) * priceOf(l.productId), 0);
  const tax = untaxed * VAT_RATE;
  return { untaxed, tax, total: untaxed + tax };
};
function qty(l: { qty: number }) { return l.qty; }
function priceOf(id: ProductId) { return PURCHASE_ORDER_PRODUCTS.find((p) => p.id === id)?.price ?? 0; }

const line = (productId: ProductId, qtyVal: number, scanned = 0): PurchaseOrderLine => ({
  productId,
  qty: qtyVal,
  scanned,
  serials: Array.from({ length: scanned }, (_, i) => `SN-${productId.toUpperCase()}-${1000 + i}`),
});

const mk = (id: string, status: PurchaseOrderStatus, destination: string, date: string, dateObj: Date, lines: PurchaseOrderLine[], extra?: Partial<PurchaseOrder>): PurchaseOrder => {
  const { untaxed, tax, total } = computeTotals(lines);
  return { id, status, destination, date, dateObj, lines, untaxed, tax, total, ...extra };
};

// One demo order per status, so every View Order layout is directly reachable from the list.
export const purchaseOrders: PurchaseOrder[] = [
  mk("PO-2026-1007", "rfq", "Riyadh Main Warehouse", "31 Aug 2026 - 10:15 AM", new Date(2026, 7, 31), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("PO-2026-1006", "quotationSent", "Jeddah Branch", "29 Aug 2026 - 4:40 PM", new Date(2026, 7, 29), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("PO-2026-1005", "awaitingApproval", "Dammam Branch", "26 Aug 2026 - 9:05 AM", new Date(2026, 7, 26), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("PO-2026-1004", "awaitingDelivery", "Mecca Branch", "20 Aug 2026 - 2:20 PM", new Date(2026, 7, 20), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("PO-2026-1003", "awaitingScanning", "Medina Branch", "15 Aug 2026 - 11:50 AM", new Date(2026, 7, 15), [line("esim", 5, 5), line("psim", 6, 6), line("router", 4, 1)]),
  mk("PO-2026-1002", "received", "Khobar Branch", "10 Aug 2026 - 5:30 PM", new Date(2026, 7, 10), [line("esim", 5, 5), line("psim", 6, 6), line("router", 4, 4)]),
  mk("PO-2026-1001", "cancelled", "Riyadh Main Warehouse", "5 Aug 2026 - 1:00 AM", new Date(2026, 7, 5), [line("esim", 5), line("psim", 6), line("router", 4)], {
    reason: "Budget for this quarter's stock replenishment was already exhausted.",
  }),
  mk("PO-2026-1000", "rejected", "Jeddah Branch", "2 Aug 2026 - 1:00 AM", new Date(2026, 7, 2), [line("esim", 5), line("psim", 6), line("router", 4)], {
    reason: "The submitted quotation exceeded the approved supplier price list.",
  }),
];

export const getPurchaseOrder = (id: string) => purchaseOrders.find((o) => o.id === id);

export const updatePurchaseOrder = (id: string, patch: Partial<PurchaseOrder>) => {
  const idx = purchaseOrders.findIndex((o) => o.id === id);
  if (idx === -1) return;
  purchaseOrders[idx] = { ...purchaseOrders[idx], ...patch };
};

let nextSeq = 1008;
export const addPurchaseOrder = (destination: string, lines: PurchaseOrderLine[]) => {
  const { untaxed, tax, total } = computeTotals(lines);
  const order: PurchaseOrder = {
    id: `PO-2026-${nextSeq++}`,
    status: "rfq",
    destination,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateObj: new Date(),
    lines,
    untaxed,
    tax,
    total,
  };
  purchaseOrders.unshift(order);
  return order;
};
