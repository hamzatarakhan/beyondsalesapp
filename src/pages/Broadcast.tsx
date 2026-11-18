import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import BroadcastVoiceNote from "@/components/BroadcastVoiceNote";
import { ReceivedBroadcastCard } from "@/pages/BroadcastReceived";
import { Calendar, Eye, FileText, Image as ImageIcon, Mic, Paperclip, Plus, Users, User, X } from "lucide-react";
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

      <div className="px-4 mt-4 space-y-3">
        {list.map((b) => tab === "received" ? (
          <ReceivedBroadcastCard key={b.id} b={b} onClick={() => navigate(`/broadcast/received/${b.id}`)} />
        ) : (
          <button
            key={b.id}
            onClick={() => openItem(b)}
            className="w-full text-start bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] overflow-hidden flex"
          >
            <span className="w-1.5 shrink-0 bg-primary" />
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground flex items-center gap-2 min-w-0">
                  {tab === "sent" ? <Users className="w-4 h-4 shrink-0" /> : <User className="w-4 h-4 shrink-0" />}
                  <span className="truncate">{partyLine(b)}</span>
                </p>
                {b.unread && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-label={t("broadcast.unread")} />}
              </div>
              {b.message && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{b.message}</p>}
              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {(!!b.documents?.length || !!b.voiceSeconds) && (
                  <p className="flex items-center gap-4">
                    {!!b.documents?.length && <span className="flex items-center gap-1.5"><Paperclip className="w-4 h-4" />{t("broadcast.filesCount", { count: b.documents.length })}</span>}
                    {!!b.voiceSeconds && <span className="flex items-center gap-1.5"><Mic className="w-4 h-4" />{t("broadcast.voiceNote")}</span>}
                  </p>
                )}
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
