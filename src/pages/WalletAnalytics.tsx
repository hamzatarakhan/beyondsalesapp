import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import RiyalSymbol from "@/components/RiyalSymbol";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, CalendarDays, Check, ChevronRight, Plus, Search, SlidersHorizontal, UserRound, X } from "lucide-react";

// E-Wallet Analytics. Two demo roles, picked on Home: a Parent sees My Wallets and Team
// Wallets (whole team, or one member via the filter's member search, plus a member
// ranking); a Member sees only their own wallets. Figures are demo data — filters are
// recorded and shown as chips, the numbers do not come from a real query.

// ---------- Demo data ----------
interface WalletStats {
  credit: number;
  debit: number;
  creditCount: number;
  debitCount: number;
  recharge: number;
  billPayment: number;
  rollback: number;
  completed: number;
  pending: number;
  failed: number;
}

const WALLETS = [
  { id: "e-voucher", name: "E-Voucher", balance: 456.78 },
  { id: "e-topup", name: "E-Topup", balance: 1250.0 },
  { id: "e-cash", name: "E-Cash", balance: 320.5 },
] as const;
type WalletId = (typeof WALLETS)[number]["id"];

const BASE_STATS: WalletStats = {
  credit: 250, debit: 150, creditCount: 4, debitCount: 19,
  recharge: 2, billPayment: 19, rollback: 2, completed: 17, pending: 1, failed: 2,
};
// Each wallet / scope gets its own believable spread of the same shape.
const scaleStats = (s: WalletStats, k: number): WalletStats =>
  Object.fromEntries(Object.entries(s).map(([key, v]) => [key, Math.max(1, Math.round(v * k))])) as unknown as WalletStats;
const WALLET_FACTOR: Record<WalletId, number> = { "e-voucher": 1, "e-topup": 1.6, "e-cash": 0.6 };
const TEAM_FACTOR = 4.2;

interface TeamMember { id: string; name: string; code: string; balance: number; transactions: number }
const TEAM_MEMBERS: TeamMember[] = [
  { id: "m1", name: "Alex Thompson", code: "M-10021", balance: 12450, transactions: 55 },
  { id: "m2", name: "Sara Ali", code: "M-10022", balance: 8320.5, transactions: 48 },
  { id: "m3", name: "Ahmed Hassan", code: "M-10023", balance: 6100, transactions: 41 },
  { id: "m4", name: "Mohammed Khalid", code: "M-10024", balance: 4875.25, transactions: 36 },
  { id: "m5", name: "Noura Al-Qahtani", code: "M-10025", balance: 3990, transactions: 29 },
  { id: "m6", name: "Faisal Al-Harbi", code: "M-10026", balance: 2210.75, transactions: 17 },
  { id: "m7", name: "Lina Saeed", code: "M-10027", balance: 1540, transactions: 11 },
  { id: "m8", name: "Omar Yousef", code: "M-10028", balance: 860, transactions: 6 },
];
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// ---------- Filters ----------
type DatePreset = "today" | "last7" | "last30" | "custom";
type TxnType = "all" | "credit" | "debit";
const ACTIVITY_TYPES = ["transfer", "voucher", "failed"] as const;
const ACTIVITY_STATUSES = ["approved", "pending", "failed"] as const;
type ActivityType = (typeof ACTIVITY_TYPES)[number];
type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

interface Filters {
  date: DatePreset;
  range?: DateRange;
  txnType: TxnType;
  activityTypes: ActivityType[];
  statuses: ActivityStatus[];
  memberId: string | null;
}
const DEFAULT_FILTERS: Filters = { date: "last30", txnType: "all", activityTypes: [], statuses: [], memberId: null };

const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const Chip = ({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-8 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-colors",
      on ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
    )}
  >
    {on ? <Check className="w-3.5 h-3.5" /> : icon ?? <Plus className="w-3.5 h-3.5 text-muted-foreground" />}
    {children}
  </button>
);

// ---------- Donut ----------
interface Segment { label: string; value: number; color: string }
const Donut = ({ segments, totalLabel }: { segments: Segment[]; totalLabel: string }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = 42;
  const circumference = 2 * Math.PI * r;
  const gap = segments.length > 1 ? 3 : 0;
  let offset = 0;
  return (
    <div className="rounded-xl bg-muted/40 border border-border/60 p-4 flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((s) => {
            const len = total ? (s.value / total) * circumference : 0;
            const dash = Math.max(0, len - gap);
            const el = (
              <circle
                key={s.label}
                cx="50" cy="50" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-foreground tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">{totalLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
            {s.label} ({s.value})
          </span>
        ))}
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="bg-card rounded-2xl p-4 border border-border/60">
    <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
    {children}
  </section>
);

