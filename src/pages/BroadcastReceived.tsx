import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import BroadcastVoiceNote from "@/components/BroadcastVoiceNote";
import { FileText, Image as ImageIcon, Mic } from "lucide-react";
import { BroadcastMessage, getReceivedBroadcasts, markBroadcastRead } from "@/data/broadcasts";

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// "17 Nov 2026 - 9:00 AM" → date and time shown apart, split by a thin divider.
export const BroadcastDate = ({ date }: { date: string }) => {
  const [d, tm] = date.split(" - ");
  return (
    <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5" dir="ltr">
      {d}{tm && <><span className="w-px h-3 bg-border" />{tm}</>}
    </span>
  );
};

// One received broadcast in a list: sender, date, two lines of the message and File / Voice chips.
export const ReceivedBroadcastCard = ({ b, onClick }: { b: BroadcastMessage; onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="w-full text-start bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-foreground flex items-center gap-2 min-w-0">
          <span className="truncate">{b.from}</span>
          {b.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label={t("broadcast.unread")} />}
        </p>
        <BroadcastDate date={b.date} />
      </div>
      {b.message && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{b.message}</p>}
      {(!!b.documents?.length || !!b.voiceSeconds) && (
        <div className="mt-3 flex items-center gap-2">
          {!!b.documents?.length && (
            <span className="h-6 px-2.5 rounded-full border border-primary/40 text-primary text-[11px] font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />{t("broadcast.file")}
            </span>
          )}
          {!!b.voiceSeconds && (
            <span className="h-6 px-2.5 rounded-full border border-primary/40 text-primary text-[11px] font-medium flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" />{t("broadcast.voice")}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

// Received Broadcast list (Home → Broadcast widget → Received).
export const BroadcastReceivedList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const list = getReceivedBroadcasts();
  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t("broadcast.receivedBroadcast")} showBack onBackClick={() => navigate("/")} />
      <div className="px-4 space-y-3">
        {list.map((b) => (
          <ReceivedBroadcastCard key={b.id} b={b} onClick={() => navigate(`/broadcast/received/${b.id}`)} />
        ))}
        {list.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">{t("broadcast.empty")}</p>}
      </div>
    </div>
  );
};

// One received broadcast: sender, message, documents and voice note. Opening it marks it read.
export const BroadcastReceivedDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const b = getReceivedBroadcasts().find((x) => x.id === id);

  useEffect(() => {
    if (id) markBroadcastRead(id);
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={t("broadcast.received")} showBack />
      {!b ? (
        <p className="text-center text-sm text-muted-foreground py-10">{t("broadcast.notFound")}</p>
      ) : (
        <div className="px-4 space-y-5">
          <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {initials(b.from ?? "")}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{b.from}</p>
              <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">{b.date}</p>
            </div>
          </div>

          {b.message && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.message")}</p>
              <div className="rounded-2xl bg-muted/50 border border-border/60 p-4 text-sm text-foreground whitespace-pre-line">{b.message}</div>
            </div>
          )}

          {!!b.documents?.length && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.documents")}</p>
              <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
                {b.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                    {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                    <span className="flex-1 text-sm text-foreground truncate" dir="ltr">{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!!b.voiceSeconds && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("broadcast.voiceNote")}</p>
              <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-4">
                <BroadcastVoiceNote seconds={b.voiceSeconds} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
