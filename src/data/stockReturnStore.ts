// Shared demo data for the Stock Return service — same plain mutable module-store
// convention as stockTransferStore.ts (no backend, every page reads a fresh snapshot on
// mount). A return moves the dealer's own stock back, so like Stock Transfer there is no
// pricing/VAT — just quantities, serials, and a return reason.
import { PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/purchaseOrdersStore";
import type { StockReturnRole } from "@/data/stockReturnScenarios";

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

// Dealer returns go through two approvals: their Team Leader, then the Account Manager.
// The stage is tracked apart from the status the Dealer sees — after the Team Leader approves,
// the order is still Pending (stage: awaitingAccountManager) until the Account Manager decides.
// Returns raised by a Team Leader or Account Manager have no stage here.
export type ApprovalStage = "awaitingTeamLeader" | "awaitingAccountManager" | "completed";

export interface StockReturn {
  id: string;
  status: StockReturnStatus;
  date: string;
  dateObj: Date;
  lines: StockReturnLine[];
  location?: string;
  destination?: string;
  // Who raised the return: their role (decides whose My Request and Task tabs show it) and name.
  raisedBy: StockReturnRole;
  channelMember: string;
  stage?: ApprovalStage;
  // Set once the Team Leader approves, so the Account Manager keeps seeing it after deciding.
  teamLeaderApproved?: boolean;
  rejectReason?: string;
  rejectedBy?: StockReturnRole;
  // Who did what, oldest first — shown in View Order's Status History.
  history: StockReturnHistoryEntry[];
}

export interface StockReturnHistoryEntry {
  action: "submit" | "approve" | "reject";
  role: StockReturnRole;
  name: string;
  date: string;
  reason?: string;
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
export const submitReturnDraft = (reasonLabel: (r: ReturnReasonKey) => string, raisedBy: StockReturnRole, channelMember: string) => {
  const { location, destination, items } = returnDraft;
  const order = addStockReturn(
    items.map((i) => ({ productId: i.productId, qty: i.qty, serials: i.serials, reason: reasonLabel(i.reason), remark: i.remark.trim() || undefined })),
    { location, destination, raisedBy, channelMember },
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

// The demo approvers who acted on the seeded returns.
const APPROVER: Record<"teamLeader" | "accountManager", string> = { teamLeader: "Noura Alqahtani", accountManager: "Ahmed Al-Otaibi" };

// Seeded returns get the history their current state implies: submitted, then any Team Leader
// approval, then the Account Manager's approval or whichever approver rejected it.
const seedHistory = (o: Omit<StockReturn, "history">): StockReturnHistoryEntry[] => {
  const h: StockReturnHistoryEntry[] = [{ action: "submit", role: o.raisedBy, name: o.channelMember, date: o.date }];
  if (o.raisedBy !== "dealer") return h;
  if (o.teamLeaderApproved) h.push({ action: "approve", role: "teamLeader", name: APPROVER.teamLeader, date: o.date });
  if (o.status === "approved") h.push({ action: "approve", role: "accountManager", name: APPROVER.accountManager, date: o.date });
  if (o.status === "rejected" && (o.rejectedBy === "teamLeader" || o.rejectedBy === "accountManager")) {
    h.push({ action: "reject", role: o.rejectedBy, name: APPROVER[o.rejectedBy], date: o.date, reason: o.rejectReason });
  }
  return h;
};

const mk = (id: string, status: StockReturnStatus, date: string, dateObj: Date, lines: StockReturnLine[], who: Pick<StockReturn, "raisedBy" | "channelMember"> & Partial<StockReturn>): StockReturn => {
  const o = { id, status, date, dateObj, lines, destination: "Riyadh Central Warehouse", ...who };
  return { ...o, history: seedHistory(o) };
};

// Same "15, Dec, 2026 – 1:00 AM" format as the order dates.
const nowLabel = () => {
  const d = new Date();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${d.getDate()}, ${d.toLocaleString("en-GB", { month: "short" })}, ${d.getFullYear()} – ${time}`;
};

// Dealer returns, one per approval state. Hamza Tarkan is the demo Dealer user; the others are
// other dealers under the same Team Leader, so they only show in the approvers' Task tabs.
const dealer = (channelMember: string, location: string, stage: ApprovalStage, extra: Partial<StockReturn> = {}): Pick<StockReturn, "raisedBy" | "channelMember"> & Partial<StockReturn> => ({
  raisedBy: "dealer", channelMember, location, stage, ...extra,
});
const ownBy = (raisedBy: StockReturnRole, channelMember: string, location: string) => ({ raisedBy, channelMember, location });

const SEED: StockReturn[] = [
  // The demo Dealer's own returns.
  mk("3515165613", "rejected", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 4), line("router1", 2), line("fingerprint", 1), line("voucher10", 5), line("voucher20", 3)], dealer("Hamza Tarkan", "Riyadh – Olaya Branch", "completed", { teamLeaderApproved: true, rejectedBy: "accountManager", rejectReason: "Damage not covered by return policy" })),
  mk("3515165612", "approved", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 10), line("router1", 1), line("fingerprint", 2), line("voucher50", 4), line("router2", 1)], dealer("Hamza Tarkan", "Riyadh – Olaya Branch", "completed", { teamLeaderApproved: true })),
  mk("3515165611", "pending", "15, Dec, 2026 – 1:00 AM", new Date(2026, 11, 15), [line("vmSim", 6), line("router3", 1), line("fingerprint", 1), line("digitalVoucher", 8), line("voucher100", 2)], dealer("Hamza Tarkan", "Riyadh – Olaya Branch", "awaitingTeamLeader")),
  mk("3515165608", "pending", "12, Dec, 2026 – 9:00 AM", new Date(2026, 11, 12), [line("vmSim", 15), line("voucher20", 10)], dealer("Hamza Tarkan", "Riyadh – Olaya Branch", "awaitingAccountManager", { teamLeaderApproved: true })),
  // Other dealers' returns.
  mk("3515165607", "pending", "16, Dec, 2026 – 10:20 AM", new Date(2026, 11, 16), [line("vmSim", 2), line("router1", 1), line("fingerprint", 1), line("voucher10", 3)], dealer("Fahad Alotaibi", "Riyadh – Olaya Branch", "awaitingTeamLeader")),
  mk("3515165606", "pending", "16, Dec, 2026 – 8:45 AM", new Date(2026, 11, 16), [line("router2", 2), line("digitalVoucher", 4)], dealer("Saad Alghamdi", "Jeddah – Tahlia Branch", "awaitingTeamLeader")),
  mk("3515165605", "pending", "14, Dec, 2026 – 3:10 PM", new Date(2026, 11, 14), [line("vmSim", 6), line("voucher50", 2), line("router3", 1)], dealer("Reem Aldosari", "Dammam – Corniche Branch", "awaitingAccountManager", { teamLeaderApproved: true })),
  mk("3515165604", "rejected", "13, Dec, 2026 – 12:00 PM", new Date(2026, 11, 13), [line("fingerprint", 3), line("voucher20", 5), line("router1", 1), line("vmSim", 2)], dealer("Omar Alharbi", "Riyadh – Malaz Branch", "completed", { rejectedBy: "teamLeader", rejectReason: "Serial numbers don't match" })),
  mk("3515165603", "approved", "11, Dec, 2026 – 9:30 AM", new Date(2026, 11, 11), [line("voucher100", 4)], dealer("Mohammed Al-Dosari", "Khobar – Rakah Branch", "completed", { teamLeaderApproved: true })),
  // The demo Team Leader's own returns (their approval chain isn't modelled). The Account Manager
  // only reviews and raises none.
  mk("3515165610", "approved", "14, Dec, 2026 – 11:30 AM", new Date(2026, 11, 14), [line("voucher10", 20)], ownBy("teamLeader", "Noura Alqahtani", "Riyadh Warehouse")),
  mk("3515165609", "pending", "13, Dec, 2026 – 4:15 PM", new Date(2026, 11, 13), [line("router1", 3), line("router2", 2)], ownBy("teamLeader", "Noura Alqahtani", "Riyadh Warehouse")),
];

// Orders are one shared list for every demo role, kept in sessionStorage so an approval made as
// one demo user is still there after switching to another (even across a page reload).
const STORAGE_KEY = "stockReturns.v4";
const load = (): StockReturn[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return (JSON.parse(raw) as StockReturn[]).map((o) => ({ ...o, dateObj: new Date(o.dateObj) }));
  } catch { /* fall back to the seed */ }
  return SEED;
};
const persist = () => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stockReturns)); } catch { /* demo only */ }
};

export const stockReturns: StockReturn[] = load();

export const getStockReturn = (id: string) => stockReturns.find((o) => o.id === id);
export const updateStockReturn = (id: string, patch: Partial<StockReturn>) => {
  const o = getStockReturn(id);
  if (o) Object.assign(o, patch);
  persist();
};

// Which orders a demo user sees on each tab. My Request: what they raised themselves. Task:
// dealer returns that have reached them — every dealer return for a Team Leader; for the Account
// Manager only those the Team Leader approved. Dealers have no Task tab.
export const ordersFor = (user: { role: StockReturnRole; name: string }, tab: "mine" | "task") =>
  stockReturns.filter((o) =>
    tab === "mine"
      ? o.raisedBy === user.role && o.channelMember === user.name
      : o.raisedBy === "dealer" && (user.role === "teamLeader" || (user.role === "accountManager" && !!o.teamLeaderApproved)),
  );

// Whether `role` can approve or reject this order right now.
export const canReview = (o: StockReturn, role: StockReturnRole) =>
  o.raisedBy === "dealer" && o.status === "pending" &&
  ((role === "teamLeader" && o.stage === "awaitingTeamLeader") || (role === "accountManager" && o.stage === "awaitingAccountManager"));

// Team Leader approval only moves the order on to the Account Manager — it stays Pending.
// Account Manager approval is final. Either approver rejecting ends the process.
// Each decision is also added to the order's history with who made it and when.
const withEntry = (id: string, entry: Omit<StockReturnHistoryEntry, "date">) =>
  [...(getStockReturn(id)?.history ?? []), { ...entry, date: nowLabel() }];

export const approveStockReturn = (id: string, approver: { role: StockReturnRole; name: string }) =>
  updateStockReturn(id, {
    ...(approver.role === "teamLeader" ? { stage: "awaitingAccountManager", teamLeaderApproved: true } : { status: "approved", stage: "completed" }),
    history: withEntry(id, { action: "approve", ...approver }),
  });
export const rejectStockReturn = (id: string, approver: { role: StockReturnRole; name: string }, rejectReason: string) =>
  updateStockReturn(id, {
    status: "rejected", stage: "completed", rejectedBy: approver.role, rejectReason,
    history: withEntry(id, { action: "reject", ...approver, reason: rejectReason }),
  });

let nextSeq = Math.max(3515165614, ...stockReturns.map((o) => Number(o.id) + 1));
// A Dealer's return starts with their Team Leader; anyone else's has no approval stage here.
export const addStockReturn = (lines: StockReturnLine[], where: { location?: string; destination?: string; raisedBy: StockReturnRole; channelMember: string }) => {
  const order: StockReturn = {
    id: String(nextSeq++),
    status: "pending",
    date: nowLabel(),
    dateObj: new Date(),
    lines,
    ...where,
    stage: where.raisedBy === "dealer" ? "awaitingTeamLeader" : undefined,
    history: [{ action: "submit", role: where.raisedBy, name: where.channelMember, date: nowLabel() }],
  };
  stockReturns.unshift(order);
  persist();
  return order;
};
