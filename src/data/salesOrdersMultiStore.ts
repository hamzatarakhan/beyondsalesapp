// Sales Orders — Multiple Locations business. Reuses the single-location store's product
// catalog/destinations/channel members/totals math (identical there), but each order line
// can be split across several source locations once approved — that's the one real
// difference from the single-location flow, so it gets its own parallel store/pages
// rather than complicating the single-location ones.
import { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS, computeTotals, type ProductId } from "@/data/purchaseOrdersStore";
import { DEMO_CHANNEL_MEMBERS, type ChannelMember } from "@/data/salesOrdersStore";

export { PURCHASE_ORDER_PRODUCTS, DEMO_DESTINATIONS, DEMO_CHANNEL_MEMBERS, computeTotals };
export type { ProductId, ChannelMember };

export type SalesOrderStatus =
  | "rfq"
  | "quotationSent"
  | "awaitingApproval"
  | "awaitingDelivery"
  | "awaitingScanning"
  | "received"
  | "cancelled"
  | "rejected";

// Demo source locations a product can be fulfilled from, each with its own available
// stock — distinct from DEMO_DESTINATIONS (where the order ships to).
export const DEMO_SOURCE_LOCATIONS = ["Riyadh Warehouse", "Jeddah Warehouse", "Dammam Warehouse", "Khobar Warehouse", "Medina Warehouse"];
const SOURCE_AVAILABLE_STOCK = 54;

export interface SalesOrderSource {
  location: string;
  qty: number;
  scanned: number;
  serials: string[];
}

export interface SalesOrderLine {
  productId: ProductId;
  qty: number;
  // Empty until "Select Location" is completed for this line — flat qty with no sourcing
  // yet, same as the single-location line shape until then.
  sources: SalesOrderSource[];
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

const source = (location: string, qty: number, scanned = 0): SalesOrderSource => ({
  location,
  qty,
  scanned,
  serials: Array.from({ length: scanned }, (_, i) => `SN-${location.replace(/\s+/g, "").toUpperCase()}-${3000 + i}`),
});

const line = (productId: ProductId, qty: number, sources: SalesOrderSource[] = []): SalesOrderLine => ({ productId, qty, sources });

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
  const { untaxed, tax, total } = computeTotals(lines.map((l) => ({ productId: l.productId, qty: l.qty })));
  return { id, status, destination, channelMember, date, dateObj, lines, untaxed, tax, total, ...extra };
};

// One demo order per status, matching the single-location store's seeding — awaitingDelivery/
// awaitingScanning/received are pre-sourced (split across 2 locations) so their layouts are
// reachable directly; earlier statuses have no sources yet, same as a freshly created order.
export const salesOrdersMulti: SalesOrder[] = [
  mk("SOM-2026-3007", "rfq", "Riyadh Main Warehouse", DEMO_CHANNEL_MEMBERS[0], "31 Aug 2026 - 10:15 AM", new Date(2026, 7, 31), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SOM-2026-3006", "quotationSent", "Jeddah Branch", DEMO_CHANNEL_MEMBERS[1], "29 Aug 2026 - 4:40 PM", new Date(2026, 7, 29), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SOM-2026-3005", "awaitingApproval", "Dammam Branch", DEMO_CHANNEL_MEMBERS[2], "26 Aug 2026 - 9:05 AM", new Date(2026, 7, 26), [line("esim", 5), line("psim", 6), line("router", 4)]),
  mk("SOM-2026-3004", "awaitingDelivery", "Mecca Branch", DEMO_CHANNEL_MEMBERS[3], "20 Aug 2026 - 2:20 PM", new Date(2026, 7, 20), [
    line("esim", 5, [source("Riyadh Warehouse", 5)]),
    line("psim", 6, [source("Riyadh Warehouse", 3), source("Jeddah Warehouse", 3)]),
    line("router", 4, [source("Jeddah Warehouse", 4)]),
  ]),
  mk("SOM-2026-3003", "awaitingScanning", "Medina Branch", DEMO_CHANNEL_MEMBERS[0], "15 Aug 2026 - 11:50 AM", new Date(2026, 7, 15), [
    line("esim", 5, [source("Riyadh Warehouse", 5, 5)]),
    line("psim", 6, [source("Riyadh Warehouse", 3, 3), source("Jeddah Warehouse", 3, 3)]),
    line("router", 4, [source("Jeddah Warehouse", 2, 0), source("Dammam Warehouse", 2, 1)]),
  ]),
  mk("SOM-2026-3002", "received", "Khobar Branch", DEMO_CHANNEL_MEMBERS[1], "10 Aug 2026 - 5:30 PM", new Date(2026, 7, 10), [
    line("esim", 5, [source("Riyadh Warehouse", 5, 5)]),
    line("psim", 6, [source("Riyadh Warehouse", 3, 3), source("Jeddah Warehouse", 3, 3)]),
    line("router", 4, [source("Jeddah Warehouse", 4, 4)]),
  ]),
  mk("SOM-2026-3001", "cancelled", "Riyadh Main Warehouse", DEMO_CHANNEL_MEMBERS[2], "5 Aug 2026 - 1:00 AM", new Date(2026, 7, 5), [line("esim", 5), line("psim", 6), line("router", 4)], {
    reason: "The channel member requested a different product mix before delivery.",
  }),
  mk("SOM-2026-3000", "rejected", "Jeddah Branch", DEMO_CHANNEL_MEMBERS[3], "2 Aug 2026 - 1:00 AM", new Date(2026, 7, 2), [line("esim", 5), line("psim", 6), line("router", 4)], {
    reason: "The channel member's credit limit could not cover this order.",
  }),
];

export const getSalesOrderMulti = (id: string) => salesOrdersMulti.find((o) => o.id === id);

export const updateSalesOrderMulti = (id: string, patch: Partial<SalesOrder>) => {
  const idx = salesOrdersMulti.findIndex((o) => o.id === id);
  if (idx === -1) return;
  salesOrdersMulti[idx] = { ...salesOrdersMulti[idx], ...patch };
};

let nextSeq = 3008;
export const addSalesOrderMulti = (destination: string, channelMember: ChannelMember, lines: { productId: ProductId; qty: number }[]) => {
  const fullLines = lines.map((l) => line(l.productId, l.qty));
  const { untaxed, tax, total } = computeTotals(lines);
  const order: SalesOrder = {
    id: `SOM-2026-${nextSeq++}`,
    status: "rfq",
    destination,
    channelMember,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateObj: new Date(),
    lines: fullLines,
    untaxed,
    tax,
    total,
  };
  salesOrdersMulti.unshift(order);
  return order;
};

export const sourceAvailableStock = () => SOURCE_AVAILABLE_STOCK;
