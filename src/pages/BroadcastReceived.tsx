import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import BroadcastVoiceNote from "@/components/BroadcastVoiceNote";
import BroadcastDocPreview from "@/components/BroadcastDocPreview";
import { Calendar, Eye, FileText, IdCard, Image as ImageIcon, LucideIcon, Mic, Users } from "lucide-react";
import { BroadcastDoc, BroadcastMessage, getReceivedBroadcasts, getSentBroadcasts, markBroadcastRead } from "@/data/broadcasts";

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

// One broadcast in a list: sender (or, for Sent, the "To" line), date, two lines of the message and
// File / Voice chips. Shared by the Sent and Received lists.
export const ReceivedBroadcastCard = ({ b, onClick, title, extra, icon: Icon, inset }: { b: BroadcastMessage; onClick: () => void; title?: string; extra?: string; icon?: LucideIcon; inset?: boolean }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      // inset: same card on a muted tile, for use inside another card (the Home Broadcast widget).
      className={inset
        ? "w-full text-start bg-muted/40 rounded-xl p-3"
        : "w-full text-start bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-4"}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-foreground flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{title ?? b.from}</span>
          {extra && <span className="shrink-0 text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5" dir="ltr">{extra}</span>}
          {b.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-label={t("broadcast.unread")} />}
        </p>
      </div>
      {b.message && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{b.message}</p>}
      {/* Footer: File / Voice chips at the start, date and time at the end — keeps the header to the name only. */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!!b.documents?.length && (
            <span className="h-6 px-2.5 rounded-full border border-primary/40 text-primary text-[11px] font-medium flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />{t("broadcast.file")}{b.documents.length > 1 && <span dir="ltr">({b.documents.length})</span>}
            </span>
          )}
          {!!b.voiceSeconds && (
            <span className="h-6 px-2.5 rounded-full border border-primary/40 text-primary text-[11px] font-medium flex items-center gap-1">
              <Mic className="w-3.5 h-3.5" />{t("broadcast.voice")}
            </span>
          )}
        </div>
        <BroadcastDate date={b.date} />
      </div>
    </button>
  );
};

// Received Broadcast list (Home → Broadcast widget → Received).
export const BroadcastReceivedList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // ?filter=unread (from the Home widget's Unread counter) lists only messages not opened yet.
  const onlyUnread = useSearchParams()[0].get("filter") === "unread";
  const list = getReceivedBroadcasts().filter((b) => !onlyUnread || b.unread);
  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title={onlyUnread ? t("broadcast.unreadBroadcast") : t("broadcast.receivedBroadcast")} showBack onBackClick={() => navigate("/")} />
      <div className="px-4 space-y-3">
        {list.map((b) => (
          <ReceivedBroadcastCard key={b.id} b={b} onClick={() => navigate(`/broadcast/received/${b.id}`, { state: { fromList: true } })} />
        ))}
        {list.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">{onlyUnread ? t("broadcast.noUnread") : t("broadcast.empty")}</p>}
      </div>
    </div>
  );
};

// One received broadcast: sender, message, documents and voice note. Opening it marks it read.
export const BroadcastReceivedDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fromList = !!(useLocation().state as { fromList?: boolean } | null)?.fromList;
  const { id } = useParams();
  const [preview, setPreview] = useState<BroadcastDoc | null>(null);
  const b = getReceivedBroadcasts().find((x) => x.id === id);

  useEffect(() => {
    if (id) markBroadcastRead(id);
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Back always lands on the Received list: step back to it when that is where we came from, else open it. */}
      <AppHeader title={t("broadcast.received")} showBack onBackClick={() => (fromList ? navigate(-1) : navigate("/broadcast?tab=received", { replace: true }))} />
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
                    <button onClick={() => setPreview(doc)} className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label={t("broadcast.previewFile")}>
                      <Eye className="w-4 h-4 text-sky-500" />
                    </button>
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
      <BroadcastDocPreview doc={preview} onClose={() => setPreview(null)} />
    </div>
  );
};

const PREVIEW_MEMBERS = 3;

// One sent broadcast as its own page (opened from a Sent card): when it went out, who it went to,
// the message, documents and voice note.
export const BroadcastSentDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fromList = !!(useLocation().state as { fromList?: boolean } | null)?.fromList;
  const { id } = useParams();
  const [preview, setPreview] = useState<BroadcastDoc | null>(null);
  const b = getSentBroadcasts().find((x) => x.id === id);
  const [showAll, setShowAll] = useState(false);
  const members = b?.members ?? [];
  const shown = showAll ? members : members.slice(0, PREVIEW_MEMBERS);

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Back always lands on the Sent list. */}
      <AppHeader title={t("broadcast.sent")} showBack onBackClick={() => (fromList ? navigate(-1) : navigate("/broadcast?tab=sent", { replace: true }))} />
      {!b ? (
        <p className="text-center text-sm text-muted-foreground py-10">{t("broadcast.notFound")}</p>
      ) : (
        <div className="px-4 space-y-5">
          {/* "Sent to N members" summary card hidden per request — kept for when it comes back.
          <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{t("broadcast.sentToMembers", { count: members.length })}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /><span dir="ltr">{b.date}</span></p>
            </div>
          </div> */}

          {members.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{t("broadcast.members")} <span className="text-muted-foreground">({members.length})</span></p>
                {members.length > PREVIEW_MEMBERS && (
                  <button onClick={() => setShowAll((v) => !v)} className="text-link text-sm font-medium">
                    {showAll ? t("broadcast.showLess") : t("broadcast.seeAll")}
                  </button>
                )}
              </div>
              <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-3 space-y-2">
                {shown.map((m) => (
                  <div key={m.code} className="rounded-xl bg-muted/40 px-4 py-3">
                    <p className="font-medium text-foreground truncate">{m.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><IdCard className="w-3.5 h-3.5" /><span dir="ltr">{m.code}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <button onClick={() => setPreview(doc)} className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label={t("broadcast.previewFile")}>
                      <Eye className="w-4 h-4 text-sky-500" />
                    </button>
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
      <BroadcastDocPreview doc={preview} onClose={() => setPreview(null)} />
    </div>
  );
};
