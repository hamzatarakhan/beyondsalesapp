export type TicketStatus = "progress" | "closed" | "resolved" | "pending";
export type TicketPriority = "high" | "medium" | "low";

export interface TicketDoc {
  id: string;
  name: string;
  kind: "file" | "image";
}

export interface TicketComment {
  id: string;
  text: string;
  documents: TicketDoc[];
  date: string;
}

export interface Ticket {
  id: string;
  category: string;
  subCategory: string;
  date: string;
  status: TicketStatus;
  priority: TicketPriority;
  description: string;
  documents: TicketDoc[];
  comments?: TicketComment[];
}

export const TICKET_CATEGORIES = [
  "Billing",
  "SIM Services",
  "Network",
  "Device",
  "Account",
];

export const TICKET_SUB_CATEGORIES: Record<string, string[]> = {
  Billing: ["Invoice dispute", "Payment failed", "Refund request"],
  "SIM Services": ["SIM replacement", "Activation issue", "Number porting"],
  Network: ["No coverage", "Slow data", "Call drops"],
  Device: ["Device registration", "Warranty", "Compatibility"],
  Account: ["Profile update", "Access issue", "Ownership change"],
};

const DEMO_DOCS: TicketDoc[] = [
  { id: "d1", name: "File Title", kind: "file" },
  { id: "d2", name: "Image Title", kind: "image" },
];

// Prototype-only demo tickets — no ticketing backend yet.
export const DEMO_TICKETS: Ticket[] = [
  { id: "TCK-100234", category: "Billing", subCategory: "Invoice dispute", date: "29, 6, 2026", status: "resolved", priority: "high", description: "Customer disputes the last invoice amount.", documents: DEMO_DOCS },
  { id: "TCK-100235", category: "SIM Services", subCategory: "SIM replacement", date: "29, 6, 2026", status: "closed", priority: "medium", description: "SIM replacement request was completed.", documents: DEMO_DOCS },
  { id: "TCK-100236", category: "Network", subCategory: "Slow data", date: "29, 6, 2026", status: "progress", priority: "high", description: "Data speed is below expected in the area.", documents: DEMO_DOCS },
  { id: "TCK-100237", category: "Device", subCategory: "Device registration", date: "29, 6, 2026", status: "pending", priority: "low", description: "Device registration pending review.", documents: DEMO_DOCS },
  { id: "TCK-100238", category: "Account", subCategory: "Profile update", date: "29, 6, 2026", status: "pending", priority: "medium", description: "Customer requested a profile update.", documents: DEMO_DOCS },
];
