// Demo data for Request/Push Stock "Option 2". One store holds both flows so an order created by
// one role shows up for the next role in the chain:
//
//   dealer flow: Dealer → Team Leader (approve, scan) → Dealer (confirm receipt / report issue / reject)
//   push order:  a Team Leader creates an order for a Dealer; it skips approval and starts at Awaiting Scanning
//   chain flow:  Team Leader → Regional Manager (proof, approve) → Sales Support (confirm)
//                → Regional Manager (tracking ID) → delivered, shown as Approved to the Team Leader
//
// A plain mutable module store (same convention as purchaseOrdersStore), mirrored to localStorage
// so a reload or a dev-server refresh between roles doesn't wipe the demo orders.

import type { ProductId } from "@/data/purchaseOrdersStore";
import type { OrderIssue } from "@/data/salesOrdersStore";

export type Flow = "dealer" | "chain";
export type ChainStatus =
  | "awaitingApproval" | "awaitingScanning" | "awaitingDelivery" | "received" | "issueReported" // dealer flow
  | "pendingApproval" | "orderPending" | "orderPlaced" | "delivered" // chain flow
  | "rejected" | "cancelled"; // either
export type ChainRole = "dealer" | "tlPush" | "tl" | "rm" | "ss";

export interface ChainLine { productId: ProductId; qty: number; serials: string[] }

export interface ChainOrder {
  id: string;
  flow: Flow;
  status: ChainStatus;
  location: string;
  date: string;
  dateObj: Date;
  lines: ChainLine[];
  proofs: string[];
  trackingId?: string;
  reason?: string;
  rejectedBy?: "rm" | "ss";
  issue?: OrderIssue;
  /** Pushed by the Team Leader for this channel member; such orders skip Awaiting Approval. */
  member?: string;
  pushed?: boolean;
}

export const CHANNEL_MEMBERS = ["Fahad Alotaibi", "Noura Alqahtani", "Saad Alghamdi", "Reem Aldosari", "Omar Alharbi"];

export const ROLE_FLOW: Record<ChainRole, Flow> = { dealer: "dealer", tlPush: "dealer", tl: "chain", rm: "chain", ss: "chain" };

// The same order reads differently to each role, so each role maps the stage to its own label.
export const statusLabelKey = (role: ChainRole, o: Pick<ChainOrder, "status" | "flow">): string => {
  const s = o.status;
  if (o.flow === "dealer") return s === "awaitingApproval" && role === "dealer" ? "orderSubmitted" : s;
  if (s === "rejected" || s === "cancelled" || s === "pendingApproval") return s;
  if (role === "tl") return "approved";
  if (role === "rm") return s === "orderPending" ? "approved" : s;
  return s === "delivered" ? "completed" : s;
};

export const visibleTo = (role: ChainRole, o: ChainOrder) => {
  if (o.flow !== ROLE_FLOW[role]) return false;
  if (role === "tlPush") return o.status !== "cancelled";
  if (role === "rm") return o.status !== "cancelled";
  if (role === "ss") return o.status === "orderPending" || o.status === "orderPlaced" || o.status === "delivered" || (o.status === "rejected" && o.rejectedBy === "ss");
  return true;
};

const fmt = (x: Date) => `${x.getDate()}, ${x.toLocaleString("en-GB", { month: "short" })}, ${x.getFullYear()} - ${x.getHours() % 12 || 12}:${String(x.getMinutes()).padStart(2, "0")} ${x.getHours() < 12 ? "AM" : "PM"}`;
const d = (day: number, h: number) => new Date(2026, 9, day, h);
const serials = (p: ProductId, n: number) => Array.from({ length: n }, (_, i) => `SN-${p.toUpperCase()}-${1000 + i}`);
const lines = (scanned = false): ChainLine[] =>
  ([["vmSim", 10], ["voucher10", 10], ["router1", 10]] as [ProductId, number][]).map(([productId, qty]) => ({ productId, qty, serials: scanned ? serials(productId, qty) : [] }));

const mk = (id: string, flow: Flow, status: ChainStatus, location: string, when: Date, extra?: Partial<ChainOrder>): ChainOrder =>
  ({ id, flow, status, location, date: fmt(when), dateObj: when, lines: lines(), proofs: [], ...extra });

