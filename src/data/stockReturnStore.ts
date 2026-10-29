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
  // Who raised the return. Unset on the user's own demo returns (the page shows the demo user).
  channelMember?: string;
  // "mine" (default): raised by the signed-in user — My Request. "task": raised by a dealer
  // reporting to a Team Leader and reviewed by that Team Leader — the Task tab.
  kind?: "mine" | "task";
  rejectReason?: string;
}

export const RETURN_REASONS = ["damagedSim", "defectiveDevice", "wrongItem", "expiredVoucher", "excessStock", "others"] as const;
export type ReturnReasonKey = (typeof RETURN_REASONS)[number];

// One product's saved return details inside the order being built.
export interface ReturnDraftItem {
  productId: ProductId;
  qty: number;
  serials: string[];
  // Serials that came from the product's one Range Scan (also in `serials`), so Edit keeps
  // Range Scan locked while any of them remain.
  rangeSerials?: string[];
  reason: ReturnReasonKey;
  remark: string;
}

// The Stock Return order being built: Location & Destination from the first step (Dealer /
// Team Leader only) plus every product the user has saved with the product page's Submit.
// Products are keyed by productId, so saving the same product again updates it instead of
// adding a duplicate. Submit Order on the product list turns the whole draft into one return.
export interface ReturnDraft {
  location?: string;
  destination?: string;
  items: ReturnDraftItem[];
}

export let returnDraft: ReturnDraft = { items: [] };
export const setReturnDraft = (d: Partial<ReturnDraft>) => { returnDraft = { items: [], ...d }; };
export const getDraftItem = (productId: ProductId) => returnDraft.items.find((i) => i.productId === productId);
export const saveDraftItem = (item: ReturnDraftItem) => {
  const exists = returnDraft.items.some((i) => i.productId === item.productId);
  returnDraft = {
    ...returnDraft,
    items: exists ? returnDraft.items.map((i) => (i.productId === item.productId ? item : i)) : [...returnDraft.items, item],
  };
};
// `reasonLabel` turns a reason key into the display text stored on the return, same as the
// single-product submit did before.
export const submitReturnDraft = (reasonLabel: (r: ReturnReasonKey) => string, channelMember?: string) => {
  const { location, destination, items } = returnDraft;
  const order = addStockReturn(
    items.map((i) => ({ productId: i.productId, qty: i.qty, serials: i.serials, reason: reasonLabel(i.reason), remark: i.remark.trim() || undefined })),
    { location, destination, channelMember },
  );
  returnDraft = { items: [] };
  return order;
};

const line = (productId: ProductId, qty: number, reason: ReturnReasonKey = "damagedSim"): StockReturnLine => ({
  productId,
  qty,
  serials: Array.from({ length: qty }, (_, i) => `SN-${productId.toUpperCase()}-${2000 + i}`),
  reason,
});

const mk = (id: string, status: StockReturnStatus, date: string, dateObj: Date, lines: StockReturnLine[], extra: Partial<StockReturn> = {}): StockReturn => ({
  id, status, date, dateObj, lines, ...extra,
});

const task = (channelMember: string, location: string, rejectReason?: string): Partial<StockReturn> => ({
  kind: "task", channelMember, location, destination: "Riyadh Central Warehouse", rejectReason,
});

// One demo return per status, so every state is directly visible in the list.
export const stockReturns: StockReturn[] = [
  mk("3515165613", "rejected", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 4), line("router1", 2), line("fingerprint", 1), line("voucher10", 5), line("voucher20", 3)]),
  mk("3515165612", "approved", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 10), line("router1", 1), line("fingerprint", 2), line("voucher50", 4), line("router2", 1)]),
  mk("3515165611", "pending", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 6), line("router3", 1), line("fingerprint", 1), line("digitalVoucher", 8), line("voucher100", 2)]),
  mk("3515165610", "approved", "14, Dec, 2026 – 11:30 AM", new Date(2026, 11, 14), [line("voucher10", 20)],),
  mk("3515165609", "approved", "13, Dec, 2026 – 4:15 PM", new Date(2026, 11, 13), [line("router1", 3), line("router2", 2)]),
  mk("3515165608", "pending", "12, Dec, 2026 – 9:00 AM", new Date(2026, 11, 12), [line("vmSim", 15), line("voucher20", 10)]),
  // Dealers' returns waiting on (or already reviewed by) their Team Leader — the Task tab.
  mk("3515165607", "pending", "16, Dec, 2026 – 10:20 AM", new Date(2026, 11, 16), [line("vmSim", 2), line("router1", 1), line("fingerprint", 1), line("voucher10", 3)], task("Fahad Alotaibi", "Riyadh – Olaya Branch")),
  mk("3515165606", "pending", "16, Dec, 2026 – 8:45 AM", new Date(2026, 11, 16), [line("router2", 2), line("digitalVoucher", 4)], task("Saad Alghamdi", "Jeddah – Tahlia Branch")),
  mk("3515165605", "approved", "14, Dec, 2026 – 3:10 PM", new Date(2026, 11, 14), [line("vmSim", 6), line("voucher50", 2), line("router3", 1)], task("Reem Aldosari", "Dammam – Corniche Branch")),
  mk("3515165604", "rejected", "13, Dec, 2026 – 12:00 PM", new Date(2026, 11, 13), [line("fingerprint", 3), line("voucher20", 5), line("router1", 1), line("vmSim", 2)], task("Omar Alharbi", "Riyadh – Malaz Branch", "Serial numbers don't match the dealer's stock.")),
  mk("3515165603", "approved", "11, Dec, 2026 – 9:30 AM", new Date(2026, 11, 11), [line("voucher100", 4)], task("Mohammed Al-Dosari", "Khobar – Rakah Branch")),
];

export const getStockReturn = (id: string) => stockReturns.find((o) => o.id === id);
export const updateStockReturn = (id: string, patch: Partial<StockReturn>) => {
  const o = getStockReturn(id);
  if (o) Object.assign(o, patch);
};

let nextSeq = 3515165614;
export const addStockReturn = (lines: StockReturnLine[], where: { location?: string; destination?: string; channelMember?: string } = {}) => {
  const order: StockReturn = {
    id: String(nextSeq++),
    status: "pending",
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    dateObj: new Date(),
    lines,
    ...where,
  };
  stockReturns.unshift(order);
  return order;
};
