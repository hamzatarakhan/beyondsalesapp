import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Calendar, Plus, Users, User, X } from "lucide-react";
import { BroadcastMessage, getReceivedBroadcasts, getSentBroadcasts, markBroadcastRead } from "@/data/broadcasts";

type Tab = "sent" | "received";

// Sent and Received broadcasts, one page with a tab switch (opened from the Home Broadcast widget).
const Broadcast = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "received" ? "received" : "sent";
  const [open, setOpen] = useState<BroadcastMessage | null>(null);
  const list = tab === "sent" ? getSentBroadcasts() : getReceivedBroadcasts();

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

      <div className="px-4 mt-4 space-y-3">
        {list.map((b) => (
          <button
            key={b.id}
            onClick={() => openItem(b)}
            className="w-full text-start bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] overflow-hidden flex"
          >
            <span className="w-1.5 shrink-0 bg-primary" />
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">{b.title}</p>
                {b.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-label={t("broadcast.unread")} />}
              </div>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{b.message}</p>
              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  {tab === "sent" ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {tab === "sent" ? `${t("broadcast.to")}: ${b.party}` : `${t("broadcast.from")}: ${b.party}`}
                </p>
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span dir="ltr">{b.date}</span></p>
              </div>
            </div>
          </button>
        ))}
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">{t("broadcast.empty")}</p>
        )}
      </div>

      <button
        onClick={() => navigate("/broadcast/new")}
        className="fixed bottom-6 right-4 rtl:right-auto rtl:left-4 h-12 px-5 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> {t("broadcast.newBroadcast")}
      </button>

      <Drawer open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DrawerContent className="px-4 pb-8">
          {open && (
            <>
              <div className="relative pt-2 pb-4 pe-10">
                <h2 className="text-lg font-semibold text-foreground">{open.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {tab === "sent" ? `${t("broadcast.to")}: ${open.party}` : `${t("broadcast.from")}: ${open.party}`}
                  {" • "}<span dir="ltr">{open.date}</span>
                </p>
                <button
                  onClick={() => setOpen(null)}
                  className="absolute end-0 top-2 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                  aria-label={t("broadcast.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-line">{open.message}</p>
              {tab === "sent" && open.recipients != null && (
                <p className="mt-4 text-sm text-muted-foreground">{t("broadcast.recipients", { count: open.recipients })}</p>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Broadcast;
