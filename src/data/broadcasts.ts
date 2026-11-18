// Broadcast demo data. Sent broadcasts live in memory so a broadcast sent from the
// compose screen shows up at the top of the Sent list for the rest of the session.

export interface BroadcastMember {
  name: string;
  code: string;
  region: string;
  wilaya: string;
  location: string;
}

export interface BroadcastDoc {
  id: string;
  name: string;
  kind: "file" | "image";
}

export interface BroadcastMessage {
  id: string;
  message: string;
  date: string;
  /** Sent: the channel members it went to. */
  members?: BroadcastMember[];
  /** Received: who sent it. */
  from?: string;
  documents?: BroadcastDoc[];
  /** Voice note length in seconds, when one was recorded. */
  voiceSeconds?: number;
  /** Received: not opened yet. */
  unread?: boolean;
}

// Placeholder channel members for the "Channel Member" picker and its Region / Wilaya / Location filter.
export const BROADCAST_MEMBERS: BroadcastMember[] = [
  { name: "Sara Ahmad", code: "DST001", region: "Central", wilaya: "Riyadh", location: "Riyadh Main Branch" },
  { name: "Faisal Al-Otaibi", code: "DST002", region: "Central", wilaya: "Riyadh", location: "Olaya Branch" },
  { name: "Noura Al-Harbi", code: "DST003", region: "Western", wilaya: "Jeddah", location: "Jeddah Branch" },
  { name: "Khalid Al-Dosari", code: "DST004", region: "Eastern", wilaya: "Dammam", location: "Dammam Branch" },
  { name: "Mona Al-Qahtani", code: "DST005", region: "Western", wilaya: "Mecca", location: "Mecca Branch" },
  { name: "Omar Al-Shehri", code: "DST006", region: "Eastern", wilaya: "Khobar", location: "Khobar Branch" },
  { name: "Reem Al-Ghamdi", code: "DST007", region: "Western", wilaya: "Jeddah", location: "Tahlia Branch" },
];

const sent: BroadcastMessage[] = [
  { id: "BC-1045", message: "New Baqah 100 posters and the updated price list are attached. Listen to the voice note for the key selling points.", date: "17 Nov 2026 - 2:30 PM", members: BROADCAST_MEMBERS.slice(2, 7), documents: [{ id: "d5", name: "Baqah_100_Poster.jpg", kind: "image" }, { id: "d6", name: "Price_List_Nov.pdf", kind: "file" }], voiceSeconds: 18 },
  { id: "BC-1042", message: "Please focus on Mobile Prepaid activations this weekend. Stock is available at all locations.", date: "16 Nov 2026 - 10:15 AM", members: BROADCAST_MEMBERS.slice(0, 4), documents: [{ id: "d1", name: "Weekend_Targets.pdf", kind: "file" }] },
  { id: "BC-1037", message: "Submit your monthly stock count before the end of the day on 30 Nov.", date: "12 Nov 2026 - 4:40 PM", members: [BROADCAST_MEMBERS[0]], voiceSeconds: 12 },
];

const received: BroadcastMessage[] = [
  { id: "BC-2210", message: "Baqah 45 and Baqah 100 are now available in SIM Activation and Change Prepaid Bundle.", date: "17 Nov 2026 - 9:00 AM", from: "Ahmed Al-Zahrani", unread: true, documents: [{ id: "d3", name: "Baqah_Plans.pdf", kind: "file" }, { id: "d4", name: "Baqah_Poster.jpg", kind: "image" }], voiceSeconds: 8 },
  { id: "BC-2195", message: "October commission has been credited to your dealer wallet.", date: "10 Nov 2026 - 1:20 PM", from: "Huda Al-Mutairi", unread: true, documents: [{ id: "d2", name: "Commission_Oct.pdf", kind: "file" }] },
  { id: "BC-2170", message: "The app will be unavailable on Friday from 2:00 AM to 4:00 AM.", date: "3 Nov 2026 - 6:05 PM", from: "Huda Al-Mutairi", voiceSeconds: 5 },
];

// Whether the signed-in user may send broadcasts. Demo value: no permissions backend yet, so the
// "New Broadcast" actions show for everyone; set false to preview a receive-only user.
export const CAN_SEND_BROADCAST = true;

export const getSentBroadcasts = () => sent;
export const getReceivedBroadcasts = () => received;
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "17 Nov 2026 - 9:00 AM" → a Date, for the Broadcast date and time filter. */
export function broadcastDateTime(date: string): Date | null {
  const m = date.match(/^(\d{1,2}) (\w{3}) (\d{4}) - (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2]);
  let hour = Number(m[4]) % 12;
  if (m[6] === "PM") hour += 12;
  return new Date(Number(m[3]), month, Number(m[1]), hour, Number(m[5]));
}

export const formatVoice = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
