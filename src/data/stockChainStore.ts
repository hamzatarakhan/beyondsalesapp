// Demo data for Request/Push Stock "Option 2" — the Team Leader → Regional Manager → Sales Support
// chain. A plain mutable module store (same convention as purchaseOrdersStore): every screen reads
// a fresh snapshot on mount, and there is no backend.
//
//   Team Leader submits        → pendingApproval (Regional Manager)
//   Regional Manager approves  → orderPending    (Sales Support)   [payment proof attached]
//   Sales Support confirms     → orderPlaced     (Regional Manager) [enters Tracking ID]
//   Regional Manager submits   → delivered       (shows as Approved to the Team Leader)
//   Rejection by either approver, or cancellation by the Team Leader, ends the order.

import type { ProductId } from "@/data/purchaseOrdersStore";

export type ChainStatus = "pendingApproval" | "orderPending" | "orderPlaced" | "delivered" | "rejected" | "cancelled";
export type ChainRole = "tl" | "rm" | "ss";

export interface ChainLine { productId: ProductId; qty: number }

export interface ChainOrder {
  id: string;
  status: ChainStatus;
  location: string;
  date: string;
  dateObj: Date;
  lines: ChainLine[];
  proofs: string[];
  trackingId?: string;
  reason?: string;
  rejectedBy?: "rm" | "ss";
}

// The same order reads differently to each role, so each role maps the stage to its own label.
export const statusLabelKey = (role: ChainRole, o: Pick<ChainOrder, "status">): string => {
  const s = o.status;
  if (s === "rejected" || s === "cancelled" || s === "pendingApproval") return s;
  if (role === "tl") return "approved";
  if (role === "rm") return s === "orderPending" ? "approved" : s;
  return s === "delivered" ? "completed" : s;
};

export const visibleTo = (role: ChainRole, o: ChainOrder) => {
  if (role === "tl") return true;
  if (role === "rm") return o.status !== "cancelled";
  return o.status === "orderPending" || o.status === "orderPlaced" || o.status === "delivered" || (o.status === "rejected" && o.rejectedBy === "ss");
};

const d = (day: number, h: number) => new Date(2026, 9, day, h);
const fmt = (x: Date) => `${x.getDate()}, ${x.toLocaleString("en-GB", { month: "short" })}, ${x.getFullYear()} - ${String(x.getHours() % 12 || 12)}:00 ${x.getHours() < 12 ? "AM" : "PM"}`;
const lines = (): ChainLine[] => [{ productId: "vmSim", qty: 10 }, { productId: "voucher10", qty: 10 }, { productId: "router1", qty: 10 }];

const mk = (id: string, status: ChainStatus, location: string, when: Date, extra?: Partial<ChainOrder>): ChainOrder =>
  ({ id, status, location, date: fmt(when), dateObj: when, lines: lines(), proofs: [], ...extra });

export const chainOrders: ChainOrder[] = [
  mk("3515165613", "pendingApproval", "California, USA", d(15, 9)),
  mk("3515165612", "orderPending", "California, USA", d(14, 9), { proofs: ["Payment proof.pdf", "Transfer receipt.png"] }),
  mk("3515165611", "orderPlaced", "King Fahd Road, Al Olaya", d(13, 9), { proofs: ["Payment proof.pdf", "Transfer receipt.png"] }),
  mk("3515165610", "delivered", "California, USA", d(12, 9), { proofs: ["Payment proof.pdf", "Transfer receipt.png"], trackingId: "4466466546464" }),
  mk("3515165609", "rejected", "California, USA", d(11, 9), { rejectedBy: "rm", reason: "Lorem ipsum is simply dummy text of the printing and typesetting industry." }),
];

export const getChainOrder = (id: string) => chainOrders.find((o) => o.id === id);

export const updateChainOrder = (id: string, patch: Partial<ChainOrder>) => {
  const i = chainOrders.findIndex((o) => o.id === id);
  if (i !== -1) chainOrders[i] = { ...chainOrders[i], ...patch };
};

let seq = 3515165614;
export const saveChainOrder = (location: string, ls: ChainLine[], id?: string) => {
  if (id) return updateChainOrder(id, { location, lines: ls });
  const now = new Date();
  chainOrders.unshift({ id: String(seq++), status: "pendingApproval", location, date: fmt(now), dateObj: now, lines: ls, proofs: [] });
};
