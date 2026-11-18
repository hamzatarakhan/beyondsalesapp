import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Inbox, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAN_SEND_BROADCAST, getReceivedBroadcasts, getSentBroadcasts } from "@/data/broadcasts";

// Home Broadcast widget: Sent / Received counters, each opening its own list,
// See all, and New Broadcast for users allowed to send.
const BroadcastWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sent = getSentBroadcasts().length;
  const received = getReceivedBroadcasts();

  const stats = [
    { key: "sent", label: t("home.broadcastWidget.sent"), count: sent, icon: Send, path: "/broadcast?tab=sent" },
    { key: "received", label: t("home.broadcastWidget.received"), count: received.length, icon: Inbox, path: "/broadcast?tab=received" },
    // Unread counter hidden per request — kept for when it comes back.
    // { key: "unread", label: t("home.broadcastWidget.unread"), count: unread, icon: Mail, path: "/broadcast/received?filter=unread" },
  ];

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{t("home.catBroadcast")}</h3>
          <button onClick={() => navigate("/broadcast?tab=received")} className="flex items-center gap-1 text-link text-sm font-medium">
            {t("home.broadcastWidget.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {stats.map((s) => {
            // Unread stands out only while there is something unread.
            const hot = s.key === "unread" && s.count > 0;
            return (
              <button
                key={s.key}
                onClick={() => navigate(s.path)}
                className={cn(
                  "rounded-xl py-3 flex flex-col items-center gap-1 transition-colors active:scale-[0.98]",
                  hot ? "bg-primary/10" : "bg-muted/40 hover:bg-muted/70",
                )}
              >
                <s.icon className={cn("w-5 h-5", hot ? "text-primary" : "text-amber-600 dark:text-amber-300")} />
                <p className={cn("text-xl font-bold leading-tight", hot ? "text-primary" : "text-foreground")}>{s.count}</p>
                <span className={cn("text-[11px] font-medium", hot ? "text-primary" : "text-muted-foreground")}>{s.label}</span>
              </button>
            );
          })}
        </div>

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
