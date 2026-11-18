import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import BroadcastVoiceNote from "@/components/BroadcastVoiceNote";
import { ReceivedBroadcastCard } from "@/pages/BroadcastReceived";
import { Eye, FileText, Image as ImageIcon, Plus, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { BroadcastMessage, CAN_SEND_BROADCAST, broadcastDateTime, getReceivedBroadcasts, getSentBroadcasts, markBroadcastRead } from "@/data/broadcasts";

type Tab = "sent" | "received";

// Date and time filter: a date range plus an optional time-of-day window (whole hours).
type Filter = { range?: DateRange; fromHour: string; toHour: string };
const NO_FILTER: Filter = { range: undefined, fromHour: "", toHour: "" };
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "AM" : "PM"}`;
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
  const hour = when.getHours() + when.getMinutes() / 60;
  if (f.fromHour !== "" && hour < Number(f.fromHour)) return false;
  // "To" is inclusive of that whole hour, so 9:00 AM–9:00 AM still finds 9:30 AM.
  if (f.toHour !== "" && hour >= Number(f.toHour) + 1) return false;
  return true;
}

// Sent and Received broadcasts, one page with a tab switch (opened from the Home Broadcast widget).
const Broadcast = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "received" ? "received" : "sent";
  const [open, setOpen] = useState<BroadcastMessage | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [draft, setDraft] = useState<Filter>(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterActive = !!filter.range?.from || filter.fromHour !== "" || filter.toHour !== "";

  // Search by member: Sent matches any recipient's name or ID code, Received matches the sender.
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tab === "sent" ? getSentBroadcasts() : getReceivedBroadcasts()).filter((b) => {
      const people = tab === "sent" ? (b.members ?? []).flatMap((m) => [m.name, m.code]) : [b.from ?? ""];
      return (!q || people.some((p) => p.toLowerCase().includes(q))) && matchesFilter(b, filter);
    });
  }, [tab, query, filter]);
  const searching = !!query.trim() || filterActive;

  // Sent: first recipient plus how many more. Received: the sender.
  const partyLine = (b: BroadcastMessage) => {
    if (tab === "received") return `${t("broadcast.from")}: ${b.from}`;
    const m = b.members ?? [];
    return `${t("broadcast.to")}: ${m[0]?.name ?? ""}${m.length > 1 ? ` ${t("broadcast.andMore", { count: m.length - 1 })}` : ""}`;
  };

  const openItem = (b: BroadcastMessage) => {
    if (tab === "received") markBroadcastRead(b.id);
    setOpen(b);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title={t("broadcast.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-muted/60">
          {(["sent", "received"] as Tab[]).map((k) => (
            <button
              key={k}
              onClick={() => setParams({ tab: k }, { replace: true })}
              className={cn(
                "h-9 rounded-full text-sm font-medium transition-colors",
                tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t(`broadcast.${k}`)}
            </button>
          ))}
        </div>
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
          onClick={() => { setDraft(filter); setFilterOpen(true); }}
          className="relative w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center"
          aria-label={t("broadcast.filter")}
        >
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          {filterActive && <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {list.map((b) => tab === "received" ? (
          <ReceivedBroadcastCard key={b.id} b={b} onClick={() => navigate(`/broadcast/received/${b.id}`)} />
        ) : (
          <ReceivedBroadcastCard
            key={b.id}
            b={b}
            title={`${t("broadcast.to")}: ${b.members?.[0]?.name ?? ""}`}
            extra={(b.members?.length ?? 0) > 1 ? `+${(b.members?.length ?? 0) - 1}` : undefined}
            icon={Users}
            onClick={() => openItem(b)}
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
            <h2 className="text-lg font-semibold text-foreground">{t("broadcast.filter")}</h2>
            <p className="text-sm text-muted-foreground">{t("broadcast.filterSub")}</p>
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
              <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.date")}</p>
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
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-muted/40 px-3 py-2">
                  <p className="text-muted-foreground">{t("broadcast.dateFrom")}</p>
                  <p className="font-semibold text-foreground" dir="ltr">{draft.range?.from ? fmtDay(draft.range.from) : "—"}</p>
                </div>
                <div className="rounded-xl bg-muted/40 px-3 py-2">
                  <p className="text-muted-foreground">{t("broadcast.dateTo")}</p>
                  <p className="font-semibold text-foreground" dir="ltr">{draft.range?.to ? fmtDay(draft.range.to) : draft.range?.from ? fmtDay(draft.range.from) : "—"}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.time")}</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "fromHour", ph: t("broadcast.timeFrom") },
                  { key: "toHour", ph: t("broadcast.timeTo") },
                ] as const).map((f) => (
                  <Select key={f.key} value={draft[f.key]} onValueChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-card border-border/60 text-base">
                      <SelectValue placeholder={f.ph} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {HOURS.map((h) => <SelectItem key={h} value={String(h)}>{hourLabel(h)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ))}
              </div>
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

      <Drawer open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DrawerContent className="px-4 pb-8">
          {open && (
            <>
              <div className="relative pt-2 pb-4 pe-10">
                <h2 className="text-lg font-semibold text-foreground">{tab === "sent" ? t("broadcast.sentBroadcast") : t("broadcast.receivedBroadcast")}</h2>
                <p className="text-sm text-muted-foreground">
                  {tab === "received" && <>{partyLine(open)}{" • "}</>}<span dir="ltr">{open.date}</span>
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="absolute end-0 top-2 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                  aria-label={t("broadcast.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-4">
                {tab === "sent" && !!open.members?.length && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.members")} ({open.members.length})</p>
                    <div className="rounded-2xl bg-muted/40 divide-y divide-border/60">
                      {open.members.map((m) => (
                        <div key={m.code} className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm">
                          <span className="text-foreground truncate">{m.name}</span>
                          <span className="text-xs text-muted-foreground" dir="ltr">{m.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {open.message && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.message")}</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{open.message}</p>
                  </div>
                )}
                {!!open.documents?.length && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.documents")}</p>
                    <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
                      {open.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                          {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                          <span className="flex-1 text-sm text-foreground truncate" dir="ltr">{doc.name}</span>
                          <button className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label={t("broadcast.previewFile")}>
                            <Eye className="w-4 h-4 text-sky-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!!open.voiceSeconds && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.voiceNote")}</p>
                    <div className="rounded-2xl bg-muted/40 p-3"><BroadcastVoiceNote seconds={open.voiceSeconds} /></div>
                  </div>
                )}
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Broadcast;