const PROOFS = ["Payment proof.pdf", "Transfer receipt.png"];
const seed = (): ChainOrder[] => [
  // dealer flow — one order per status
  mk("3515165702", "dealer", "awaitingScanning", "Riyadh Main Warehouse", d(28, 11), { pushed: true, member: "Noura Alqahtani" }),
  mk("3515165701", "dealer", "awaitingApproval", "Jeddah Branch", d(27, 9)),
  mk("3515165700", "dealer", "awaitingScanning", "Dammam Branch", d(26, 9)),
  mk("3515165699", "dealer", "awaitingDelivery", "Mecca Branch", d(25, 9), { lines: lines(true) }),
  mk("3515165698", "dealer", "received", "Khobar Branch", d(24, 9), { lines: lines(true) }),
  mk("3515165697", "dealer", "issueReported", "Medina Branch", d(23, 9), {
    lines: lines(true),
    issue: { ticketId: "TCK-20458", category: "Stock", subCategory: "Damaged items", date: "23 Oct 2026", priority: "high", documents: [], description: "Two SIM packs arrived damaged." },
  }),
  mk("3515165696", "dealer", "rejected", "Riyadh Main Warehouse", d(22, 9), { reason: "Incorrect items or quantities — please resubmit." }),
  mk("3515165695", "dealer", "cancelled", "Jeddah Branch", d(21, 9), { reason: "Budget constraints" }),
  // chain flow — one order per status
  mk("3515165615", "chain", "pendingApproval", "California, USA", d(28, 9)),
  mk("3515165614", "chain", "orderPending", "California, USA", d(27, 10), { proofs: PROOFS }),
  mk("3515165613", "chain", "orderPlaced", "King Fahd Road, Al Olaya", d(26, 10), { proofs: PROOFS }),
  mk("3515165612", "chain", "delivered", "California, USA", d(25, 10), { proofs: PROOFS, trackingId: "4466466546464" }),
  mk("3515165611", "chain", "rejected", "California, USA", d(24, 10), { rejectedBy: "rm", reason: "Invalid payment proof — please resubmit." }),
  mk("3515165610", "chain", "cancelled", "California, USA", d(23, 10), { reason: "Budget constraints" }),
];

const KEY = "stockOpt2.orders.v5";
const load = (): ChainOrder[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (JSON.parse(raw) as ChainOrder[]).map((o) => ({ ...o, dateObj: new Date(o.dateObj) }));
  } catch { /* storage unavailable: fall back to the seed */ }
  return seed();
};
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(chainOrders)); } catch { /* demo only */ } };

export const chainOrders: ChainOrder[] = load();

export const resetChainOrders = () => { chainOrders.splice(0, chainOrders.length, ...seed()); persist(); };

export const getChainOrder = (id: string) => chainOrders.find((o) => o.id === id);

export const updateChainOrder = (id: string, patch: Partial<ChainOrder>) => {
  const i = chainOrders.findIndex((o) => o.id === id);
  if (i !== -1) { chainOrders[i] = { ...chainOrders[i], ...patch }; persist(); }
};

// Create a new order, or replace the location and quantities of an existing one (Edit).
export const saveChainOrder = (flow: Flow, location: string, qtys: { productId: ProductId; qty: number }[], id?: string, push?: { member: string }) => {
  const ls: ChainLine[] = qtys.map((q) => ({ ...q, serials: [] }));
  if (id) return updateChainOrder(id, { location, lines: ls });
  const now = new Date();
  const next = Math.max(...chainOrders.map((o) => Number(o.id)), 3515165700) + 1;
  // A pushed order skips Awaiting Approval: the Team Leader already decided, so it goes straight to scanning.
  const status: ChainStatus = push ? "awaitingScanning" : flow === "dealer" ? "awaitingApproval" : "pendingApproval";
  chainOrders.unshift({ id: String(next), flow, status, location, date: fmt(now), dateObj: now, lines: ls, proofs: [], ...(push ? { pushed: true, member: push.member } : {}) });
  persist();
};
