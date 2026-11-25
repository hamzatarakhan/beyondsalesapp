import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import TimeWheel, { minutesLabel } from "@/components/TimeWheel";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ReceivedBroadcastCard } from "@/pages/BroadcastReceived";
import { CalendarDays, Clock, Plus, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { BroadcastMessage, CAN_SEND_BROADCAST, broadcastDateTime, getReceivedBroadcasts, getSentBroadcasts } from "@/data/broadcasts";

type Tab = "sent" | "received";

// Date and time filter: a date range plus an optional time-of-day window (minutes since midnight).
type Filter = { range?: DateRange; fromMin: number | null; toMin: number | null };
type TimeKey = "fromMin" | "toMin";
const NO_FILTER: Filter = { range: undefined, fromMin: null, toMin: null };
const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function matchesFilter(b: BroadcastMessage, f: Filter) {
  const when = broadcastDateTime(b.date);
  if (!when) return true;
  if (f.range?.from) {
    const day = startOfDay(when).getTime();
    const from = startOfDay(f.range.from).getTime();
    const to = startOfDay(f.range.to ?? f.range.from).getTime();
    if (day < from || day > to) return false;
  }
  const mins = when.getHours() * 60 + when.getMinutes();
  if (f.fromMin !== null && mins < f.fromMin) return false;
  if (f.toMin !== null && mins > f.toMin) return false;
  return true;
}

// Sent and Received broadcasts, one page with a tab switch (opened from the Home Broadcast widget).
const Broadcast = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "received" ? "received" : "sent";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [draft, setDraft] = useState<Filter>(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<TimeKey>("fromMin");
  const filterActive = !!filter.range?.from || filter.fromMin !== null || filter.toMin !== null;

  // Search by member: Sent matches any recipient's name or ID code, Received matches the sender.
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tab === "sent" ? getSentBroadcasts() : getReceivedBroadcasts()).filter((b) => {
      const people = tab === "sent" ? (b.members ?? []).flatMap((m) => [m.name, m.code]) : [b.from ?? ""];
      return (!q || people.some((p) => p.toLowerCase().includes(q))) && matchesFilter(b, filter);
    });
  }, [tab, query, filter]);
  const searching = !!query.trim() || filterActive;

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title={t("broadcast.title")} showBack onBackClick={() => navigate("/")} />

      {/* Underline tabs — same style as Orders History (Orders / Summary). */}
      <div className="px-4">
        <Tabs value={tab} onValueChange={(v) => setParams({ tab: v }, { replace: true })}>
          <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto border-b border-border rounded-none">
            {(["sent", "received"] as Tab[]).map((k) => (
              <TabsTrigger
                key={k}
                value={k}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-primary"
              >
                {t(`broadcast.${k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 mt-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "sent" ? t("broadcast.searchMember") : t("broadcast.searchSender")}
            className="w-full h-12 rounded-xl bg-card border border-border/60 ps-4 pe-11 text-base outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Search className="w-5 h-5 text-muted-foreground absolute end-4 top-1/2 -translate-y-1/2" />
        </div>
        <button
          onClick={() => { setDraft(filter); setEditingTime("fromMin"); setFilterOpen(true); }}
          className="relative w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center"
          aria-label={t("broadcast.filter")}
        >
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          {filterActive && <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {list.map((b) => tab === "received" ? (
          <ReceivedBroadcastCard key={b.id} b={b} onClick={() => navigate(`/broadcast/received/${b.id}`, { state: { fromList: true } })} />
        ) : (
          <ReceivedBroadcastCard
            key={b.id}
            b={b}
            title={`${t("broadcast.to")}: ${b.members?.[0]?.name ?? ""}`}
            extra={(b.members?.length ?? 0) > 1 ? `+${(b.members?.length ?? 0) - 1}` : undefined}
            icon={Users}
            onClick={() => navigate(`/broadcast/sent/${b.id}`, { state: { fromList: true } })}
          />
        ))}
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">{searching ? t("broadcast.noMatch") : t("broadcast.empty")}</p>
        )}
      </div>

      {/* New Broadcast only on the Sent tab (hidden on Received), and only for users allowed to send. */}
      {tab === "sent" && CAN_SEND_BROADCAST && (
      <button
        onClick={() => navigate("/broadcast/new")}
        className="app-fab h-12 px-5 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> {t("broadcast.newBroadcast")}
      </button>
      )}

      {/* Date and time filter */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="max-h-[90vh] overflow-hidden">
          <div className="relative pt-2 pb-2 px-4 text-center">
            <h2 className="text-lg font-semibold text-foreground">{t("broadcast.pickDate")}</h2>
            <p className="text-sm text-muted-foreground">{t("broadcast.pickDateSub")}</p>
            <button
              onClick={() => setFilterOpen(false)}
              className="absolute end-4 top-2 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              aria-label={t("broadcast.close")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-4 pb-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
            <div>
              <Calendar
                mode="range"
                selected={draft.range}
                onSelect={(range) => setDraft((d) => ({ ...d, range }))}
                numberOfMonths={1}
                defaultMonth={new Date(2026, 10, 1)}
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
              {/* Date From / Date To in one box, one row each */}
              <div className="mt-3 rounded-xl bg-muted/40 border border-border/60 px-3 divide-y divide-border/60 text-sm">
                {([
                  { label: t("broadcast.dateFrom"), value: draft.range?.from },
                  { label: t("broadcast.dateTo"), value: draft.range?.to ?? draft.range?.from },
                ]).map((r) => (
                  <div key={r.label} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="w-4 h-4" />{r.label}</span>
                    <span className="font-semibold text-foreground" dir="ltr">{r.value ? fmtDay(r.value) : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.time")}</p>
              {/* From time / To time: tap a row, then set it on the wheel below */}
              <div className="rounded-xl bg-muted/40 border border-border/60 px-3 divide-y divide-border/60 text-sm mb-2">
                {(["fromMin", "toMin"] as const).map((k) => {
                  const on = editingTime === k;
                  const v = draft[k];
                  return (
                    <button key={k} type="button" onClick={() => setEditingTime(k)} className="w-full flex items-center justify-between py-2.5">
                      <span className={cn("flex items-center gap-2", on ? "text-primary font-medium" : "text-muted-foreground")}>
                        <Clock className="w-4 h-4" />{k === "fromMin" ? t("broadcast.timeFrom") : t("broadcast.timeTo")}
                      </span>
                      <span className={cn("font-semibold", on ? "text-primary" : "text-foreground")} dir="ltr">{v === null ? "—" : minutesLabel(v)}</span>
                    </button>
                  );
                })}
              </div>
              <TimeWheel
                value={draft[editingTime] ?? (editingTime === "fromMin" ? 0 : 23 * 60 + 59)}
                onChange={(v) => setDraft((d) => ({ ...d, [editingTime]: v }))}
                labels={{ hour: t("broadcast.hour"), minute: t("broadcast.minute"), period: t("broadcast.period") }}
              />
            </div>
          </div>
          <div className="shrink-0 px-4 pt-3 pb-6 space-y-3 border-t border-border/60">
            <button
              onClick={() => { setFilter(draft); setFilterOpen(false); }}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              {t("broadcast.apply")}
            </button>
            <button
              onClick={() => { setDraft(NO_FILTER); setFilter(NO_FILTER); setFilterOpen(false); }}
              className="w-full h-11 text-primary font-semibold"
            >
              {t("broadcast.clearFilter")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Broadcast;
