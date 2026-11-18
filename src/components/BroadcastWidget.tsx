import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, FileText, Inbox, Mic, Plus, Send, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { BroadcastMessage, CAN_SEND_BROADCAST, getReceivedBroadcasts, getSentBroadcasts } from "@/data/broadcasts";

// Home Broadcast widget, in three design options to compare (picked with the switch under the
// title, remembered on this device). Drop the switch and keep one layout once a design is chosen.
type Variant = 1 | 2 | 3;
const VARIANT_KEY = "home-broadcast-widget-option";

const readVariant = (): Variant => {
  try {
    const v = Number(localStorage.getItem(VARIANT_KEY));
    return v === 2 || v === 3 ? v : 1;
  } catch {
    return 1;
  }
};

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// "17 Nov 2026 - 9:00 AM" → "17 Nov · 9:00 AM" (the year is noise on Home).
const shortDate = (date: string) => {
  const [d, tm] = date.split(" - ");
  const dayMonth = d.split(" ").slice(0, 2).join(" ");
  return tm ? `${dayMonth} · ${tm}` : dayMonth;
};

const BroadcastWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [variant, setVariant] = useState<Variant>(readVariant);

  const sent = getSentBroadcasts();
  const received = getReceivedBroadcasts();
  const unread = received.filter((b) => b.unread).length;
  const latest = received.slice(0, 2);

  const pickVariant = (v: Variant) => {
    setVariant(v);
    try { localStorage.setItem(VARIANT_KEY, String(v)); } catch { /* preview-only preference */ }
  };

  const openMessage = (b: BroadcastMessage) => navigate(`/broadcast/received/${b.id}`);

  const seeAll = (
    <button onClick={() => navigate("/broadcast?tab=received")} className="flex items-center gap-1 text-link text-sm font-medium">
      {t("home.broadcastWidget.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
    </button>
  );

  const newBroadcastButton = CAN_SEND_BROADCAST && (
    <button
      onClick={() => navigate("/broadcast/new")}
      className="w-full py-3 rounded-full border-[0.5px] border-primary/10 bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1"
    >
      <Plus className="w-4 h-4" /> {t("home.broadcastWidget.newBroadcast")}
    </button>
  );

  // One received message as a row: initials, sender, time, preview, attachment hints, unread dot.
  const MessageRow = ({ b, lines = 1 }: { b: BroadcastMessage; lines?: 1 | 2 }) => (
    <button onClick={() => openMessage(b)} className="w-full flex items-start gap-3 text-start">
      <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
        {initials(b.from ?? "")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("text-sm truncate", b.unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>{b.from}</p>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap" dir="ltr">{shortDate(b.date)}</span>
        </div>
        <div className="mt-0.5 flex items-start gap-2">
          <p className={cn("flex-1 text-xs text-muted-foreground", lines === 1 ? "truncate" : "line-clamp-2")}>{b.message}</p>
          {b.unread && <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" aria-label={t("broadcast.unread")} />}
        </div>
        {(!!b.documents?.length || !!b.voiceSeconds) && (
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
            {!!b.documents?.length && <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{t("broadcast.file")}</span>}
            {!!b.voiceSeconds && <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5" />{t("broadcast.voice")}</span>}
          </div>
        )}
      </div>
    </button>
  );

  const emptyInbox = (
    <div className="rounded-xl bg-muted/40 py-5 px-4 flex flex-col items-center gap-1.5 text-center">
      <Inbox className="w-5 h-5 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">{t("home.broadcastWidget.emptyTitle")}</p>
      <p className="text-xs text-muted-foreground">{t("home.broadcastWidget.emptyHint")}</p>
    </div>
  );

  // Sent / Received / Unread counters. In option 2 each one is a link to its list.
  const stats = [
    { key: "sent", label: t("home.broadcastWidget.sent"), count: sent.length, icon: Send, path: "/broadcast?tab=sent" },
    { key: "received", label: t("home.broadcastWidget.received"), count: received.length, icon: Inbox, path: "/broadcast/received" },
    { key: "unread", label: t("home.broadcastWidget.unread"), count: unread, icon: Mail, path: "/broadcast/received?filter=unread" },
  ];

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {t("home.catBroadcast")}
            {variant === 3 && unread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                {t("home.broadcastWidget.newCount", { count: unread })}
              </span>
            )}
          </h3>
          {variant === 2 ? (
            CAN_SEND_BROADCAST && (
              <button
                onClick={() => navigate("/broadcast/new")}
                className="flex items-center gap-1 text-link text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> {t("home.broadcastWidget.new")}
              </button>
            )
          ) : seeAll}
        </div>

        {/* Design option switch — for comparing the three layouts only. */}
        <div className="mb-4 grid grid-cols-3 gap-1 p-1 rounded-full bg-muted/60" role="tablist" aria-label={t("home.broadcastWidget.designOption")}>
          {([1, 2, 3] as Variant[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={variant === v}
              onClick={() => pickVariant(v)}
              className={cn(
                "h-7 rounded-full text-xs font-medium transition-colors",
                variant === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {t("home.broadcastWidget.option", { n: v })}
            </button>
          ))}
        </div>

        {variant === 1 && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {stats.map((s) => (
                <div key={s.key} className="bg-muted/40 rounded-xl py-3 flex flex-col items-center gap-1">
                  <p className={cn("text-xl font-bold", s.key === "unread" && s.count > 0 ? "text-primary" : "text-foreground")}>{s.count}</p>
                  <span className="text-[11px] font-medium text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{t("home.broadcastWidget.latestMessage")}</p>
            <div className="mb-3">
              {latest[0] ? (
                <div className="rounded-xl border border-border/60 p-3"><MessageRow b={latest[0]} lines={2} /></div>
              ) : emptyInbox}
            </div>
            {newBroadcastButton}
          </>
        )}

        {variant === 2 && (
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => {
              const hot = s.key === "unread" && s.count > 0;
              return (
                <button
                  key={s.key}
                  onClick={() => navigate(s.path)}
                  className={cn(
                    "rounded-xl py-3 px-2 flex flex-col items-center gap-1 transition-colors active:scale-[0.98]",
                    hot ? "bg-primary/10" : "bg-muted/40 hover:bg-muted/70",
                  )}
                >
                  <s.icon className={cn("w-4 h-4", hot ? "text-primary" : "text-muted-foreground")} />
                  <p className={cn("text-lg font-bold leading-tight", hot ? "text-primary" : "text-foreground")}>{s.count}</p>
                  <span className={cn("text-[11px] font-medium", hot ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {variant === 3 && (
          <>
            <div className="mb-3">
              {latest.length === 0 ? emptyInbox : (
                <div className="divide-y divide-border/60">
                  {latest.map((b) => (
                    <div key={b.id} className="py-3 first:pt-0 last:pb-0"><MessageRow b={b} /></div>
                  ))}
                </div>
              )}
            </div>
            {unread === 0 && latest.length > 0 && (
              <p className="mb-3 text-xs text-muted-foreground text-center">{t("home.broadcastWidget.allCaughtUp")}</p>
            )}
            {newBroadcastButton}
          </>
        )}
      </div>
    </div>
  );
};

export default BroadcastWidget;
