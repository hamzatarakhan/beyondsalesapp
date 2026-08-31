// Shared demo data for the Sales Orders service — same plain mutable module-store
// convention as purchaseOrdersStore.ts (no backend, every page reads a fresh snapshot on
// mount). Reuses that file's product catalog/destinations/totals math since Sales Orders
// sells the exact same E-SIM/P-SIM/Router stock, just outbound to a channel member
// instead of inbound from a supplier.
import { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS, computeTotals, type ProductId } from "@/data/purchaseOrdersStore";

export { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS, computeTotals };
export type { ProductId };

export type SalesOrderStatus =
  | "rfq"
  | "quotationSent"
  | "awaitingApproval"
  | "awaitingDelivery"
  | "awaitingScanning"
  | "received"
  | "cancelled"
  | "rejected";

export interface ChannelMember {
  name: string;
  code: string;
}

export const DEMO_CHANNEL_MEMBERS: ChannelMember[] = [
  { name: "Sara Ahmad", code: "DST001" },
  { name: "Faisal Al-Otaibi", code: "DST002" },
  { name: "Noura Al-Harbi", code: "DST003" },
  { name: "Khalid Al-Dosari", code: "DST004" },
];

// Placeholder — swap this array once the real multi-location list is supplied. Shown in
// the "Select Location" picker when entering Sales Orders from Home.
export const DEMO_SALES_LOCATIONS = ["Riyadh Main Branch", "Jeddah Branch", "Dammam Branch"];

export interface SalesOrderLine {
  productId: ProductId;
  qty: number;
  scanned: number;
  serials: string[];
}

export interface SalesOrder {
  id: string;
  status: SalesOrderStatus;
  destination: string;
  channelMember: ChannelMember;
  date: string;
  dateObj: Date;
  lines: SalesOrderLine[];
  untaxed: number;
  tax: number;
  total: number;
  reason?: string;
}

const line = (productId: ProductId, qty: number, scanned = 0): SalesOrderLine => ({
  productId,
  qty,
  scanned,
  serials: Array.from({ length: scanned }, (_, i) => `SN-${productId.toUpperCase()}-${2000 + i}`),
});

const mk = (
  id: string,
  status: SalesOrderStatus,
  destination: string,
  channelMember: ChannelMember,
  date: string,
  dateObj: Date,
  lines: SalesOrderLine[],
  extra?: Partial<SalesOrder>,
): SalesOrder => {
  const { untaxed, tax, total } = computeTotals(lines);
  return { id, status, destination, channelMember, date, dateObj, lines, untaxed, tax, total, ...extra };
};

// One demo order per status, so every View Order layout is directly reachable from the list.
export const salesOrders: SalesOrder[] = [
  mk("SO-2026-2007", "rfq", "Riyadh Main Warehouse", DEMO_CHANNEL_MEMBERS[0], "31 Aug 2026 - 10:15 AM", new Date(2026, 7, 31), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SO-2026-2006", "quotationSent", "Jeddah Branch", DEMO_CHANNEL_MEMBERS[1], "29 Aug 2026 - 4:40 PM", new Date(2026, 7, 29), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SO-2026-2005", "awaitingApproval", "Dammam Branch", DEMO_CHANNEL_MEMBERS[2], "26 Aug 2026 - 9:05 AM", new Date(2026, 7, 26), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SO-2026-2004", "awaitingDelivery", "Mecca Branch", DEMO_CHANNEL_MEMBERS[3], "20 Aug 2026 - 2:20 PM", new Date(2026, 7, 20), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SO-2026-2003", "awaitingScanning", "Medina Branch", DEMO_CHANNEL_MEMBERS[0], "15 Aug 2026 - 11:50 AM", new Date(2026, 7, 15), [line("esim", 5, 5), line("psim", 6, 6), line("router", 4, 1)]),
  mk("SO-2026-2002", "received", "Khobar Branch", DEMO_CHANNEL_MEMBERS[1], "10 Aug 2026 - 5:30 PM", new Date(2026, 7, 10), [line("esim", 5, 5), line("psim", 6, 6), line("router", 4, 4)]),
  mk("SO-2026-2001", "cancelled", "Riyadh Main Warehouse", DEMO_CHANNEL_MEMBERS[2], "5 Aug 2026 - 1:00 AM", new Date(2026, 7, 5), [line("esim", 5), line("psim", 6), line("router", 4)], {
    reason: "The channel member requested a different product mix before delivery.",
  }),
  mk("SO-2026-2000", "rejected", "Jeddah Branch", DEMO_CHANNEL_MEMBERS[3], "2 Aug 2026 - 1:00 AM", new Date(2026, 7, 2), [line("esim", 5), line("psim", 6), line("router", 4)], {
    reason: "The channel member's credit limit could not cover this order.",
  }),
];

export const getSalesOrder = (id: string) => salesOrders.find((o) => o.id === id);

export const updateSalesOrder = (id: string, patch: Partial<SalesOrder>) => {
  const idx = salesOrders.findIndex((o) => o.id === id);
  if (idx === -1) return;
  salesOrders[idx] = { ...salesOrders[idx], ...patch };
};

let nextSeq = 2008;
export const addSalesOrder = (destination: string, channelMember: ChannelMember, lines: SalesOrderLine[]) => {
  const { untaxed, tax, total } = computeTotals(lines);
  const order: SalesOrder = {
    id: `SO-2026-${nextSeq++}`,
    status: "rfq",
    destination,
    channelMember,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateObj: new Date(),
    lines,
    untaxed,
    tax,
    total,
  };
  salesOrders.unshift(order);
  return order;
};
