import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import AppHeader from "@/components/AppHeader";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  X,
  Inbox,
  Phone,
  User,
  CalendarDays,
  Eye,
  Trash2,
  Plus,
  AlertCircle,
  Check,
  History,
  Info,
  Clock,
  FileText,
  ArrowLeft,
} from "lucide-react";

// ---------- Local UI primitives (mirrors SimTermination.tsx / BillPayment.tsx) ----------
/** Small muted rounded-square icon chip used on request/task card meta rows. */
const IconChip = ({ icon: Icon }: { icon: typeof User }) => (
  <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
  </span>
);

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
  </div>
);

/** Read-only "form field" look used on the Pending/Rejected detail view — label above, boxed value below. */
const BoxField = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1.5">
    <label className="text-xs text-muted-foreground">{label}</label>
    <div className="h-12 rounded-xl border border-input bg-card px-3.5 flex items-center">
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  </div>
);

const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-foreground px-1">{title}</p>
    <div className="bg-card rounded-2xl p-4 shadow-sm">{children}</div>
  </div>
);

// ---------- Domain types ----------
type OnboardingStatus = "pending" | "activated" | "rejected" | "completed" | "resubmitted" | "in-completed";

// Granular workflow stages shown in the Status History timeline — distinct from the coarser
// OnboardingStatus used for list/detail badges, since a single "Activated" request still passed
// through several approval stages worth showing in its history.
type HistoryStage = "submitted" | "approval-pending-1" | "approval-pending-2" | "activation-pending" | "activated" | "rejected" | "resubmitted" | "in-completed";

interface HistoryEntry {
  date: string;
  time: string;
  actor: string;
  role: string;
  stage: HistoryStage;
  note?: string;
}

interface OnboardingRequest {
  id: string;
  channelName: string;
  channelType: string;
  memberCode: string;
  phone: string;
  date: string;
  /** Shown on My Tasks cards — who originally submitted the request. */
  requesterName?: string;
  status: OnboardingStatus;
  rejectedReason?: string;
  business: { type: string; orgTradingName: string; orgId: string; bankIbanProof: string; storeName: string };
  member: { fullName: string; civilId: string; memberTitle: string; mobileNumber: string; email: string; dealerIsAuthorizedRep: boolean };
  location: { region: string; city: string; district: string };
  documents: { category: string; files: { title: string }[] }[];
  history: HistoryEntry[];
}

