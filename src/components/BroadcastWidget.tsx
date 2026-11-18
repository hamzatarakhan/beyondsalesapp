import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, FileText, Inbox, Mic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BroadcastMessage, CAN_SEND_BROADCAST, getReceivedBroadcasts } from "@/data/broadcasts";

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// "17 Nov 2026 - 9:00 AM" → "17 Nov · 9:00 AM" (the year is noise on Home).
const shortDate = (date: string) => {
  const [d, tm] = date.split(" - ");
  const dayMonth = d.split(" ").slice(0, 2).join(" ");
  return tm ? `${dayMonth} · ${tm}` : dayMonth;
};

// Home Broadcast widget: the two latest received messages, See all, and New Broadcast for users allowed to send.
const BroadcastWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const received = getReceivedBroadcasts();
  const unread = received.filter((b) => b.unread).length;
  const latest = received.slice(0, 2);

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            {t("home.catBroadcast")}
            {/* "N new" pill hidden per request — kept for when it comes back.
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                {t("home.broadcastWidget.newCount", { count: unread })}
              </span>
            )} */}
          </h3>
          <button onClick={() => navigate("/broadcast?tab=received")} className="flex items-center gap-1 text-link text-sm font-medium">
            {t("home.broadcastWidget.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="mb-3">
          {latest.length === 0 ? (
            <div className="rounded-xl bg-muted/40 py-5 px-4 flex flex-col items-center gap-1.5 text-center">
              <Inbox className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{t("home.broadcastWidget.emptyTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("home.broadcastWidget.emptyHint")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {latest.map((b: BroadcastMessage) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/broadcast/received/${b.id}`)}
                  className="w-full flex items-start gap-3 text-start py-3 first:pt-0 last:pb-0"
                >
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {initials(b.from ?? "")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm text-foreground truncate", b.unread ? "font-semibold" : "font-medium")}>{b.from}</p>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap" dir="ltr">{shortDate(b.date)}</span>
                    </div>
                    <div className="mt-0.5 flex items-start gap-2">
                      <p className="flex-1 text-xs text-muted-foreground truncate">{b.message}</p>
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
              ))}
            </div>
          )}
        </div>

        {unread === 0 && latest.length > 0 && (
          <p className="mb-3 text-xs text-muted-foreground text-center">{t("home.broadcastWidget.allCaughtUp")}</p>
        )}

        {CAN_SEND_BROADCAST && (
          <button
            onClick={() => navigate("/broadcast/new")}
            className="w-full py-3 rounded-full border-[0.5px] border-primary/10 bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> {t("home.broadcastWidget.newBroadcast")}
          </button>
        )}
      </div>
    </div>
  );
};

export default BroadcastWidget;
