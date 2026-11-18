import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { BROADCAST_MEMBERS, addSentBroadcast } from "@/data/broadcasts";

const ALL = "all";

// Compose a broadcast to all members or one member (Home → Broadcast widget → Broadcast).
const BroadcastNew = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [to, setTo] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const canSend = to && title.trim() && message.trim();

  const send = () => {
    addSentBroadcast({
      title: title.trim(),
      message: message.trim(),
      party: to === ALL ? t("broadcast.allMembers") : to,
      recipients: to === ALL ? BROADCAST_MEMBERS.length : 1,
    });
    setSuccess(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title={t("broadcast.newBroadcast")} showBack />

      <div className="px-4 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t("broadcast.sendTo")} <span className="text-primary">*</span>
          </label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-border/60 text-base">
              <SelectValue placeholder={t("broadcast.selectRecipients")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("broadcast.allMembers")}</SelectItem>
              {BROADCAST_MEMBERS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t("broadcast.subject")} <span className="text-primary">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder={t("broadcast.subjectPlaceholder")}
            className="w-full h-12 rounded-xl bg-card border border-border/60 px-4 text-base outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t("broadcast.message")} <span className="text-primary">*</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={500}
            placeholder={t("broadcast.messagePlaceholder")}
            className="w-full rounded-2xl bg-card border border-border/60 p-4 text-base outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground text-end" dir="ltr">{message.length}/500</p>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur px-4 py-4 border-t border-border/60">
        <button
          disabled={!canSend}
          onClick={send}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-40"
        >
          {t("broadcast.send")}
        </button>
      </div>

      <Dialog open={success} onOpenChange={(v) => { if (!v) navigate("/broadcast?tab=sent", { replace: true }); }}>
        <DialogContent className="rounded-2xl max-w-[320px] text-center">
          <div className="flex flex-col items-center gap-3 pt-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">{t("broadcast.sentTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("broadcast.sentBody")}</p>
            <button
              onClick={() => navigate("/broadcast?tab=sent", { replace: true })}
              className="mt-2 w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              {t("broadcast.goToSent")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BroadcastNew;
