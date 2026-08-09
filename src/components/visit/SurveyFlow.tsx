import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Image as ImageIcon, Plus, User, AlertCircle, XOctagon, CheckCircle2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type QType = "checkbox" | "radio" | "select" | "text" | "upload";
interface Question { q: string; type: QType; options?: string[] }

const QUESTIONS: Question[] = [
  { q: "Activation Tools Available ?", type: "checkbox", options: ["Value", "Value", "Value", "Value"] },
  { q: "Activation Tools Working Status ?", type: "select", options: ["Working", "Partially Working", "Not Working"] },
  { q: "Activation Issue Remarks ?", type: "text" },
  { q: "Uniform Compliance ?", type: "select", options: ["Compliant", "Non Compliant"] },
  { q: "Uniform Condition ?", type: "select", options: ["Good", "Average", "Poor"] },
  { q: "Branding Types ?", type: "checkbox", options: ["Value", "Value", "Value", "Value"] },
  { q: "Training Required ?", type: "radio", options: ["Label", "Label"] },
  { q: "Location Photo Upload", type: "upload" },
];
const TOTAL = QUESTIONS.length;
const pad = (n: number) => String(n).padStart(2, "0");

interface Props {
  title?: string;
  onBack: () => void;
  onComplete: () => void;
}

const SurveyFlow = ({ title = "Survey Title", onBack, onComplete }: Props) => {
  const [stage, setStage] = useState<"intro" | "question" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[] | string>>({});
  const [confirm, setConfirm] = useState<null | "submit" | "early">(null);

  const q = QUESTIONS[idx];
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  const toggleMulti = (v: string, i: number) => {
    setAnswers((p) => {
      const cur = (p[idx] as string[]) ?? [];
      const key = `${v}-${i}`;
      return { ...p, [idx]: cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key] };
    });
  };

  /* -------- intro -------- */
  if (stage === "intro") {
    return (
      <div className="mobile-container bg-background h-screen overflow-y-auto scrollbar-hide flex flex-col pb-6">
        <AppHeader title={title} showBack onBackClick={onBack} />
        <div className="px-4 flex-1">
          <div className="relative">
            <div className="h-52 rounded-2xl bg-muted flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-background" />
            </div>
            <div className="absolute -bottom-6 end-4 w-14 h-14 rounded-full bg-card border-4 border-background flex items-center justify-center text-sm font-semibold">
              <span className="text-foreground">0</span><span className="text-muted-foreground">/{QUESTIONS.length}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4 mt-3">
            <p className="text-sm text-muted-foreground">
              Complete this survey during your visit. Capture activation tools, branding and stock observations so the dealer scorecard stays up to date.
            </p>
            <div className="mt-4 divide-y divide-border/60">
              {[{ icon: CalendarDays, l: "Visit Date", v: "22, Dec, 2023" }, { icon: User, l: "Surveyed By", v: "Ahmad Hassan" }].map(({ icon: Icon, l, v }) => (
                <div key={l} className="py-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{l}</p>
                    <p className="text-xs text-muted-foreground">{v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 pt-4">
          <button onClick={() => { setStage("question"); setIdx(0); }} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Start</button>
        </div>
      </div>
    );
  }

  /* -------- result -------- */
  if (stage === "result") {
    return (
      <div className="mobile-container bg-background h-screen overflow-y-auto scrollbar-hide pb-28">
        <AppHeader title="Survey Result" showBack onBackClick={() => setStage("question")} />
        <div className="px-4">
          <div className="text-center py-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 dark:text-emerald-300" strokeWidth={1.5} />
            <p className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-300">Survey Completed</p>
            <p className="text-sm text-muted-foreground">Thank you for completing the survey! Your participation is greatly appreciated</p>
          </div>
          <div className="space-y-3 mt-3">
            {QUESTIONS.map((qq, i) => {
              const a = answers[i];
              return (
                <div key={i} className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
                  <p className="text-sm"><span className="text-primary font-semibold">{pad(i + 1)}</span><span className="text-muted-foreground">/{TOTAL}</span></p>
                  <p className="text-sm font-semibold text-foreground mt-1 mb-3">{qq.q}</p>
                  {qq.type === "checkbox" || qq.type === "radio" ? (
                    <div className="divide-y divide-border/60">
                      {(qq.options ?? []).map((o, oi) => {
                        const on = Array.isArray(a) ? a.includes(`${o}-${oi}`) : a === `${o}-${oi}`;
                        return (
                          <div key={oi} className="py-2.5 flex items-center gap-3">
                            <span className={`w-5 h-5 ${qq.type === "radio" ? "rounded-full" : "rounded"} border-2 flex items-center justify-center ${on ? "bg-primary border-primary" : "border-border"}`}>
                              {on && <span className="w-2 h-2 rounded-full bg-primary-foreground" />}
                            </span>
                            <span className={`text-sm ${on ? "text-foreground" : "text-muted-foreground"}`}>{o}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">{(a as string) || "Value"}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={() => setConfirm("submit")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Submit</button>
        </div>
        <ConfirmSheet state={confirm} onClose={() => setConfirm(null)} onSubmit={onComplete} />
      </div>
    );
  }

  /* -------- question -------- */
  const value = answers[idx];
  return (
    <div className="mobile-container bg-background h-screen overflow-y-auto scrollbar-hide flex flex-col pb-6">
      <AppHeader title={title} showBack onBackClick={() => (idx === 0 ? setStage("intro") : setIdx(idx - 1))} />
      <div className="px-4 flex-1">
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
          <p className="text-sm"><span className="text-primary font-semibold">{pad(idx + 1)}</span><span className="text-muted-foreground">/{TOTAL}</span></p>
          <p className="text-base font-semibold text-foreground mt-1 mb-3">{q.q}</p>

          {(q.type === "checkbox" || q.type === "radio") && (
            <div className="divide-y divide-border/60">
              {(q.options ?? []).map((o, oi) => {
                const key = `${o}-${oi}`;
                const on = q.type === "checkbox" ? ((value as string[]) ?? []).includes(key) : value === key;
                return (
                  <button
                    key={oi}
                    onClick={() => (q.type === "checkbox" ? toggleMulti(o, oi) : setAnswers((p) => ({ ...p, [idx]: key })))}
                    className="w-full py-3 flex items-center gap-3 text-start"
                  >
                    <span className={`w-5 h-5 ${q.type === "radio" ? "rounded-full" : "rounded"} border-2 flex items-center justify-center ${on ? "bg-primary border-primary" : "border-primary/50"}`}>
                      {on && <span className={`${q.type === "radio" ? "w-2 h-2 rounded-full" : "w-2.5 h-2.5 rounded-[2px]"} bg-primary-foreground`} />}
                    </span>
                    <span className="text-sm text-foreground">{o}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "select" && (
            <div className="relative">
              <select
                value={(value as string) ?? ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [idx]: e.target.value }))}
                className="w-full h-12 appearance-none rounded-xl bg-card border border-border px-4 pe-10 text-[16px] text-foreground outline-none focus:border-primary"
              >
                <option value="" disabled>Enter your answer</option>
                {(q.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="w-5 h-5 text-muted-foreground absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {q.type === "text" && (
            <textarea
              value={(value as string) ?? ""}
              onChange={(e) => setAnswers((p) => ({ ...p, [idx]: e.target.value }))}
              placeholder="Enter your answer"
              rows={3}
              className="w-full rounded-xl bg-card border border-border p-4 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
            />
          )}

          {q.type === "upload" && (
            <button
              onClick={() => setAnswers((p) => ({ ...p, [idx]: "location-photo.jpg" }))}
              className="w-full rounded-xl border border-dashed border-border py-8 flex flex-col items-center gap-2 bg-muted/30"
            >
              <span className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </span>
              <span className="text-sm text-muted-foreground">{(value as string) || "Upload your files here"}</span>
            </button>
          )}
        </div>
      </div>
      <div className="px-4 pt-4">
        <button
          onClick={() => (idx + 1 < QUESTIONS.length ? setIdx(idx + 1) : setConfirm(answered < QUESTIONS.length ? "early" : "submit"))}
          className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
        >
          {idx + 1 < QUESTIONS.length ? "Next" : "Finish"}
        </button>
      </div>
      <ConfirmSheet state={confirm} onClose={() => setConfirm(null)} onSubmit={() => { setConfirm(null); setStage("result"); }} />
    </div>
  );
};

const ConfirmSheet = ({ state, onClose, onSubmit }: { state: null | "submit" | "early"; onClose: () => void; onSubmit: () => void }) => (
  <Drawer open={!!state} onOpenChange={(o) => !o && onClose()}>
    <DrawerContent className="bg-card rounded-t-3xl">
      <DrawerHeader className="text-center pt-4 pb-2">
        <DrawerTitle className="text-lg font-semibold">Confirmation Message</DrawerTitle>
      </DrawerHeader>
      <div className="px-4 pb-8 text-center">
        {state === "early" ? (
          <>
            <XOctagon className="w-12 h-12 mx-auto text-primary" strokeWidth={1.5} />
            <p className="mt-2 text-base font-semibold text-primary">The time has not run out.</p>
            <p className="text-sm text-muted-foreground">Are you sure you want to submit this survey ?</p>
          </>
        ) : (
          <>
            <AlertCircle className="w-12 h-12 mx-auto text-sky-600 dark:text-sky-300" strokeWidth={1.5} />
            <p className="mt-2 text-base font-semibold text-sky-600 dark:text-sky-300">Submit Request</p>
            <p className="text-sm text-muted-foreground">Do you want to submit the survey ?</p>
          </>
        )}
        <button onClick={onSubmit} className="w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Submit</button>
        <button onClick={onClose} className="w-full mt-3 py-2 text-primary font-semibold text-sm">Cancel</button>
      </div>
    </DrawerContent>
  </Drawer>
);

export default SurveyFlow;