// ---------- Page ----------
const WalletAnalytics = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const isParent = params.get("view") !== "member";

  const [tab, setTab] = useState<"mine" | "team">("mine");
  const [walletId, setWalletId] = useState<WalletId>("e-voucher");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [memberPickerOpen, setMemberPickerOpen] = useState(false);
  // Custom Date opens its own "Pick a Date" sheet on top of the filter flow; the range is
  // only copied into the filter draft on Apply.
  const [pickDateOpen, setPickDateOpen] = useState(false);
  const [rangeDraft, setRangeDraft] = useState<DateRange | undefined>();
  const [memberSearch, setMemberSearch] = useState("");
  const [ranking, setRanking] = useState<"top" | "lowest">("top");

  const team = isParent && tab === "team";
  const member = team ? TEAM_MEMBERS.find((m) => m.id === filters.memberId) ?? null : null;

  const stats = useMemo(() => {
    let k = WALLET_FACTOR[walletId];
    if (team) k *= member ? member.transactions / 23 : TEAM_FACTOR;
    return scaleStats(BASE_STATS, k);
  }, [walletId, team, member]);

  const switchTab = (next: "mine" | "team") => {
    setTab(next);
    // The member filter only exists on Team Wallets.
    setFilters((f) => ({ ...f, memberId: null }));
  };

  const openFilters = () => { setDraft(filters); setFilterOpen(true); };
  const applyFilters = () => { setFilters(draft); setFilterOpen(false); };
  const openPickDate = () => { setRangeDraft(draft.range); setFilterOpen(false); setPickDateOpen(true); };
  const closePickDate = () => { setPickDateOpen(false); setFilterOpen(true); };
  const applyPickDate = () => {
    if (rangeDraft?.from) setDraft((f) => ({ ...f, date: "custom", range: rangeDraft }));
    closePickDate();
  };
  const clearFilters = () => { setDraft(DEFAULT_FILTERS); setFilters(DEFAULT_FILTERS); setFilterOpen(false); };

  const dateLabel = (f: Filters) => {
    if (f.date === "custom") {
      if (!f.range?.from) return t("walletAnalytics.customDate");
      const to = f.range.to ?? f.range.from;
      return `${format(f.range.from, "d MMM")} - ${format(to, "d MMM")}`;
    }
    return t(`walletAnalytics.dates.${f.date}`);
  };

  // Applied filters shown as removable chips under the Filters bar (the default
  // Last 30 Days range and the selected member card are not chips).
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.date !== "last30" ? [{ key: "date", label: dateLabel(filters), remove: () => setFilters((f) => ({ ...f, date: "last30", range: undefined })) }] : []),
    ...(filters.txnType !== "all" ? [{ key: "txn", label: t(`walletAnalytics.txnTypes.${filters.txnType}`), remove: () => setFilters((f) => ({ ...f, txnType: "all" })) }] : []),
    ...filters.activityTypes.map((a) => ({ key: `a-${a}`, label: t(`walletAnalytics.activityTypes.${a}`), remove: () => setFilters((f) => ({ ...f, activityTypes: f.activityTypes.filter((x) => x !== a) })) })),
    ...filters.statuses.map((s) => ({ key: `s-${s}`, label: t(`walletAnalytics.statuses.${s}`), remove: () => setFilters((f) => ({ ...f, statuses: f.statuses.filter((x) => x !== s) })) })),
  ];

  const ranked = [...TEAM_MEMBERS].sort((a, b) => b.transactions - a.transactions);
  const rankedList = (ranking === "top" ? ranked : [...ranked].reverse()).slice(0, 5);
  const draftMember = TEAM_MEMBERS.find((m) => m.id === draft.memberId) ?? null;
  const memberMatches = TEAM_MEMBERS.filter((m) => `${m.name} ${m.code}`.toLowerCase().includes(memberSearch.trim().toLowerCase()));

  return (
    <div className="mobile-container min-h-screen bg-background pb-10">
      <AppHeader title={t("walletAnalytics.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        {isParent && (
          <div className="grid grid-cols-2 border-b border-border">
            {(["mine", "team"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => switchTab(v)}
                className={cn(
                  "h-10 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === v ? "border-primary text-primary" : "border-transparent text-muted-foreground",
                )}
              >
                {t(v === "mine" ? "walletAnalytics.myWallets" : "walletAnalytics.teamWallets")}
              </button>
            ))}
          </div>
        )}

        {/* Select Wallet */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{t("walletAnalytics.selectWallet")}</p>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 scroll-px-4 pb-1 snap-x">
            {WALLETS.map((w) => {
              const on = w.id === walletId;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={cn(
                    "snap-start shrink-0 w-[78%] rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 text-white transition-colors",
                    on ? "bg-teal-700" : "bg-teal-700/60",
                  )}
                >
                  <span className="text-sm font-medium">{w.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold"><RiyalSymbol /> {w.balance.toFixed(2)}</span>
                    <span className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center">
                      {on && <span className="w-2 h-2 rounded-full bg-white" />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters bar + applied chips */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={openFilters}
            className={cn(
              "w-full h-11 rounded-full px-4 flex items-center gap-2 text-sm transition-colors",
              chips.length ? "bg-primary/10 text-foreground" : "bg-card border border-border/60 text-foreground",
            )}
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span className="font-medium">{t("walletAnalytics.filters")}</span>
            {chips.length > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">{chips.length}</span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground ms-auto rtl:rotate-180" />
          </button>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <span key={c.key} className="h-6 ps-2.5 pe-1.5 rounded-full border border-primary text-primary text-[11px] font-medium inline-flex items-center gap-1">
                  {c.label}
                  <button type="button" onClick={c.remove} aria-label={t("walletAnalytics.remove")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Selected member (Team Wallets) */}
        {member && (
          <div className="rounded-2xl bg-primary/10 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">{initials(member.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                <p className="text-[11px] text-muted-foreground">{member.code}</p>
              </div>
              <div className="text-end">
                <p className="text-[11px] text-muted-foreground">{t("walletAnalytics.balance")}</p>
                <p className="text-sm font-bold text-primary"><RiyalSymbol /> {member.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowLeftRight className="w-4 h-4" />
              <span className="flex-1">{t("walletAnalytics.totalTransactions")}</span>
              <span className="px-1.5 py-0.5 rounded bg-card text-primary font-semibold">{member.transactions}</span>
            </div>
          </div>
        )}

        <Section title={t("walletAnalytics.creditVsDebit")}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-sky-100 dark:bg-sky-500/15 border border-sky-200 dark:border-sky-500/30 p-3">
              <p className="text-xs text-muted-foreground">{t("walletAnalytics.totalCredit")}</p>
              <p className="text-base font-semibold text-sky-700 dark:text-sky-300 mt-1"><RiyalSymbol /> {stats.credit}</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 p-3">
              <p className="text-xs text-muted-foreground">{t("walletAnalytics.totalDebit")}</p>
              <p className="text-base font-semibold text-amber-600 dark:text-amber-300 mt-1"><RiyalSymbol /> {stats.debit}</p>
            </div>
          </div>
        </Section>

        <Section title={t("walletAnalytics.transactionByType")}>
          <Donut
            totalLabel={t("walletAnalytics.total")}
            segments={[
              { label: t("walletAnalytics.txnTypes.debit"), value: stats.debitCount, color: "#0284C7" },
              { label: t("walletAnalytics.txnTypes.credit"), value: stats.creditCount, color: "#EAB308" },
            ]}
          />
        </Section>

        <Section title={t("walletAnalytics.activityByType")}>
          <Donut
            totalLabel={t("walletAnalytics.total")}
            segments={[
              { label: t("walletAnalytics.recharge"), value: stats.recharge, color: "#14B8A6" },
              { label: t("walletAnalytics.billPayment"), value: stats.billPayment, color: "#8B5CF6" },
              { label: t("walletAnalytics.rollback"), value: stats.rollback, color: "#EC4899" },
            ]}
          />
        </Section>

        <Section title={t("walletAnalytics.activityByStatus")}>
          <Donut
            totalLabel={t("walletAnalytics.total")}
            segments={[
              { label: t("walletAnalytics.completed"), value: stats.completed, color: "#22C55E" },
              { label: t("walletAnalytics.statuses.pending"), value: stats.pending, color: "#F97316" },
              { label: t("walletAnalytics.statuses.failed"), value: stats.failed, color: "#EF4444" },
            ]}
          />
        </Section>

        {/* Ranking compares the whole team, so it is hidden while one member is selected. */}
        {team && !member && (
          <Section title={t("walletAnalytics.memberRanking")}>
            <div className="grid grid-cols-2 border-b border-border mb-3">
              {(["top", "lowest"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRanking(v)}
                  className={cn(
                    "h-9 text-xs font-medium border-b-2 -mb-px transition-colors",
                    ranking === v ? "border-primary text-primary" : "border-transparent text-muted-foreground",
                  )}
                >
                  {t(v === "top" ? "walletAnalytics.top5" : "walletAnalytics.lowest5")}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {rankedList.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                  <span className={cn(
                    "w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0",
                    ranking === "top" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-primary/10 text-primary",
                  )}>{i + 1}</span>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{m.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">{t("walletAnalytics.transactionsCount", { count: m.transactions })}</span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Filter sheet */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 max-h-[90vh]">
          <div className="relative px-5 pt-3 pb-2 text-center">
            <DrawerTitle className="text-lg font-bold text-foreground">{t("walletAnalytics.filterTitle")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5">{t("walletAnalytics.filterDesc")}</DrawerDescription>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="absolute end-5 top-3 w-8 h-8 rounded-full border border-border flex items-center justify-center"
              aria-label={t("walletAnalytics.close")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 pb-6 space-y-4 overflow-y-auto">
            {team && (
              <button
                type="button"
                onClick={() => { setMemberSearch(""); setMemberPickerOpen(true); }}
                className="w-full h-11 rounded-xl border border-input bg-card px-3 flex items-center gap-2 text-sm text-start"
              >
                <span className={cn("flex-1 truncate", draftMember ? "text-foreground" : "text-muted-foreground")}>
                  {draftMember ? `${draftMember.name} · ${draftMember.code}` : t("walletAnalytics.searchMember")}
                </span>
                {draftMember ? (
                  <X
                    className="w-4 h-4 text-muted-foreground"
                    onClick={(e) => { e.stopPropagation(); setDraft((d) => ({ ...d, memberId: null })); }}
                  />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("walletAnalytics.dateRange")}</p>
              <div className="flex flex-wrap gap-2">
                {(["today", "last7", "last30"] as const).map((d) => (
                  <Chip key={d} on={draft.date === d} onClick={() => setDraft((f) => ({ ...f, date: d, range: undefined }))}>
                    {t(`walletAnalytics.dates.${d}`)}
                  </Chip>
                ))}
                <Chip
                  on={draft.date === "custom"}
                  onClick={openPickDate}
                  icon={<CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />}
                >
                  {draft.date === "custom" && draft.range?.from ? dateLabel(draft) : t("walletAnalytics.customDate")}
                </Chip>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("walletAnalytics.transactionType")}</p>
              <div className="flex flex-wrap gap-2">
                {(["all", "credit", "debit"] as const).map((v) => (
                  <Chip key={v} on={draft.txnType === v} onClick={() => setDraft((f) => ({ ...f, txnType: v }))} icon={<></>}>
                    {t(`walletAnalytics.txnTypes.${v}`)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("walletAnalytics.activityType")}</p>
              <div className="flex flex-wrap gap-2">
                <Chip on={draft.activityTypes.length === 0} onClick={() => setDraft((f) => ({ ...f, activityTypes: [] }))}>{t("walletAnalytics.all")}</Chip>
                {ACTIVITY_TYPES.map((a) => (
                  <Chip key={a} on={draft.activityTypes.includes(a)} onClick={() => setDraft((f) => ({ ...f, activityTypes: toggleIn(f.activityTypes, a) }))}>
                    {t(`walletAnalytics.activityTypes.${a}`)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{t("walletAnalytics.activityStatus")}</p>
              <div className="flex flex-wrap gap-2">
                <Chip on={draft.statuses.length === 0} onClick={() => setDraft((f) => ({ ...f, statuses: [] }))}>{t("walletAnalytics.all")}</Chip>
                {ACTIVITY_STATUSES.map((s) => (
                  <Chip key={s} on={draft.statuses.includes(s)} onClick={() => setDraft((f) => ({ ...f, statuses: toggleIn(f.statuses, s) }))}>
                    {t(`walletAnalytics.statuses.${s}`)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Button
                className="w-full h-12 rounded-full font-semibold"
                disabled={draft.date === "custom" && !draft.range?.from}
                onClick={applyFilters}
              >
                {t("walletAnalytics.apply")}
              </Button>
              <button type="button" onClick={clearFilters} className="w-full h-10 text-sm font-semibold text-primary">
                {t("walletAnalytics.clearFilter")}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Pick a Date sheet (Custom Date) */}
      <Drawer open={pickDateOpen} onOpenChange={(o) => { if (!o) closePickDate(); }}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 max-h-[92vh] overflow-hidden">
          <div className="relative px-5 pt-3 pb-2 text-center">
            <DrawerTitle className="text-lg font-bold text-foreground">{t("walletAnalytics.pickDate")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground mt-0.5">{t("walletAnalytics.pickDateDesc")}</DrawerDescription>
            <button
              type="button"
              onClick={closePickDate}
              className="absolute end-5 top-3 w-8 h-8 rounded-full border border-border flex items-center justify-center"
              aria-label={t("walletAnalytics.close")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 space-y-3">
            <Calendar
              mode="range"
              selected={rangeDraft}
              onSelect={setRangeDraft}
              defaultMonth={rangeDraft?.from ?? new Date()}
              disabled={{ after: new Date() }}
              className="w-full p-0"
              classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                caption_label: "text-sm font-semibold text-primary",
                nav_button: "h-7 w-7 flex items-center justify-center text-sky-600 disabled:opacity-30",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "flex-1 text-foreground font-semibold text-[0.8rem]",
                row: "flex w-full mt-1",
                cell: "flex-1 text-center text-sm p-0 relative",
                day: "h-10 w-10 mx-auto p-0 font-normal rounded-full hover:bg-muted aria-selected:opacity-100",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_range_middle: "aria-selected:bg-primary/10 aria-selected:text-primary",
                day_today: "font-semibold text-primary",
              }}
            />
            <div className="rounded-xl bg-muted/50 px-3">
              <div className="flex items-center justify-between py-2.5 border-b border-border/60">
                <span className="text-[11px] text-muted-foreground">{t("walletAnalytics.dateFrom")}</span>
                <span className="text-xs font-semibold text-foreground">{rangeDraft?.from ? format(rangeDraft.from, "d MMM yyyy") : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[11px] text-muted-foreground">{t("walletAnalytics.dateTo")}</span>
                <span className="text-xs font-semibold text-foreground">{rangeDraft?.from ? format(rangeDraft.to ?? rangeDraft.from, "d MMM yyyy") : "—"}</span>
              </div>
            </div>
          </div>
          <div className="shrink-0 px-5 pt-2 pb-6 space-y-2">
            <Button className="w-full h-12 rounded-full font-semibold" disabled={!rangeDraft?.from} onClick={applyPickDate}>
              {t("walletAnalytics.apply")}
            </Button>
            <button type="button" onClick={() => setRangeDraft(undefined)} className="w-full h-10 text-sm font-semibold text-primary">
              {t("walletAnalytics.clearFilter")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Select Member sheet (Team Wallets filter) */}
      <Drawer open={memberPickerOpen} onOpenChange={setMemberPickerOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 max-h-[85vh]">
          <div className="relative px-5 pt-3 pb-3 text-center">
            <DrawerTitle className="text-lg font-bold text-foreground">{t("walletAnalytics.selectMember")}</DrawerTitle>
            <DrawerDescription className="sr-only">{t("walletAnalytics.searchMemberName")}</DrawerDescription>
            <button
              type="button"
              onClick={() => setMemberPickerOpen(false)}
              className="absolute end-5 top-3 w-8 h-8 rounded-full border border-border flex items-center justify-center"
              aria-label={t("walletAnalytics.close")}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 pb-3">
            <div className="relative">
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={t("walletAnalytics.searchMemberName")}
                className="w-full h-11 rounded-xl border border-input bg-card ps-3 pe-9 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="px-5 pb-6 space-y-2 overflow-y-auto">
            {memberMatches.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setDraft((d) => ({ ...d, memberId: m.id })); setMemberPickerOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start border transition-colors",
                  draft.memberId === m.id ? "border-primary/30 bg-primary/5" : "border-transparent bg-muted/50",
                )}
              >
                <UserRound className="w-5 h-5 text-sky-600 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground truncate">{m.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{m.code}</span>
                </span>
              </button>
            ))}
            {memberMatches.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("walletAnalytics.noMembers")}</p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default WalletAnalytics;