const STATUS_STYLE: Record<OnboardingStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  activated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  resubmitted: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "in-completed": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const STAGE_STYLE: Record<HistoryStage, string> = {
  submitted: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "approval-pending-1": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "approval-pending-2": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "activation-pending": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  activated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  resubmitted: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "in-completed": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const STAGE_DOT_STYLE: Record<HistoryStage, string> = {
  submitted: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  "approval-pending-1": "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  "approval-pending-2": "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  "activation-pending": "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  activated: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  resubmitted: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  "in-completed": "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
};

// The action the responsible user actually took at that step — distinct from the stage badge,
// which names the resulting queue/state rather than the verb (e.g. reaching "Approval Pending 2"
// is the result of someone having chosen Approve on the "Approval Pending 1" step). Matches the
// exact verb used on the Approve/Reject/Resubmit buttons elsewhere on this page, not past tense.
type ActionKey = "submit" | "pending" | "approve" | "reject";

const ACTION_KEY: Record<HistoryStage, ActionKey> = {
  submitted: "submit",
  "approval-pending-1": "pending",
  "approval-pending-2": "approve",
  "activation-pending": "approve",
  activated: "approve",
  rejected: "reject",
  // Resubmitting is still a submission, from the requester's point of view — same action bucket
  // as the initial submit, just a later stage badge.
  resubmitted: "submit",
  "in-completed": "pending",
};

// Soft-tinted pill for the "Action Taken" line — lighter than the Stage badge above it so the
// two don't compete, but still color-coded for a quick glance (green=approve, red=reject, etc).
const ACTION_STYLE: Record<ActionKey, string> = {
  approve: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  reject: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  submit: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  pending: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
};

const CHANNEL_TYPES = ["Retailer", "Distributor", "Franchise"];

// Stretches the date-picker grid to the full width of its drawer instead of the default's
// intrinsic (centered) sizing — the day columns become flexible instead of fixed w-9 cells.
const FULL_WIDTH_CALENDAR_CLASSNAMES = {
  caption_label: "text-sm font-bold text-primary",
  months: "w-full",
  month: "w-full space-y-4",
  table: "w-full border-collapse space-y-1",
  head_row: "flex w-full",
  head_cell: "text-muted-foreground flex-1 text-center font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "flex-1 flex items-center justify-center h-9 text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
};

// Document categories are stored as stable English keys (used as demo-data identifiers and
// React list keys); DOC_CATEGORY_LABEL below maps them to a translated display string.
const makeDocuments = (): OnboardingRequest["documents"] => [
  { category: "Commercial Registration", files: [{ title: "CR_Certificate.pdf" }, { title: "CR_Photo.jpg" }] },
  { category: "VAT Certificate", files: [{ title: "VAT_Certificate.pdf" }, { title: "VAT_Photo.jpg" }] },
  { category: "Municipality License", files: [{ title: "Municipality_License.pdf" }, { title: "License_Photo.jpg" }] },
  { category: "Signed Dealer Contract", files: [{ title: "Dealer_Contract.pdf" }, { title: "Contract_Signature.jpg" }] },
  { category: "Shop Pictures", files: [{ title: "Shop_Front.jpg" }, { title: "Shop_Interior.jpg" }] },
];

// ---------- Demo data ----------
const INITIAL_REQUESTS: OnboardingRequest[] = [
  {
    id: "req-1", channelName: "Al Rajhi Retail", channelType: "Retailer", memberCode: "MC-10234", phone: "0501234567", date: "2 May 2025",
    status: "activated",
    business: { type: "Retailer", orgTradingName: "Al Rajhi Retail Est.", orgId: "7001234567", bankIbanProof: "SA0380000000608010167519", storeName: "Al Rajhi Mobile Store" },
    member: { fullName: "Abdullah Al Rajhi", civilId: "1029384756", memberTitle: "Store Owner", mobileNumber: "0501234567", email: "abdullah@alrajhiretail.sa", dealerIsAuthorizedRep: true },
    location: { region: "Riyadh Region", city: "Riyadh", district: "Al Olaya" },
    documents: makeDocuments(),
    history: [
      { date: "20 Apr 2025", time: "9:15 AM", actor: "Abdullah Al Rajhi", role: "Store Owner", stage: "submitted" },
      { date: "22 Apr 2025", time: "10:30 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
      { date: "24 Apr 2025", time: "11:00 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-2" },
      { date: "28 Apr 2025", time: "9:30 AM", actor: "John Doe", role: "Line Manager", stage: "activation-pending" },
      { date: "2 May 2025", time: "12:00 PM", actor: "John Doe", role: "Line Manager", stage: "activated" },
    ],
  },
  {
    id: "req-2", channelName: "Noor Mobile Store", channelType: "Distributor", memberCode: "MC-10298", phone: "0502345678", date: "12 May 2025",
    status: "pending",
    business: { type: "Distributor", orgTradingName: "Noor Mobile Trading Co.", orgId: "7009988776", bankIbanProof: "SA4420000001234567891234", storeName: "Noor Mobile Store" },
    member: { fullName: "Noura Al-Harbi", civilId: "2098765432", memberTitle: "General Manager", mobileNumber: "0502345678", email: "noura@noormobile.sa", dealerIsAuthorizedRep: true },
    location: { region: "Makkah Region", city: "Jeddah", district: "Al Rawdah" },
    documents: makeDocuments(),
    history: [
      { date: "10 May 2025", time: "3:45 PM", actor: "Noura Al-Harbi", role: "General Manager", stage: "submitted" },
      { date: "12 May 2025", time: "11:20 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
    ],
  },
  {
    id: "req-3", channelName: "Fahad Electronics", channelType: "Franchise", memberCode: "MC-10355", phone: "0503456789", date: "20 May 2025",
    status: "rejected",
    rejectedReason: "The submitted Commercial Registration certificate has expired. Please upload a valid, up-to-date certificate and resubmit.",
    business: { type: "Franchise", orgTradingName: "Fahad Electronics Franchise", orgId: "7003321456", bankIbanProof: "SA1155000000112233445566", storeName: "Fahad Electronics" },
    member: { fullName: "Fahad Al-Qahtani", civilId: "1055667788", memberTitle: "Franchise Owner", mobileNumber: "0503456789", email: "fahad@fahadelectronics.sa", dealerIsAuthorizedRep: true },
    location: { region: "Eastern Province", city: "Dammam", district: "Al Faisaliyah" },
    documents: makeDocuments(),
    history: [
      { date: "15 May 2025", time: "1:15 PM", actor: "Fahad Al-Qahtani", role: "Franchise Owner", stage: "submitted" },
      { date: "16 May 2025", time: "9:00 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
      { date: "18 May 2025", time: "10:05 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-2" },
      { date: "19 May 2025", time: "2:30 PM", actor: "John Doe", role: "Line Manager", stage: "activation-pending" },
      { date: "20 May 2025", time: "4:40 PM", actor: "John Doe", role: "Line Manager", stage: "rejected", note: "The submitted Commercial Registration certificate has expired. Please upload a valid, up-to-date certificate and resubmit." },
    ],
  },
];

const INITIAL_TASKS: OnboardingRequest[] = [
  {
    id: "task-1", channelName: "Sara Trading Co.", channelType: "Retailer", memberCode: "MC-20011", phone: "0511122233", date: "3 Jun 2025", requesterName: "Sara Al-Otaibi",
    status: "pending",
    business: { type: "Retailer", orgTradingName: "Sara Trading Co.", orgId: "7011223344", bankIbanProof: "SA2210000000998877665544", storeName: "Sara Trading Store" },
    member: { fullName: "Sara Al-Otaibi", civilId: "1876543210", memberTitle: "Store Owner", mobileNumber: "0511122233", email: "sara@saratrading.sa", dealerIsAuthorizedRep: true },
    location: { region: "Riyadh Region", city: "Riyadh", district: "Al Naseem" },
    documents: makeDocuments(),
    history: [
      { date: "1 Jun 2025", time: "9:00 AM", actor: "Sara Al-Otaibi", role: "Store Owner", stage: "submitted" },
      { date: "3 Jun 2025", time: "10:30 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
    ],
  },
  {
    id: "task-2", channelName: "Al Yamamah Mobiles", channelType: "Distributor", memberCode: "MC-20015", phone: "0522233344", date: "5 Jun 2025", requesterName: "Omar Al-Ghamdi",
    status: "pending",
    business: { type: "Distributor", orgTradingName: "Al Yamamah Mobiles Trading", orgId: "7022334455", bankIbanProof: "SA3300000001122334455667", storeName: "Al Yamamah Mobiles" },
    member: { fullName: "Omar Al-Ghamdi", civilId: "2345678901", memberTitle: "General Manager", mobileNumber: "0522233344", email: "omar@alyamamah.sa", dealerIsAuthorizedRep: false },
    location: { region: "Asir Region", city: "Abha", district: "Al Manhal" },
    documents: makeDocuments(),
    history: [
      { date: "4 Jun 2025", time: "2:20 PM", actor: "Omar Al-Ghamdi", role: "General Manager", stage: "submitted" },
      { date: "5 Jun 2025", time: "8:50 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
    ],
  },
  {
    id: "task-3", channelName: "Gulf Connect", channelType: "Franchise", memberCode: "MC-19980", phone: "0533344455", date: "28 May 2025", requesterName: "Layla Hassan",
    status: "completed",
    business: { type: "Franchise", orgTradingName: "Gulf Connect Franchise", orgId: "7033445566", bankIbanProof: "SA4400000002233445566778", storeName: "Gulf Connect" },
    member: { fullName: "Layla Hassan", civilId: "1122334455", memberTitle: "Franchise Owner", mobileNumber: "0533344455", email: "layla@gulfconnect.sa", dealerIsAuthorizedRep: true },
    location: { region: "Makkah Region", city: "Jeddah", district: "Al Salamah" },
    documents: makeDocuments(),
    history: [
      { date: "24 May 2025", time: "11:00 AM", actor: "Layla Hassan", role: "Franchise Owner", stage: "submitted" },
      { date: "25 May 2025", time: "10:00 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
      { date: "26 May 2025", time: "9:15 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-2" },
      { date: "27 May 2025", time: "3:40 PM", actor: "John Doe", role: "Line Manager", stage: "activation-pending" },
      { date: "28 May 2025", time: "3:00 PM", actor: "John Doe", role: "Line Manager", stage: "activated" },
    ],
  },
  {
    id: "task-4", channelName: "Madinah Cellular", channelType: "Retailer", memberCode: "MC-19965", phone: "0544455566", date: "25 May 2025", requesterName: "Khalid Al-Dossari",
    status: "rejected",
    rejectedReason: "Bank IBAN proof document does not match the registered organization name.",
    business: { type: "Retailer", orgTradingName: "Madinah Cellular Est.", orgId: "7044556677", bankIbanProof: "SA5500000003344556677889", storeName: "Madinah Cellular" },
    member: { fullName: "Khalid Al-Dossari", civilId: "2233445566", memberTitle: "Store Owner", mobileNumber: "0544455566", email: "khalid@madinahcellular.sa", dealerIsAuthorizedRep: true },
    location: { region: "Madinah Region", city: "Madinah", district: "Quba" },
    documents: makeDocuments(),
    history: [
      { date: "20 May 2025", time: "1:40 PM", actor: "Khalid Al-Dossari", role: "Store Owner", stage: "submitted" },
      { date: "21 May 2025", time: "9:00 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
      { date: "22 May 2025", time: "10:10 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-2" },
      { date: "24 May 2025", time: "2:15 PM", actor: "John Doe", role: "Line Manager", stage: "activation-pending" },
      { date: "25 May 2025", time: "5:25 PM", actor: "John Doe", role: "Line Manager", stage: "rejected", note: "Bank IBAN proof document does not match the registered organization name." },
    ],
  },
  {
    id: "task-5", channelName: "Jeddah Wireless Hub", channelType: "Distributor", memberCode: "MC-19940", phone: "0555566677", date: "22 May 2025", requesterName: "Huda Al-Qahtani",
    status: "in-completed",
    business: { type: "Distributor", orgTradingName: "Jeddah Wireless Hub Trading", orgId: "7055667788", bankIbanProof: "SA6600000004455667788990", storeName: "Jeddah Wireless Hub" },
    member: { fullName: "Huda Al-Qahtani", civilId: "1344556677", memberTitle: "General Manager", mobileNumber: "0555566677", email: "huda@jeddahwireless.sa", dealerIsAuthorizedRep: false },
    location: { region: "Makkah Region", city: "Jeddah", district: "Al Hamra" },
    documents: makeDocuments(),
    history: [
      { date: "19 May 2025", time: "4:05 PM", actor: "Huda Al-Qahtani", role: "General Manager", stage: "submitted" },
      { date: "20 May 2025", time: "10:00 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
      { date: "22 May 2025", time: "9:45 AM", actor: "John Doe", role: "Line Manager", stage: "in-completed", note: "Missing Shop Pictures — awaiting additional documents." },
    ],
  },
  {
    id: "task-6", channelName: "Riyadh Smart Store", channelType: "Retailer", memberCode: "MC-19920", phone: "0566677788", date: "18 May 2025", requesterName: "Tariq Al-Faisal",
    status: "resubmitted",
    business: { type: "Retailer", orgTradingName: "Riyadh Smart Store Est.", orgId: "7066778899", bankIbanProof: "SA7700000005566778899001", storeName: "Riyadh Smart Store" },
    member: { fullName: "Tariq Al-Faisal", civilId: "1455667788", memberTitle: "Store Owner", mobileNumber: "0566677788", email: "tariq@riyadhsmart.sa", dealerIsAuthorizedRep: true },
    location: { region: "Riyadh Region", city: "Riyadh", district: "Al Malaz" },
    documents: makeDocuments(),
    history: [
      { date: "10 May 2025", time: "8:30 AM", actor: "Tariq Al-Faisal", role: "Store Owner", stage: "submitted" },
      { date: "12 May 2025", time: "10:00 AM", actor: "John Doe", role: "Line Manager", stage: "approval-pending-1" },
      { date: "13 May 2025", time: "2:00 PM", actor: "John Doe", role: "Line Manager", stage: "rejected", note: "VAT Certificate image was unreadable." },
      { date: "18 May 2025", time: "11:35 AM", actor: "Tariq Al-Faisal", role: "Store Owner", stage: "resubmitted" },
    ],
  },
];

type StatusFilter = "all" | "rejected" | "pending" | "active";

const OnboardingRequests = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STATUS_LABEL: Record<OnboardingStatus, string> = {
    pending: t("onboardingRequests.status_pending"),
    activated: t("onboardingRequests.status_activated"),
    rejected: t("onboardingRequests.status_rejected"),
    completed: t("onboardingRequests.status_completed"),
    resubmitted: t("onboardingRequests.status_resubmitted"),
    "in-completed": t("onboardingRequests.status_inCompleted"),
  };

  const STAGE_LABEL: Record<HistoryStage, string> = {
    submitted: t("onboardingRequests.stage_submitted"),
    "approval-pending-1": t("onboardingRequests.stage_approvalPending1"),
    "approval-pending-2": t("onboardingRequests.stage_approvalPending2"),
    "activation-pending": t("onboardingRequests.stage_activationPending"),
    activated: t("onboardingRequests.status_activated"),
    rejected: t("onboardingRequests.status_rejected"),
    resubmitted: t("onboardingRequests.status_resubmitted"),
    "in-completed": t("onboardingRequests.status_inCompleted"),
  };

  const ACTION_LABEL: Record<ActionKey, string> = {
    submit: t("onboardingRequests.action_submit"),
    pending: t("onboardingRequests.action_pending"),
    approve: t("onboardingRequests.action_approve"),
    reject: t("onboardingRequests.action_reject"),
  };

  const DOC_CATEGORY_LABEL: Record<string, string> = {
    "Commercial Registration": t("onboardingRequests.docCategories.commercialRegistration"),
    "VAT Certificate": t("onboardingRequests.docCategories.vatCertificate"),
    "Municipality License": t("onboardingRequests.docCategories.municipalityLicense"),
    "Signed Dealer Contract": t("onboardingRequests.docCategories.signedDealerContract"),
    "Shop Pictures": t("onboardingRequests.docCategories.shopPictures"),
  };

  const REJECT_REASONS = [
    t("onboardingRequests.reason_missingDocs"),
    t("onboardingRequests.reason_invalidInfo"),
    t("onboardingRequests.reason_duplicateRequest"),
    t("onboardingRequests.reason_other"),
  ];

  const [requests, setRequests] = useState<OnboardingRequest[]>(INITIAL_REQUESTS);
  const [tasks, setTasks] = useState<OnboardingRequest[]>(INITIAL_TASKS);
  const [tab, setTab] = useState<"requests" | "tasks">("requests");
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeId, setActiveId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  // Applied filters (drive the list) vs draft filters (edited inside the sheets until Applied)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelTypeFilter, setChannelTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftChannelType, setDraftChannelType] = useState<string>("all");
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>();

  const [dateOpen, setDateOpen] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectRemark, setRejectRemark] = useState("");

  const currentList = tab === "requests" ? requests : tasks;
  const setCurrentList = tab === "requests" ? setRequests : setTasks;

  const matchesStatus = (item: OnboardingRequest) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "rejected") return item.status === "rejected";
    if (statusFilter === "pending") return item.status === "pending" || item.status === "resubmitted";
    return item.status === "activated" || item.status === "completed";
  };

  const filtered = currentList.filter((item) => {
    const matchesSearch = !search.trim() || item.channelName.toLowerCase().includes(search.trim().toLowerCase());
    const matchesType = channelTypeFilter === "all" || item.channelType === channelTypeFilter;
    return matchesSearch && matchesStatus(item) && matchesType;
  });

  const activeItem = currentList.find((r) => r.id === activeId) ?? null;
  const isMyRequest = tab === "requests";

  const hasActiveFilter = statusFilter !== "all" || channelTypeFilter !== "all" || !!dateRange?.from;
  const activeFilterLabel =
    statusFilter !== "all"
      ? statusFilter === "active" ? t("onboardingRequests.filterActive") : statusFilter === "rejected" ? STATUS_LABEL.rejected : STATUS_LABEL.pending
      : channelTypeFilter !== "all"
      ? channelTypeFilter
      : dateRange?.from
      ? t("onboardingRequests.customDate")
      : null;

  const clearActiveFilter = () => {
    setStatusFilter("all");
    setChannelTypeFilter("all");
    setDateRange(undefined);
  };

  const openFilter = () => {
    setDraftStatus(statusFilter);
    setDraftChannelType(channelTypeFilter);
    setDraftDateRange(dateRange);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setStatusFilter(draftStatus);
    setChannelTypeFilter(draftChannelType);
    setDateRange(draftDateRange);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setDraftStatus("all");
    setDraftChannelType("all");
    setDraftDateRange(undefined);
  };

  const openDetail = (item: OnboardingRequest) => {
    setActiveId(item.id);
    setView("detail");
  };

  const appendHistory = (item: OnboardingRequest, entry: HistoryEntry): OnboardingRequest => ({
    ...item,
    history: [...item.history, entry],
  });

  const updateActive = (updater: (item: OnboardingRequest) => OnboardingRequest) => {
    if (!activeItem) return;
    setCurrentList((prev) => prev.map((r) => (r.id === activeItem.id ? updater(r) : r)));
  };

  const confirmApprove = () => {
    updateActive((item) =>
      appendHistory({ ...item, status: isMyRequest ? "activated" : "completed" }, {
        date: "Today", time: "Now", actor: "John Doe", role: "Line Manager", stage: "activated",
      }),
    );
    setApproveOpen(false);
    setView("list");
  };

  const confirmReject = () => {
    if (!rejectReason) return;
    updateActive((item) =>
      appendHistory({ ...item, status: "rejected", rejectedReason: rejectRemark || rejectReason }, {
        date: "Today", time: "Now", actor: "John Doe", role: "Line Manager", stage: "rejected", note: rejectRemark || rejectReason,
      }),
    );
    setRejectOpen(false);
    setRejectReason("");
    setRejectRemark("");
    setView("list");
  };

  const confirmResubmit = () => {
    updateActive((item) =>
      appendHistory({ ...item, status: "pending", rejectedReason: undefined }, {
        date: "Today", time: "Now", actor: item.member.fullName, role: item.member.memberTitle, stage: "resubmitted",
      }),
    );
    setResubmitOpen(false);
    setView("list");
  };

  const handleBack = () => {
    if (view === "detail") {
      setView("list");
      return;
    }
    navigate(-1);
  };

  // ---------- Detail view render ----------
  const renderDetail = () => {
    if (!activeItem) return null;
    // A resubmitted item is back in the review queue exactly like a fresh "pending" one — the
    // reviewer still needs to Approve/Reject it, and the submitter still just sees it awaiting review.
    const isActionable = activeItem.status === "pending" || activeItem.status === "resubmitted";
    const readOnly = !isActionable && !(isMyRequest && activeItem.status === "rejected");
    const showApproveReject = !isMyRequest && isActionable;
    const showResubmit = isMyRequest && activeItem.status === "rejected";

    return (
      <div className={cn("px-4 space-y-4", showApproveReject ? "pb-40" : showResubmit ? "pb-28" : "pb-6")}>
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="w-full bg-card rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm"
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">{t("onboardingRequests.status")}</span>
          </span>
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", STATUS_STYLE[activeItem.status])}>
            {STATUS_LABEL[activeItem.status]}
          </span>
        </button>

        {activeItem.rejectedReason && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive">{t("onboardingRequests.rejectedReason")}</p>
              <p className="text-[13px] text-destructive/90 leading-snug mt-0.5">{activeItem.rejectedReason}</p>
            </div>
          </div>
        )}

        {readOnly ? (
          <>
            <InfoSection title={t("onboardingRequests.businessInformation")}>
              <SummaryRow label={t("onboardingRequests.type")} value={activeItem.business.type} />
              <SummaryRow label={t("onboardingRequests.orgTradingName")} value={activeItem.business.orgTradingName} />
              <SummaryRow label={t("onboardingRequests.orgId")} value={activeItem.business.orgId} />
              <SummaryRow label={t("onboardingRequests.bankIbanProof")} value={activeItem.business.bankIbanProof} />
              <SummaryRow label={t("onboardingRequests.storeName")} value={activeItem.business.storeName} />
            </InfoSection>
            <InfoSection title={t("onboardingRequests.memberInformation")}>
              <SummaryRow label={t("onboardingRequests.fullName")} value={activeItem.member.fullName} />
              <SummaryRow label={t("onboardingRequests.idLabel")} value={activeItem.member.civilId} />
              <SummaryRow label={t("onboardingRequests.memberTitle")} value={activeItem.member.memberTitle} />
              <SummaryRow label={t("onboardingRequests.mobileNumber")} value={activeItem.member.mobileNumber} />
              <SummaryRow label={t("onboardingRequests.email")} value={activeItem.member.email} />
            </InfoSection>
            <InfoSection title={t("onboardingRequests.locationInformation")}>
              <SummaryRow label={t("onboardingRequests.region")} value={activeItem.location.region} />
              <SummaryRow label={t("onboardingRequests.city")} value={activeItem.location.city} />
              <SummaryRow label={t("onboardingRequests.district")} value={activeItem.location.district} />
            </InfoSection>
          </>
        ) : (
          <>
            <InfoSection title={t("onboardingRequests.businessInformation")}>
              <div className="space-y-3">
                <BoxField label={t("onboardingRequests.orgTradingName")} value={activeItem.business.orgTradingName} />
                <BoxField label={t("onboardingRequests.orgId")} value={activeItem.business.orgId} />
                <BoxField label={t("onboardingRequests.bankIbanProof")} value={activeItem.business.bankIbanProof} />
                <BoxField label={t("onboardingRequests.storeName")} value={activeItem.business.storeName} />
              </div>
            </InfoSection>
            <InfoSection title={t("onboardingRequests.memberInformation")}>
              <div className="space-y-3">
                <BoxField label={t("onboardingRequests.fullName")} value={activeItem.member.fullName} />
                <BoxField label={t("onboardingRequests.civilId")} value={activeItem.member.civilId} />
                <BoxField label={t("onboardingRequests.memberTitle")} value={activeItem.member.memberTitle} />
                <BoxField label={t("onboardingRequests.mobileNumber")} value={activeItem.member.mobileNumber} />
                <BoxField label={t("onboardingRequests.email")} value={activeItem.member.email} />
                <div className="flex items-center gap-2 pt-1">
                  <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0", activeItem.member.dealerIsAuthorizedRep ? "bg-primary border-primary" : "border-destructive")}>
                    {activeItem.member.dealerIsAuthorizedRep && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="text-xs text-foreground">{t("onboardingRequests.dealerAuthorizedRep")}</span>
                </div>
              </div>
            </InfoSection>
            <InfoSection title={t("onboardingRequests.locationInformation")}>
              <div className="space-y-3">
                <BoxField label={t("onboardingRequests.region")} value={activeItem.location.region} />
                <BoxField label={t("onboardingRequests.city")} value={activeItem.location.city} />
                <BoxField label={t("onboardingRequests.district")} value={activeItem.location.district} />
              </div>
            </InfoSection>
          </>
        )}

        {activeItem.documents.map((doc) => (
          <div key={doc.category} className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-foreground">{DOC_CATEGORY_LABEL[doc.category] ?? doc.category}</p>
              {!readOnly && (
                <button type="button" className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Plus className="w-3.5 h-3.5" /> {t("onboardingRequests.addFile")}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {doc.files.map((file) => (
                <div key={file.title} className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-card px-3.5 py-3">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground flex-1 truncate">{file.title}</span>
                  {readOnly ? (
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </span>
                  ) : (
                    <>
                      <button type="button" aria-label={t("channelOnboarding.viewFileAria", { title: file.title })} className="text-primary shrink-0">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" aria-label={t("channelOnboarding.removeFileAria", { title: file.title })} className="text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {(showApproveReject || showResubmit) && (
          <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
            <div className="max-w-[390px] mx-auto flex flex-col gap-2">
              {showApproveReject && (
                <>
                  <Button className="w-full h-12 rounded-full font-semibold" onClick={() => setApproveOpen(true)}>{t("onboardingRequests.approve")}</Button>
                  <Button variant="outline" className="w-full h-12 rounded-full font-semibold border-destructive text-destructive hover:text-destructive" onClick={() => setRejectOpen(true)}>{t("onboardingRequests.reject")}</Button>
                </>
              )}
              {showResubmit && (
                <Button className="w-full h-12 rounded-full font-semibold" onClick={() => setResubmitOpen(true)}>{t("onboardingRequests.resubmit")}</Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ---------- List view render ----------
  const renderList = () => (
    <div className="px-4 space-y-4">
      <div className="flex border-b border-border">
        {(["requests", "tasks"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => { setTab(v); setSearch(""); }}
            className={cn(
              "flex-1 text-center pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
              tab === v ? "text-primary border-primary" : "text-muted-foreground border-transparent",
            )}
          >
            {v === "requests" ? t("onboardingRequests.myRequests") : t("onboardingRequests.myTasks")}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("onboardingRequests.search")} className="ps-10 h-11 rounded-xl bg-card border-border" />
        </div>
        <button type="button" onClick={openFilter} aria-label={t("onboardingRequests.filterAria")} className="w-11 h-11 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
        </button>
      </div>

      {hasActiveFilter && activeFilterLabel && (
        <div className="flex">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary text-primary text-xs font-semibold">
            {activeFilterLabel}
            <button type="button" onClick={clearActiveFilter} aria-label={t("onboardingRequests.clearFilterAria")}>
              <X className="w-3 h-3" />
            </button>
          </span>
        </div>
      )}

      {currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <Inbox className="w-14 h-14 text-primary mb-4" strokeWidth={1.5} />
          <p className="font-semibold text-foreground">{tab === "requests" ? t("onboardingRequests.noRequestsYetTitle") : t("onboardingRequests.noTasksYetTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1">{tab === "requests" ? t("onboardingRequests.noRequestsFound") : t("onboardingRequests.noTasksFound")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">{t("onboardingRequests.noResultsFound")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-muted-foreground px-1">{t("onboardingRequests.total", { count: filtered.length })}</p>
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => openDetail(item)}
              className="bg-card rounded-xl p-3.5 shadow-sm border-l-2 border-l-primary cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-foreground">{item.channelName}</p>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[item.status])}>
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                <IconChip icon={User} /> {item.channelType} | {item.memberCode}
              </div>
              {!isMyRequest && item.requesterName && (
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                  <IconChip icon={User} /> {t("onboardingRequests.requester", { name: item.requesterName })}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                <IconChip icon={Phone} /> {item.phone}
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                <IconChip icon={CalendarDays} /> {item.date}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mobile-container min-h-screen bg-background pb-6">
      <AppHeader title={view === "detail" ? t("onboardingRequests.viewRequestTitle") : t("onboardingRequests.pageTitle")} showBack onBackClick={handleBack} />

      {view === "detail" ? renderDetail() : renderList()}

      {/* Filter drawer */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{t("onboardingRequests.filterTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("onboardingRequests.filterSubtitle")}</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>

          <div className="space-y-4 pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("onboardingRequests.requestStatus")}</p>
              <div className="flex flex-wrap gap-2">
                {([["all", t("onboardingRequests.filterAll")], ["rejected", STATUS_LABEL.rejected], ["pending", STATUS_LABEL.pending], ["active", t("onboardingRequests.filterActive")]] as [StatusFilter, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraftStatus(value)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-xs font-semibold transition-colors",
                      draftStatus === value ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    {value !== "all" && "+ "}{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("onboardingRequests.channelType")}</p>
              <div className="flex flex-wrap gap-2">
                {["all", ...CHANNEL_TYPES].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraftChannelType(value)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-xs font-semibold transition-colors",
                      draftChannelType === value ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    )}
                  >
                    {value !== "all" && "+ "}{value === "all" ? t("onboardingRequests.filterAll") : value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-2">{t("onboardingRequests.dateDuration")}</p>
              <button
                type="button"
                onClick={() => { setFilterOpen(false); setDateOpen(true); }}
                className="w-full h-12 rounded-xl border border-input bg-card px-3 flex items-center justify-between text-sm text-start"
              >
                <span className={draftDateRange?.from ? "text-foreground" : "text-muted-foreground"}>
                  {draftDateRange?.from
                    ? draftDateRange.to
                      ? `${format(draftDateRange.from, "d MMM yyyy")} - ${format(draftDateRange.to, "d MMM yyyy")}`
                      : format(draftDateRange.from, "d MMM yyyy")
                    : t("onboardingRequests.selectDate")}
                </span>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <Button className="w-full h-12 rounded-full font-semibold" onClick={applyFilter}>{t("channelOnboarding.apply")}</Button>
          <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={clearFilter}>{t("onboardingRequests.clearFilter")}</button>
        </DrawerContent>
      </Drawer>

      {/* Date range drawer */}
      <Drawer open={dateOpen} onOpenChange={(o) => { setDateOpen(o); if (!o) setFilterOpen(true); }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-1">
            <div className="flex-1 text-center">
              <h3 className="text-lg font-bold text-foreground">{t("channelOnboarding.pickADate")}</h3>
              <p className="text-xs text-muted-foreground">{t("channelOnboarding.pleaseSelectDate")}</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center absolute end-5 top-4">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>

          <Calendar
            mode="range"
            selected={draftDateRange}
            onSelect={setDraftDateRange}
            defaultMonth={draftDateRange?.from}
            numberOfMonths={1}
            className="w-full p-0"
            classNames={FULL_WIDTH_CALENDAR_CLASSNAMES}
          />

          <div className="rounded-xl bg-muted/40 divide-y divide-border mb-4 mt-2">
            <div className="px-3 py-2.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("onboardingRequests.dateFrom")}</span>
              <span className="font-semibold text-foreground">{draftDateRange?.from ? format(draftDateRange.from, "d MMM yyyy") : "—"}</span>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("onboardingRequests.dateTo")}</span>
              <span className="font-semibold text-foreground">{draftDateRange?.to ? format(draftDateRange.to, "d MMM yyyy") : "—"}</span>
            </div>
          </div>

          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setDateOpen(false); setFilterOpen(true); }}>{t("channelOnboarding.apply")}</Button>
          <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setDraftDateRange(undefined)}>{t("onboardingRequests.clearFilter")}</button>
        </DrawerContent>
      </Drawer>

      {/* Reject confirm */}
      <Drawer open={rejectOpen} onOpenChange={setRejectOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("onboardingRequests.confirmationMessage")}</h3>
              <p className="text-sm text-muted-foreground">{t("onboardingRequests.confirmRejectQuestion")}</p>
            </div>
            <div className="w-full space-y-3 text-start">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("onboardingRequests.rejectReasonLabel")}</label>
                <Select value={rejectReason} onValueChange={setRejectReason}>
                  <SelectTrigger className="w-full bg-card rounded-xl h-12"><SelectValue placeholder={t("onboardingRequests.selectTheReason")} /></SelectTrigger>
                  <SelectContent className="bg-card">
                    {REJECT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t("onboardingRequests.rejectRemarkLabel")}</label>
                <Textarea value={rejectRemark} onChange={(e) => setRejectRemark(e.target.value)} placeholder={t("onboardingRequests.writeHerePlaceholder")} className="bg-card rounded-xl resize-none" rows={3} />
              </div>
            </div>
            <div className="w-full flex flex-col gap-3 mt-1">
              <Button className="w-full h-12 rounded-full font-semibold" disabled={!rejectReason} onClick={confirmReject}>{t("onboardingRequests.yes")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setRejectOpen(false)}>{t("onboardingRequests.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Approve confirm */}
      <Drawer open={approveOpen} onOpenChange={setApproveOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("onboardingRequests.confirmationMessage")}</h3>
              <p className="text-sm text-muted-foreground">{t("onboardingRequests.confirmApproveQuestion")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={confirmApprove}>{t("onboardingRequests.yes")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setApproveOpen(false)}>{t("onboardingRequests.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Resubmit confirm */}
      <Drawer open={resubmitOpen} onOpenChange={setResubmitOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("onboardingRequests.confirmationMessage")}</h3>
              <p className="text-sm text-muted-foreground">{t("onboardingRequests.confirmResubmitQuestion")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={confirmResubmit}>{t("onboardingRequests.yes")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setResubmitOpen(false)}>{t("onboardingRequests.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Status History */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2 max-h-[85vh] flex flex-col">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-4">
            <button type="button" onClick={() => setHistoryOpen(false)} aria-label={t("onboardingRequests.backAria")} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="text-center flex-1">
              <h3 className="text-lg font-bold text-foreground">{t("onboardingRequests.statusHistory")}</h3>
              <p className="text-xs text-muted-foreground">{t("onboardingRequests.historySubtitle")}</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>
          <div className="overflow-y-auto space-y-0">
            {activeItem?.history.slice().reverse().map((h, i) => {
              const StageIcon = h.stage === "rejected" ? X : h.stage === "activated" ? Check : Info;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", STAGE_DOT_STYLE[h.stage])}>
                      <StageIcon className="w-3.5 h-3.5" />
                    </div>
                    {i < (activeItem?.history.length ?? 0) - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-xs text-muted-foreground mb-1.5">{h.date} • {h.time}</p>
                    <div className="bg-muted/50 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{h.actor}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STAGE_STYLE[h.stage])}>{STAGE_LABEL[h.stage]}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{h.role}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{t("onboardingRequests.actionTaken")}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", ACTION_STYLE[ACTION_KEY[h.stage]])}>
                          {ACTION_LABEL[ACTION_KEY[h.stage]]}
                        </span>
                      </div>
                      {h.stage === "rejected" && h.note && (
                        <div className="mt-2 rounded-lg bg-destructive/10 px-2.5 py-2">
                          <p className="text-[10px] font-semibold text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {t("onboardingRequests.rejectedReason")}
                          </p>
                          <p className="text-[11px] text-destructive/90 leading-snug mt-0.5">{h.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default OnboardingRequests;
