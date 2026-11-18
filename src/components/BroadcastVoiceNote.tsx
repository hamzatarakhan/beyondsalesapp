import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVoice } from "@/data/broadcasts";

// Fixed waveform shape so the bars don't jump between renders.
const BARS = [6, 12, 18, 10, 22, 14, 8, 16, 24, 12, 6, 18, 20, 10, 14, 8, 22, 16, 10, 6, 12, 18, 8, 14];

// Recorded voice note: play/pause, waveform with progress, length, and an optional delete.
const BroadcastVoiceNote = ({ seconds, onDelete }: { seconds: number; onDelete?: () => void }) => {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= seconds) { setPlaying(false); return 0; }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [playing, seconds]);

  const progress = playing || elapsed ? elapsed / seconds : 0;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
        aria-label={playing ? t("broadcast.pause") : t("broadcast.play")}
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ms-0.5 rtl:-scale-x-100" />}
      </button>
      <div className="flex-1 flex items-center justify-between gap-[2px] h-8" dir="ltr">
        {BARS.map((h, i) => (
          <span
            key={i}
            style={{ height: h }}
            className={cn("w-[3px] rounded-full", i / BARS.length < progress ? "bg-primary" : "bg-muted-foreground/40")}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">{formatVoice(playing || elapsed ? elapsed : seconds)}</span>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0"
          aria-label={t("broadcast.deleteVoice")}
        >
          <Trash2 className="w-4 h-4 text-primary" />
        </button>
      )}
    </div>
  );
};

export default BroadcastVoiceNote;
