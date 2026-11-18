import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Inbox, Plus } from "lucide-react";
import { ReceivedBroadcastCard } from "@/pages/BroadcastReceived";
import { BroadcastMessage, CAN_SEND_BROADCAST, getReceivedBroadcasts } from "@/data/broadcasts";

// Home Broadcast widget: the two latest received messages (same card as the See all list), See all, and New Broadcast for users allowed to send.
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
            <div className="space-y-2">
              {latest.map((b: BroadcastMessage) => (
                <ReceivedBroadcastCard key={b.id} b={b} inset onClick={() => navigate(`/broadcast/received/${b.id}`)} />
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
