// Broadcast demo data. Sent broadcasts live in memory so a broadcast sent from the
// compose screen shows up at the top of the Sent list for the rest of the session.

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  date: string;
  /** Sent: who it went to. Received: who sent it. */
  party: string;
  /** Sent: number of recipients. */
  recipients?: number;
  /** Received: not opened yet. */
  unread?: boolean;
}

export const BROADCAST_MEMBERS = ["Sara Ahmad", "Faisal Al-Otaibi", "Noura Al-Harbi"];

const sent: BroadcastMessage[] = [
  { id: "BC-1042", title: "Weekend activation push", message: "Please focus on Mobile Prepaid activations this weekend. Stock is available at all locations.", date: "16 Nov 2026 - 10:15 AM", party: "All Members", recipients: 3 },
  { id: "BC-1037", title: "Stock count reminder", message: "Submit your monthly stock count before the end of the day on 30 Nov.", date: "12 Nov 2026 - 4:40 PM", party: "Sara Ahmad", recipients: 1 },
];

const received: BroadcastMessage[] = [
  { id: "BC-2210", title: "New Baqah plans launched", message: "Baqah 45 and Baqah 100 are now available in SIM Activation and Change Prepaid Bundle.", date: "17 Nov 2026 - 9:00 AM", party: "Regional Manager", unread: true },
  { id: "BC-2195", title: "Commission payout", message: "October commission has been credited to your dealer wallet.", date: "10 Nov 2026 - 1:20 PM", party: "Sales Operations", unread: true },
  { id: "BC-2170", title: "System maintenance", message: "The app will be unavailable on Friday from 2:00 AM to 4:00 AM.", date: "3 Nov 2026 - 6:05 PM", party: "Sales Operations" },
];

export const getSentBroadcasts = () => sent;
export const getReceivedBroadcasts = () => received;
export const unreadBroadcastCount = () => received.filter((b) => b.unread).length;
export const markBroadcastRead = (id: string) => {
  const b = received.find((x) => x.id === id);
  if (b) b.unread = false;
};

export function addSentBroadcast(b: Omit<BroadcastMessage, "id" | "date">) {
  const date = new Date();
  const d = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const tm = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  sent.unshift({ ...b, id: `BC-${1043 + sent.length}`, date: `${d} - ${tm}` });
}
