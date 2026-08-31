import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DateRange } from "react-day-picker";
import AppHeader from "@/components/AppHeader";
import RiyalSymbol from "@/components/RiyalSymbol";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Search,
  SlidersHorizontal,
  X as XIcon,
  ChevronRight,
  User,
  Phone,
  Calendar as CalendarIcon,
  Eye,
  ArrowUpRight,
  Clock,
  Wallet,
  Package,
  CheckCircle2,
  ClipboardList,
  Info,
  Users,
} from "lucide-react";

// ---------- Local UI primitives (mirrors every other flow's page-local helpers) ----------
const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
  </div>
);

const CardSection = ({
  title,
  icon: Icon,
  right,
  children,
}: {
  title: string;
  icon: typeof ClipboardList;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="bg-card rounded-2xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {right}
    </div>
    {children}
  </section>
);

// ---------- Demo data ----------
// Exported (not just page-local) so the "See all" sub-pages below can reuse the same
// records instead of duplicating them — this file stays the single source of truth.
export type OrderStatus = "approved" | "pending" | "rejected";
export type OrderType = "prepaid" | "postpaid" | "hbb" | "simReplacement" | "topUp" | "billPayment";

const ORDER_TYPES: OrderType[] = ["prepaid", "postpaid", "hbb", "simReplacement", "topUp", "billPayment"];

export interface DemoOrder {
  id: string;
  status: OrderStatus;
  commissionStatus: OrderStatus;
  type: OrderType;
  customer: string;
  memberCode: string;
  member: string;
  phone: string;
  idType: string;
  date: string;
  dateObj: Date;
  commission: number;
  rejectedReason?: string;
}

// "Today" reference — the demo dates are fixed relative to this, not the real device clock,
// so the Today/Last 7/Last 30 buckets below stay meaningful regardless of when this runs.
const TODAY_REF = new Date(2026, 7, 31);

export const ORDERS: DemoOrder[] = [
  { id: "ORD-2026-000046", status: "approved", commissionStatus: "approved", type: "prepaid", customer: "Sara Ahmad", memberCode: "DST001", member: "Sara Ahmad", phone: "0501047231", idType: "National ID", date: "31 Aug 2026 - 10:15 AM", dateObj: new Date(2026, 7, 31), commission: 14.0 },
  { id: "ORD-2026-000045", status: "pending", commissionStatus: "pending", type: "billPayment", customer: "Faisal Al-Otaibi", memberCode: "DST002", member: "Faisal Al-Otaibi", phone: "0559812345", idType: "National ID", date: "29 Aug 2026 - 4:40 PM", dateObj: new Date(2026, 7, 29), commission: 6.5 },
  { id: "ORD-2026-000044", status: "approved", commissionStatus: "approved", type: "postpaid", customer: "Noura Al-Harbi", memberCode: "DST001", member: "Sara Ahmad", phone: "0501234567", idType: "Iqama ID", date: "26 Aug 2026 - 9:05 AM", dateObj: new Date(2026, 7, 26), commission: 22.0 },
  { id: "ORD-2026-000043", status: "rejected", commissionStatus: "rejected", type: "simReplacement", customer: "Khalid Al-Dosari", memberCode: "DST003", member: "Noura Al-Harbi", phone: "0533456789", idType: "National ID", date: "18 Aug 2026 - 2:20 PM", dateObj: new Date(2026, 7, 18), commission: 0, rejectedReason: "The submitted ID document did not match the customer's registered details." },
  { id: "ORD-2026-000042", status: "approved", commissionStatus: "approved", type: "hbb", customer: "Mona Al-Qahtani", memberCode: "DST002", member: "Faisal Al-Otaibi", phone: "0567891234", idType: "National ID", date: "10 Aug 2026 - 11:50 AM", dateObj: new Date(2026, 7, 10), commission: 18.0 },
  { id: "ORD-2026-000041", status: "approved", commissionStatus: "approved", type: "topUp", customer: "Abdullah Al-Zahrani", memberCode: "DST001", member: "Sara Ahmad", phone: "0512345678", idType: "Iqama ID", date: "2 Aug 2026 - 5:30 PM", dateObj: new Date(2026, 7, 2), commission: 3.25 },
];

interface Dealer {
  name: string;
  code: string;
  commission: number;
  orders: number;
}

// The demo dealer "logged in" for Member View — Member View scopes Orders/Commission down
// to just this dealer's own records and hides the cross-dealer leaderboard/search.
export const SELF_MEMBER_CODE = "DST001";

const DEALERS: Dealer[] = [
  { name: "Sara Ahmad", code: "DST001", commission: 145.0, orders: 30 },
  { name: "Faisal Al-Otaibi", code: "DST002", commission: 132.5, orders: 27 },
  { name: "Noura Al-Harbi", code: "DST003", commission: 98.0, orders: 22 },
  { name: "Khalid Al-Dosari", code: "DST004", commission: 76.25, orders: 18 },
  { name: "Mona Al-Qahtani", code: "DST005", commission: 54.0, orders: 14 },
  { name: "Abdullah Al-Zahrani", code: "DST006", commission: 12.0, orders: 4 },
];

// Only the first 3 show inline on the Commission tab card — the full list lives on the
// dedicated "See all" page.
export const TEAM_ACHIEVEMENTS = [
  { key: "prepaidActivations", achievement: 27, target: 30 },
  { key: "postpaidActivations", achievement: 18, target: 20 },
  { key: "billPaymentVolume", achievement: 9, target: 10 },
  { key: "hbbConnections", achievement: 12, target: 15 },
  { key: "simReplacements", achievement: 22, target: 25 },
];

type DateRangeKey = "today" | "last7" | "last30" | "custom" | null;

const inRange = (d: Date, from: Date, to: Date) => {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return day >= new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
    && day <= new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
};

const daysAgo = (n: number) => {
  const d = new Date(TODAY_REF);
  d.setDate(d.getDate() - n);
  return d;
};

const fmtShort = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const OrdersHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Set by Home's Member/Parent View picker (?view=member|parent) — Member View scopes
  // everything below to SELF_MEMBER_CODE's own records; Parent View (the default) keeps
  // the full cross-dealer picture.
  const view = searchParams.get("view") === "member" ? "member" : "parent";
  const baseOrders = useMemo(() => (view === "member" ? ORDERS.filter((o) => o.memberCode === SELF_MEMBER_CODE) : ORDERS), [view]);

  const [tab, setTab] = useState<"orders" | "summary" | "commission">("orders");

  // ---------- Orders tab ----------
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<DemoOrder | null>(null);
  const [breakdownOrder, setBreakdownOrder] = useState<DemoOrder | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftTypes, setDraftTypes] = useState<OrderType[]>([]);
  const [draftStatus, setDraftStatus] = useState<OrderStatus | null>(null);
  const [draftCommissionStatus, setDraftCommissionStatus] = useState<OrderStatus | null>(null);
  const [draftDateKey, setDraftDateKey] = useState<DateRangeKey>(null);
  // Parent-view only — a member has no one else's orders to search by member name/code.
  const [draftMemberQuery, setDraftMemberQuery] = useState("");

  const [appliedTypes, setAppliedTypes] = useState<OrderType[]>([]);
  const [appliedStatus, setAppliedStatus] = useState<OrderStatus | null>(null);
  const [appliedCommissionStatus, setAppliedCommissionStatus] = useState<OrderStatus | null>(null);
  const [appliedRange, setAppliedRange] = useState<{ from: Date; to: Date; label: string } | null>(null);
  const [appliedMemberQuery, setAppliedMemberQuery] = useState("");

  const [pickDateOpen, setPickDateOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(undefined);

  const activeFilterCount =
    (appliedTypes.length > 0 ? 1 : 0) + (appliedStatus ? 1 : 0) + (appliedCommissionStatus ? 1 : 0) + (appliedRange ? 1 : 0) + (appliedMemberQuery.trim() ? 1 : 0);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    const mq = appliedMemberQuery.trim().toLowerCase();
    return baseOrders.filter((o) => {
      if (q && !(o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.phone.includes(q))) return false;
      if (mq && !(o.member.toLowerCase().includes(mq) || o.memberCode.toLowerCase().includes(mq))) return false;
      if (appliedTypes.length > 0 && !appliedTypes.includes(o.type)) return false;
      if (appliedStatus && o.status !== appliedStatus) return false;
      if (appliedCommissionStatus && o.commissionStatus !== appliedCommissionStatus) return false;
      if (appliedRange && !inRange(o.dateObj, appliedRange.from, appliedRange.to)) return false;
      return true;
    });
  }, [baseOrders, orderSearch, appliedMemberQuery, appliedTypes, appliedStatus, appliedCommissionStatus, appliedRange]);

  const openFilter = () => {
    setDraftTypes(appliedTypes);
    setDraftStatus(appliedStatus);
    setDraftCommissionStatus(appliedCommissionStatus);
    setDraftDateKey(appliedRange ? "custom" : null);
    setDraftMemberQuery(appliedMemberQuery);
    setFilterOpen(true);
  };

  const toggleDraftType = (type: OrderType) => {
    setDraftTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  };

  const applyFilter = () => {
    setAppliedTypes(draftTypes);
    setAppliedStatus(draftStatus);
    setAppliedCommissionStatus(draftCommissionStatus);
    setAppliedMemberQuery(view === "parent" ? draftMemberQuery : "");
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setDraftTypes([]);
    setDraftStatus(null);
    setDraftCommissionStatus(null);
    setDraftDateKey(null);
    setDraftMemberQuery("");
    setAppliedTypes([]);
    setAppliedStatus(null);
    setAppliedCommissionStatus(null);
    setAppliedRange(null);
    setAppliedMemberQuery("");
    setFilterOpen(false);
  };

  const pickQuickRange = (key: "today" | "last7" | "last30") => {
    setDraftDateKey(key);
    const to = TODAY_REF;
    const from = key === "today" ? TODAY_REF : daysAgo(key === "last7" ? 6 : 29);
    setAppliedRange({ from, to, label: `${fmtShort(from)} - ${fmtShort(to)}` });
  };

  // Pick-a-Date drawer is shared between the Orders filter and the Summary/Commission
  // scope chips — `pickDateTarget` says which one Apply should write back to.
  const [pickDateTarget, setPickDateTarget] = useState<"orders" | "scope">("orders");

  const openPickDate = () => {
    setDraftRange(appliedRange ? { from: appliedRange.from, to: appliedRange.to } : undefined);
    setPickDateTarget("orders");
    setFilterOpen(false);
    setPickDateOpen(true);
  };

  const applyPickDate = () => {
    if (draftRange?.from) {
      const to = draftRange.to ?? draftRange.from;
      if (pickDateTarget === "orders") {
        setAppliedRange({ from: draftRange.from, to, label: `${fmtShort(draftRange.from)} - ${fmtShort(to)}` });
        setDraftDateKey("custom");
      } else {
        setScopeCustomRange({ from: draftRange.from, to });
        setScopeRangeKey("custom");
      }
    }
    setPickDateOpen(false);
  };

  const removeDateFilter = () => {
    setAppliedRange(null);
    setDraftDateKey(null);
  };

  // Dealer picker — shared by the Summary and Commission tabs' "Search by member" fields
  // (Parent View only; declared up here so scopedOrders below can filter by it).
  const [dealerSearch, setDealerSearch] = useState("");
  const [searchDealersOpen, setSearchDealersOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

  // ---------- Shared date-range chips (Summary + Commission tabs) ----------
  const [scopeRangeKey, setScopeRangeKey] = useState<"today" | "last7" | "last30" | "custom">("last30");
  const [scopeCustomRange, setScopeCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const scopeRange = useMemo(() => {
    if (scopeRangeKey === "custom") return scopeCustomRange ?? { from: TODAY_REF, to: TODAY_REF };
    const to = TODAY_REF;
    const from = scopeRangeKey === "today" ? TODAY_REF : daysAgo(scopeRangeKey === "last7" ? 6 : 29);
    return { from, to };
  }, [scopeRangeKey, scopeCustomRange]);
  const scopedOrders = useMemo(
    () => baseOrders.filter((o) => inRange(o.dateObj, scopeRange.from, scopeRange.to) && (!selectedDealer || o.memberCode === selectedDealer.code)),
    [baseOrders, scopeRange, selectedDealer],
  );

  const openScopePickDate = () => {
    setDraftRange(scopeCustomRange ?? undefined);
    setPickDateTarget("scope");
    setPickDateOpen(true);
  };

  // ---------- Summary tab ----------
  const summary = useMemo(() => {
    const completed = scopedOrders.filter((o) => o.status === "approved").length;
    const pending = scopedOrders.filter((o) => o.status === "pending").length;
    const rejected = scopedOrders.filter((o) => o.status === "rejected").length;
    const commission = scopedOrders.reduce((sum, o) => sum + o.commission, 0);
    const byType = ORDER_TYPES.map((type) => ({
      type,
      count: scopedOrders.filter((o) => o.type === type).length,
      commission: scopedOrders.filter((o) => o.type === type).reduce((sum, o) => sum + o.commission, 0),
    }));
    return { total: scopedOrders.length, completed, pending, rejected, commission, byType };
  }, [scopedOrders]);

  const pieData = [
    { key: "approved", value: summary.completed, color: "#22C55E" },
    { key: "pending", value: summary.pending, color: "#F59E0B" },
    { key: "rejected", value: summary.rejected, color: "#EF4444" },
  ].filter((d) => d.value > 0);
  const maxTypeCount = Math.max(1, ...summary.byType.map((r) => r.count));
  const maxTypeCommission = Math.max(1, ...summary.byType.map((r) => r.commission));

  // ---------- Commission tab ----------
  const [dealerRankTab, setDealerRankTab] = useState<"top" | "lowest">("top");

  const filteredDealers = useMemo(() => {
    const q = dealerSearch.trim().toLowerCase();
    if (!q) return DEALERS;
    return DEALERS.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
  }, [dealerSearch]);

  const rankedDealers = useMemo(() => {
    const sorted = [...DEALERS].sort((a, b) => (dealerRankTab === "top" ? b.commission - a.commission : a.commission - b.commission));
    return sorted.slice(0, 5);
  }, [dealerRankTab]);

  const commissionHistory = useMemo(
    () => scopedOrders.filter((o) => o.commission > 0).map((o, i) => ({ ...o, kind: i % 2 === 0 ? ("instance" as const) : ("scheduled" as const) })),
    [scopedOrders],
  );

  // ---------- Shared bits ----------
  const STATUS_STYLE: Record<OrderStatus, string> = {
    approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };
  const StatusBadge = ({ status }: { status: OrderStatus }) => (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0", STATUS_STYLE[status])}>
      {t(`ordersHistory.status.${status}`)}
    </span>
  );

  const FilterChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
      {label}
      <button type="button" onClick={onRemove} aria-label={t("ordersHistory.removeFilter")} className="w-4 h-4 rounded-full flex items-center justify-center">
        <XIcon className="w-3 h-3" />
      </button>
    </span>
  );

  const RingProgress = ({ percent }: { percent: number }) => {
    const r = 16;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, percent) / 100) * c;
    return (
      <div className="relative w-11 h-11 shrink-0">
        <svg viewBox="0 0 40 40" className="w-11 h-11 -rotate-90">
          <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
          <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} className="text-emerald-500" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{percent}%</span>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, label, value, tone }: { icon: typeof ClipboardList; label: string; value: string; tone: string }) => (
    <div className={cn("rounded-2xl p-3.5 flex items-center gap-2.5", tone)}>
      <div className="w-8 h-8 rounded-lg bg-white/70 dark:bg-black/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium opacity-80 truncate">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );

  const DateChips = ({ activeKey, onPick, onCustom }: { activeKey: string | null; onPick: (k: "today" | "last7" | "last30") => void; onCustom: () => void }) => (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
      {(["today", "last7", "last30"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onPick(k)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
            activeKey === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {t(`ordersHistory.filter.${k === "today" ? "today" : k === "last7" ? "last7" : "last30"}`)}
        </button>
      ))}
      <button
        type="button"
        onClick={onCustom}
        className={cn(
          "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
          activeKey === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {t("ordersHistory.filter.custom")}
      </button>
    </div>
  );

  // Plain bold heading + a soft-tinted box underneath — the Order Type sheet's own look,
  // distinct from CardSection's icon-header card used elsewhere on this page.
  const DetailBlock = ({ title, tone = "grey", children }: { title: string; tone?: "grey" | "blue"; children: React.ReactNode }) => (
    <div className="space-y-2">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <div className={cn("rounded-2xl px-3.5", tone === "blue" ? "bg-primary/10" : "bg-muted/60")}>{children}</div>
    </div>
  );

  // One shared box, not separate cards: only the first row — the dealer's own direct
  // commission, "me" — gets the highlighted tint, so it's the one that draws the eye.
  // Whatever their parent/team leader takes underneath stays plain white, set off from
  // "me" by a single divider line rather than its own colored background.
  const renderCommissionRows = (rows: { member: string; type: string; code: string; amount: number }[]) => (
    <div className="rounded-2xl overflow-hidden bg-card">
      {rows.map((b, i) => (
        <div key={i} className={cn("flex items-center justify-between gap-3 px-3.5 py-3", i === 0 ? "bg-primary/10" : "border-t border-border/60")}>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
              {b.member}
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground font-medium">{b.type}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{b.code}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-semibold shrink-0">
            <RiyalSymbol /> {b.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );

  const breakdownFor = (o: DemoOrder) =>
    o.commission > 0
      ? [
          { member: o.member, type: t("ordersHistory.direct"), code: o.memberCode, amount: o.commission * 0.8 },
          { member: t("ordersHistory.teamLeader"), type: t("ordersHistory.override"), code: "DST-LEAD", amount: o.commission * 0.2 },
        ]
      : [];

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("ordersHistory.title")} showBack />

      <div className="px-4 pb-3 -mt-1">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
          {view === "member" ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {t(view === "member" ? "ordersHistory.viewingAsMember" : "ordersHistory.viewingAsParent")}
        </span>
      </div>

      <div className="px-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full grid grid-cols-3 bg-transparent p-0 h-auto border-b border-border rounded-none mb-4">
            {(["orders", "summary", "commission"] as const).map((v) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-primary"
              >
                {t(`ordersHistory.tabs.${v}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ---------- Orders ---------- */}
          <TabsContent value="orders" className="mt-0 space-y-3 pb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder={t("ordersHistory.searchOrdersPlaceholder")} className="h-11 bg-card rounded-xl ps-9" />
              </div>
              <button
                type="button"
                onClick={openFilter}
                aria-label={t("ordersHistory.filter.title")}
                className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4 text-foreground" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {(appliedStatus || appliedRange || appliedMemberQuery.trim()) && (
              <div className="flex items-center gap-2 flex-wrap">
                {appliedMemberQuery.trim() && <FilterChip label={appliedMemberQuery.trim()} onRemove={() => setAppliedMemberQuery("")} />}
                {appliedStatus && <FilterChip label={t(`ordersHistory.status.${appliedStatus}`)} onRemove={() => setAppliedStatus(null)} />}
                {appliedRange && <FilterChip label={appliedRange.label} onRemove={removeDateFilter} />}
              </div>
            )}

            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">{t("ordersHistory.noOrders")}</div>
            ) : (
              filteredOrders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrder(o)}
                  className="w-full text-start bg-card rounded-2xl border-s-4 border-s-primary border border-border/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {o.id}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{t(`ordersHistory.orderType.${o.type}`)}</p>
                  {/* Who-owns-it attribution is a Parent/manager concern — a member already
                      knows these are their own orders. The commission breakdown itself
                      (their cut, highlighted, vs. what their parent takes) still applies
                      to both views. */}
                  {view === "parent" && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      {o.customer} <span className="text-muted-foreground/50">•</span> {o.memberCode}
                    </div>
                  )}
                  {o.commission > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBreakdownOrder(o);
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary w-fit"
                    >
                      <Eye className="w-3.5 h-3.5" /> {t("ordersHistory.commissionBreakdown")}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    {o.phone}
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                      {o.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1">
                        <RiyalSymbol /> {o.commission.toFixed(2)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                    </span>
                  </div>
                </button>
              ))
            )}
          </TabsContent>

          {/* ---------- Summary ---------- */}
          <TabsContent value="summary" className="mt-0 space-y-4 pb-4">
            {view === "parent" && (
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  readOnly
                  onClick={() => setSearchDealersOpen(true)}
                  value={selectedDealer ? selectedDealer.name : ""}
                  placeholder={t("ordersHistory.searchByMember")}
                  className="h-11 bg-card rounded-xl ps-9 cursor-pointer"
                />
                {selectedDealer && (
                  <button
                    type="button"
                    onClick={() => setSelectedDealer(null)}
                    aria-label={t("ordersHistory.removeFilter")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
                  >
                    <XIcon className="w-3 h-3 text-foreground" />
                  </button>
                )}
              </div>
            )}
            <DateChips activeKey={scopeRangeKey} onPick={setScopeRangeKey} onCustom={openScopePickDate} />

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Package} label={t("ordersHistory.summary.totalOrders")} value={String(summary.total)} tone="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" />
              <StatCard icon={CheckCircle2} label={t("ordersHistory.summary.completed")} value={String(summary.completed)} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" />
              <StatCard icon={Wallet} label={t("ordersHistory.summary.commission")} value={summary.commission.toFixed(2)} tone="bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" />
              <StatCard icon={Clock} label={t("ordersHistory.summary.pending")} value={String(summary.pending)} tone="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" />
            </div>

            <CardSection title={t("ordersHistory.summary.ordersByStatus")} icon={ClipboardList}>
              {summary.total === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t("ordersHistory.noOrders")}</p>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={36} outerRadius={54} paddingAngle={2} dataKey="value" stroke="none">
                          {pieData.map((d) => (
                            <Cell key={d.key} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-foreground">{summary.total}</span>
                      <span className="text-[10px] text-muted-foreground">{t("ordersHistory.summary.total")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 flex-wrap justify-center">
                    {(["approved", "pending", "rejected"] as const).map((s) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s === "approved" ? "#22C55E" : s === "pending" ? "#F59E0B" : "#EF4444" }} />
                        <span className="text-xs text-muted-foreground">
                          {t(`ordersHistory.status.${s}`)} ({summary[s === "approved" ? "completed" : s]})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardSection>

            <CardSection title={t("ordersHistory.summary.ordersByType")} icon={Package}>
              <div className="space-y-3">
                {summary.byType.map((r) => (
                  <div key={r.type} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-muted-foreground shrink-0 truncate">{t(`ordersHistory.orderType.${r.type}`)}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(r.count / maxTypeCount) * 100}%` }} />
                    </div>
                    <span className="w-6 text-xs font-semibold text-foreground text-end shrink-0">{r.count}</span>
                  </div>
                ))}
              </div>
            </CardSection>

            <CardSection title={t("ordersHistory.summary.commissionByType")} icon={Wallet}>
              <div className="space-y-3">
                {summary.byType.map((r) => (
                  <div key={r.type} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-muted-foreground shrink-0 truncate">{t(`ordersHistory.orderType.${r.type}`)}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(r.commission / maxTypeCommission) * 100}%` }} />
                    </div>
                    <span className="w-14 text-xs font-semibold text-foreground text-end shrink-0">
                      <RiyalSymbol /> {r.commission.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardSection>
          </TabsContent>

          {/* ---------- Commission ---------- */}
          <TabsContent value="commission" className="mt-0 space-y-4 pb-4">
            {/* A member has no one else to search across — Parent View only. */}
            {view === "parent" && (
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  readOnly
                  onClick={() => setSearchDealersOpen(true)}
                  value={selectedDealer ? selectedDealer.name : ""}
                  placeholder={t("ordersHistory.searchByMember")}
                  className="h-11 bg-card rounded-xl ps-9 cursor-pointer"
                />
                {selectedDealer && (
                  <button
                    type="button"
                    onClick={() => setSelectedDealer(null)}
                    aria-label={t("ordersHistory.removeFilter")}
                    className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
                  >
                    <XIcon className="w-3 h-3 text-foreground" />
                  </button>
                )}
              </div>
            )}

            <div className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{t("ordersHistory.teamAchievements")}</p>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">{t("ordersHistory.text")}</span>
                </div>
                <button type="button" onClick={() => navigate("/order-history/achievements")} className="text-xs font-medium text-primary flex items-center gap-0.5 shrink-0">
                  {t("ordersHistory.seeAll")} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
              <div className="space-y-3.5">
                {TEAM_ACHIEVEMENTS.slice(0, 3).map((a) => (
                  <div key={a.key} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t(`ordersHistory.teamAchievement.${a.key}`)}</p>
                      <p className="text-[11px] text-muted-foreground">{t("ordersHistory.achievementTarget")}</p>
                    </div>
                    <RingProgress percent={Math.round((a.achievement / a.target) * 100)} />
                  </div>
                ))}
              </div>
            </div>

            <DateChips activeKey={scopeRangeKey} onPick={setScopeRangeKey} onCustom={openScopePickDate} />

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Wallet} label={t("ordersHistory.summary.commission")} value={summary.commission.toFixed(2)} tone="bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" />
              <StatCard icon={Clock} label={t("ordersHistory.summary.pending")} value={String(summary.pending)} tone="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" />
            </div>

            {/* Ranking against other dealers only makes sense from the Parent View. */}
            {view === "parent" && (
              <CardSection
                title={t("ordersHistory.dealers")}
                icon={User}
                right={
                  <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
                    {(["top", "lowest"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setDealerRankTab(k)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                          dealerRankTab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                        )}
                      >
                        {t(`ordersHistory.${k === "top" ? "top5" : "lowest5"}`)}
                      </button>
                    ))}
                  </div>
                }
              >
                {rankedDealers.map((d, i) => (
                  <div key={d.code} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{d.name}</p>
                        <p className="text-[11px] text-muted-foreground">{t("ordersHistory.ordersCount", { count: d.orders })}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">
                      <RiyalSymbol /> {d.commission.toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardSection>
            )}

            <CardSection
              title={t("ordersHistory.commissionHistory")}
              icon={Wallet}
              right={
                <button type="button" onClick={() => navigate(`/order-history/commission-history?view=${view}`)} className="text-xs font-medium text-primary flex items-center gap-0.5 shrink-0">
                  {t("ordersHistory.seeAll")} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              }
            >
              {commissionHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">{t("ordersHistory.noOrders")}</p>
              ) : (
                commissionHistory.map((o) => (
                  <div key={o.id} className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {o.kind === "instance" ? <ArrowUpRight className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{t(`ordersHistory.${o.kind === "instance" ? "instanceCommission" : "scheduledCommission"}`)}</p>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          +<RiyalSymbol /> {o.commission.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{o.member} · {o.memberCode}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{o.id}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{o.date}</span>
                        <StatusBadge status={o.commissionStatus} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardSection>
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------- Filter drawer (Orders tab) ---------- */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setFilterOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("ordersHistory.filter.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("ordersHistory.filter.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-5">
            {view === "parent" && (
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={draftMemberQuery}
                  onChange={(e) => setDraftMemberQuery(e.target.value)}
                  placeholder={t("ordersHistory.searchByMember")}
                  className="h-11 bg-background rounded-xl ps-9"
                />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("ordersHistory.filter.dateRange")}</p>
              <DateChips
                activeKey={draftDateKey}
                onPick={(k) => {
                  setDraftDateKey(k);
                  pickQuickRange(k);
                }}
                onCustom={openPickDate}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("ordersHistory.filter.orderTypes")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraftTypes([])}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                    draftTypes.length === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t("ordersHistory.filter.all")}
                </button>
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleDraftType(type)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                      draftTypes.includes(type) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t(`ordersHistory.orderType.${type}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("ordersHistory.filter.orderStatus")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraftStatus(null)}
                  className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", draftStatus === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >
                  {t("ordersHistory.filter.all")}
                </button>
                {(["pending", "approved", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraftStatus(s)}
                    className={cn("px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors", draftStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                  >
                    {t(`ordersHistory.status.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2 px-1">{t("ordersHistory.filter.commissionStatus")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDraftCommissionStatus(null)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                    draftCommissionStatus === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t("ordersHistory.filter.all")}
                </button>
                {(["approved", "pending", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraftCommissionStatus(s)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors",
                      draftCommissionStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t(`ordersHistory.status.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={applyFilter} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
              {t("ordersHistory.filter.apply")}
            </button>
            <button type="button" onClick={clearFilter} className="w-full text-center text-sm font-medium text-muted-foreground">
              {t("ordersHistory.filter.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Pick a date drawer ---------- */}
      <Drawer
        open={pickDateOpen}
        onOpenChange={(o) => {
          setPickDateOpen(o);
          if (!o && pickDateTarget === "orders") setFilterOpen(true);
        }}
      >
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setPickDateOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("ordersHistory.pickDate.title")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("ordersHistory.pickDate.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
            <Calendar
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={1}
              defaultMonth={TODAY_REF}
              className="w-full p-0"
              classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground flex-1 font-normal text-[0.8rem]",
                row: "flex w-full mt-1",
                cell: "flex-1 text-center text-sm p-0 relative",
                day: "h-10 w-10 mx-auto p-0 font-normal rounded-full aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
              }}
            />
            <div className="space-y-2">
              <SummaryRow label={t("ordersHistory.pickDate.dateFrom")} value={draftRange?.from ? fmtShort(draftRange.from) : "—"} />
              <SummaryRow label={t("ordersHistory.pickDate.dateTo")} value={draftRange?.to ? fmtShort(draftRange.to) : "—"} />
            </div>
            <button type="button" disabled={!draftRange?.from} onClick={applyPickDate} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
              {t("ordersHistory.pickDate.apply")}
            </button>
            <button type="button" onClick={() => setDraftRange(undefined)} className="w-full text-center text-sm font-medium text-muted-foreground">
              {t("ordersHistory.pickDate.clear")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Order Type detail drawer ---------- */}
      <Drawer open={!!selectedOrder} onOpenChange={(o) => { if (!o) setSelectedOrder(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setSelectedOrder(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("ordersHistory.orderTypeSheetTitle")}</DrawerTitle>
          </DrawerHeader>
          {selectedOrder && (
            <div className="px-4 pb-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {selectedOrder.id}
                </span>
                <StatusBadge status={selectedOrder.status} />
              </div>
              <p className="text-sm font-semibold text-foreground">{t(`ordersHistory.orderType.${selectedOrder.type}`)}</p>

              {selectedOrder.status === "rejected" && selectedOrder.rejectedReason && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 p-3.5">
                  <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{t("ordersHistory.rejectedReason")}</p>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{selectedOrder.rejectedReason}</p>
                  </div>
                </div>
              )}

              <DetailBlock title={t("ordersHistory.customerDetails")}>
                <SummaryRow label={t("ordersHistory.name")} value={selectedOrder.customer} />
                <SummaryRow label={t("ordersHistory.msisdn")} value={selectedOrder.phone} />
                <SummaryRow label={t("ordersHistory.created")} value={selectedOrder.idType} />
              </DetailBlock>

              <DetailBlock title={t("ordersHistory.orderDetails")}>
                <SummaryRow label={t("ordersHistory.member")} value={selectedOrder.member} />
                <SummaryRow label={t("ordersHistory.created")} value={selectedOrder.date} />
              </DetailBlock>

              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">{t("ordersHistory.commissions")}</p>
                {breakdownFor(selectedOrder).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4 bg-muted/60 rounded-2xl">{t("ordersHistory.noOrders")}</p>
                ) : (
                  renderCommissionRows(breakdownFor(selectedOrder))
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* ---------- Commission Breakdown drawer ---------- */}
      <Drawer open={!!breakdownOrder} onOpenChange={(o) => { if (!o) setBreakdownOrder(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <button onClick={() => setBreakdownOrder(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("ordersHistory.commissionBreakdown")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">{breakdownOrder && renderCommissionRows(breakdownFor(breakdownOrder))}</div>
        </DrawerContent>
      </Drawer>

      {/* ---------- Search Dealers drawer (Commission tab) ---------- */}
      <Drawer open={searchDealersOpen} onOpenChange={setSearchDealersOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setSearchDealersOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("ordersHistory.searchDealers")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={dealerSearch} onChange={(e) => setDealerSearch(e.target.value)} placeholder={t("ordersHistory.searchByMember")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
            {filteredDealers.map((d) => (
              <button
                key={d.code}
                type="button"
                onClick={() => {
                  setSelectedDealer(d);
                  setSearchDealersOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl border transition text-start",
                  selectedDealer?.code === d.code ? "border-[0.5px] bg-primary/10 border-primary/20" : "border-border bg-card",
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.code}</p>
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default OrdersHistory;
