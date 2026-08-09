import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarDays, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, Hash,
  MapPin, Network, Plus, QrCode, User, X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SurveyFlow from "@/components/visit/SurveyFlow";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";

/* ---------------- demo data (prototype only) ---------------- */
interface Member {
  id: string; name: string; channelType: string; code: string; parent: string;
  region: string; city: string; district: string;
}

// Ad-hoc visits are always a single member, identified by scanning their QR —
// the prototype just picks this one regardless of what's "scanned".
const SCANNED_MEMBER: Member = {
  id: "M-1", name: "Al Nakheel Telecom", channelType: "Modern Trade", code: "MT-1042",
  parent: "Riyadh Hub", region: "Riyadh", city: "Riyadh", district: "Al Nakheel",
};

const KPIS = [
  { name: "Gross Activations", trend: "Degrowth - 10", pct: 90, target: 300, achievement: "298.326", lm: "132.56", mtd: "25.13", lmtd: "213.21" },
  { name: "Recharge Value", trend: "Degrowth - 10", pct: 72, target: 500, achievement: "360.100", lm: "98.20", mtd: "40.05", lmtd: "180.44" },
];
const STOCK = [
  { label: "E- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" }, { label: "Router", qty: "10 PCS" },
];
const VISIT_PURPOSES = ["Merchandising Audit", "Stock Check", "Training", "Complaint Follow-up"];
const SURVEYS = ["Merchandising Survey", "Stock Survey", "Customer Feedback"];
const SURVEY_PURPOSES = ["Merchandising Audit", "Stock Check", "Training", "Complaint Follow-up"];

interface SurveyEntry {
  id: string;
  survey: string;
  purpose: string;
}

/* ---------------- small building blocks ---------------- */
const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="mb-4 last:mb-0">
    <p className="text-sm font-medium text-foreground mb-2">
      {label}
      {required && <span className="text-destructive ms-0.5">*</span>}
    </p>
    {children}
  </div>
);

const SelectRow = ({ value, placeholder, onClick }: { value?: string; placeholder: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full h-12 rounded-xl border border-border bg-card px-4 flex items-center justify-between text-start"
  >
    <span className={`text-sm truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>{value || placeholder}</span>
    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
  </button>
);

const MemberCard = ({ m }: { m: Member }) => (
  <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-start gap-3">
    <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <User className="w-5 h-5 text-primary" />
    </span>
    <div className="min-w-0">
      <p className="font-semibold text-foreground truncate">{m.name}</p>
      <div className="space-y-1.5 mt-1.5">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="w-3.5 h-3.5" />
          <span className="bg-muted/60 rounded px-1.5 py-0.5">{m.channelType}</span>
          <span>{m.code}</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Network className="w-3.5 h-3.5" /> {m.parent}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" /> {m.region}, {m.city}, {m.district}
        </p>
      </div>
    </div>
  </div>
);

const OptionPicker = ({ picker, onClose }: { picker: null | { title: string; options: string[]; value?: string; onPick: (v: string) => void }; onClose: () => void }) => (
  <Drawer open={!!picker} onOpenChange={(o) => !o && onClose()}>
    <DrawerContent className="bg-card rounded-t-3xl max-h-[80vh]">
      <button onClick={onClose} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
        <X className="w-4 h-4 text-foreground" />
      </button>
      <DrawerHeader className="text-center pt-6">
        <DrawerTitle className="text-lg font-semibold">{picker?.title}</DrawerTitle>
        <DrawerDescription className="text-xs text-muted-foreground">Select one option</DrawerDescription>
      </DrawerHeader>
      <div className="px-4 pb-8 overflow-y-auto scrollbar-hide">
        {picker?.options.map((o) => (
          <button
            key={o}
            onClick={() => { picker.onPick(o); onClose(); }}
            className={`w-full text-start px-4 py-3.5 rounded-xl mb-2 text-sm ${picker.value === o ? "bg-primary/10 text-primary font-semibold" : "bg-muted/40 text-foreground"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </DrawerContent>
  </Drawer>
);

const SurveyRow = ({ entry }: { entry: SurveyEntry }) => (
  <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3.5 flex items-center justify-between gap-2">
    <div className="min-w-0">
      <p className="text-sm font-semibold text-foreground truncate">{entry.survey}</p>
      <p className="text-xs text-muted-foreground">Fill Address</p>
    </div>
    <span className="flex items-center gap-2 shrink-0">
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        Performed
      </span>
      <ChevronRight className="w-4 h-4 text-muted-foreground rtl:-scale-x-100" />
    </span>
  </div>
);

/* ---------------- page ---------------- */
const AdHocVisit = () => {
  const navigate = useNavigate();

  const [view, setView] = useState<"qr" | "overview" | "details" | "survey" | "memberVisit">("qr");
  const [overviewTab, setOverviewTab] = useState<"kpi" | "stock">("kpi");
  const [openKpi, setOpenKpi] = useState(0);

  const [visitTitle, setVisitTitle] = useState("");
  const [visitPurpose, setVisitPurpose] = useState<string>();
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [showAllSurveys, setShowAllSurveys] = useState(false);

  const [newSurveyOpen, setNewSurveyOpen] = useState(false);
  const [draftSurvey, setDraftSurvey] = useState<string>();
  const [draftPurpose, setDraftPurpose] = useState<string>();
  const [pendingSurveyId, setPendingSurveyId] = useState<string | null>(null);

  const [picker, setPicker] = useState<null | { title: string; options: string[]; value?: string; onPick: (v: string) => void }>(null);

  const visitDateLabel = format(new Date(), "d MMM yyyy");

  const startNewSurvey = () => {
    setDraftSurvey(undefined);
    setDraftPurpose(undefined);
    setNewSurveyOpen(true);
  };

  const beginSurvey = () => {
    if (!draftSurvey) return;
    const id = `SV-${Date.now()}`;
    setSurveys((prev) => [...prev, { id, survey: draftSurvey, purpose: draftPurpose ?? "" }]);
    setPendingSurveyId(id);
    setNewSurveyOpen(false);
    setView("survey");
  };

  /* ---------- SURVEY (hands off to the shared survey flow) ---------- */
  if (view === "survey") {
    const active = surveys.find((s) => s.id === pendingSurveyId);
    return (
      <SurveyFlow
        title={active?.survey || "Survey Title"}
        onBack={() => {
          setSurveys((prev) => prev.filter((s) => s.id !== pendingSurveyId));
          setPendingSurveyId(null);
          setView("details");
        }}
        onComplete={() => {
          setPendingSurveyId(null);
          setView("details");
        }}
      />
    );
  }

  /* ---------- QR SCAN ---------- */
  if (view === "qr") {
    return (
      <div className="mobile-container bg-background h-screen overflow-hidden flex flex-col">
        <AppHeader title="Scan Member QR" showBack onBackClick={() => navigate("/visit-management")} />
        <div className="flex-1 px-4 pb-6 flex flex-col">
          <div className="flex-1 rounded-[32px] bg-neutral-800 border-[6px] border-neutral-900 relative overflow-hidden flex items-center justify-center">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-neutral-900 rounded-b-2xl" />
            <button onClick={() => setView("overview")} aria-label="Scan code" className="relative w-full aspect-square bg-white flex items-center justify-center">
              {[["top-0 start-0", "border-t-4 border-s-4 rounded-ts-xl"], ["top-0 end-0", "border-t-4 border-e-4"], ["bottom-0 start-0", "border-b-4 border-s-4"], ["bottom-0 end-0", "border-b-4 border-e-4"]].map(([pos, b]) => (
                <span key={pos} className={`absolute ${pos} w-12 h-12 border-primary ${b}`} />
              ))}
              <QrCode className="w-40 h-40 text-neutral-900" strokeWidth={1} />
            </button>
          </div>
          <button
            onClick={() => setView("overview")}
            className="w-full mt-5 py-3.5 rounded-full bg-card border border-border text-primary font-semibold text-sm"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  /* ---------- DEALER OVERVIEW ---------- */
  if (view === "overview") {
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="Dealer Overview" showBack onBackClick={() => setView("qr")} />
        <div className="px-4 space-y-4">
          <MemberCard m={SCANNED_MEMBER} />

          <div className="flex border-b border-border">
            {(["kpi", "stock"] as const).map((tb) => (
              <button
                key={tb}
                onClick={() => setOverviewTab(tb)}
                className={`flex-1 pb-2 text-sm font-semibold border-b-2 -mb-px ${overviewTab === tb ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
              >
                {tb === "kpi" ? "Performance" : "Stock"}
              </button>
            ))}
          </div>

          {overviewTab === "kpi" ? (
            <div className="space-y-3">
              {KPIS.map((k, i) => (
                <div key={k.name} className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] overflow-hidden">
                  <button onClick={() => setOpenKpi(openKpi === i ? -1 : i)} className="w-full bg-primary/10 px-4 py-3 flex items-start justify-between gap-2 text-start">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{k.name}</p>
                      <p className="text-[11px] text-muted-foreground">Update on : {visitDateLabel}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/15 text-primary shrink-0">{k.trend}</span>
                  </button>
                  {openKpi === i && (
                    <>
                      <div className="p-4 grid grid-cols-2 gap-3 items-center">
                        <div className="text-center">
                          <div className="relative w-24 h-24 mx-auto rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${k.pct * 3.6}deg, hsl(var(--muted)) 0deg)` }}>
                            <div className="absolute inset-[10px] rounded-full bg-card flex items-center justify-center text-sm font-semibold text-foreground">{k.pct}%</div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">Achievement / Target</p>
                        </div>
                        <div className="space-y-2">
                          {[["Target", k.target], ["Achievement", k.achievement]].map(([l, v]) => (
                            <div key={l as string} className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                              <p className="text-[11px] text-muted-foreground">{l}</p>
                              <p className="text-sm font-semibold text-foreground">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-4 pb-4 grid grid-cols-3 gap-2 text-center">
                        {[["LM", k.lm], ["MTD", k.mtd], ["LMTD", k.lmtd]].map(([l, v]) => (
                          <div key={l as string} className="rounded-xl bg-muted/40 px-2 py-2">
                            <p className="text-[11px] text-muted-foreground">{l}</p>
                            <p className="text-sm font-semibold text-foreground">{v}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] overflow-hidden">
              <p className="bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">Available Stock</p>
              <div className="p-4 grid grid-cols-3 gap-3">
                {STOCK.map((s, i) => (
                  <div key={i} className="rounded-xl border border-border/60 px-2 py-3 text-center">
                    <span className="w-10 h-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center mb-2 text-xs">📱</span>
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.qty}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={() => setView("details")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ---------- MEMBER VISIT (final summary) ---------- */
  if (view === "memberVisit") {
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="Member Visit" showBack onBackClick={() => navigate("/visit-management")} />
        <div className="px-4 space-y-3">
          {surveys.map((s) => <SurveyRow key={s.id} entry={s} />)}
          {surveys.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No surveys added yet</p>}
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={startNewSurvey} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            Add New Survey
          </button>
        </div>
        <NewSurveySheet
          open={newSurveyOpen}
          survey={draftSurvey}
          purpose={draftPurpose}
          onPickSurvey={() => setPicker({ title: "Survey", options: SURVEYS, value: draftSurvey, onPick: setDraftSurvey })}
          onPickPurpose={() => setPicker({ title: "Survey Purpose", options: SURVEY_PURPOSES, value: draftPurpose, onPick: setDraftPurpose })}
          onStart={beginSurvey}
          onCancel={() => setNewSurveyOpen(false)}
        />
        <OptionPicker picker={picker} onClose={() => setPicker(null)} />
      </div>
    );
  }

  /* ---------- VISIT DETAILS ---------- */
  const visibleSurveys = showAllSurveys ? surveys : surveys.slice(0, 3);
  return (
    <div className="mobile-container bg-background h-screen overflow-y-auto scrollbar-hide flex flex-col pb-8">
      <AppHeader title="Visit Details" showBack onBackClick={() => setView("overview")} />
      <div className="px-4 flex-1">
        <MemberCard m={SCANNED_MEMBER} />

        <div className="mt-4">
          <Field label="Visit Title">
            <input
              value={visitTitle}
              onChange={(e) => setVisitTitle(e.target.value)}
              placeholder="Placeholder"
              className="w-full h-12 rounded-xl bg-card border border-border px-4 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </Field>
          <Field label="Visit Purpose">
            <SelectRow
              placeholder="Select Visit Purpose"
              value={visitPurpose}
              onClick={() => setPicker({ title: "Visit Purpose", options: VISIT_PURPOSES, value: visitPurpose, onPick: setVisitPurpose })}
            />
          </Field>
          <Field label="Visit Date">
            <div className="w-full h-12 rounded-xl bg-muted/60 border border-border px-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{visitDateLabel}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            </div>
          </Field>

          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Survey</p>
            {surveys.length > 3 && (
              <button onClick={() => setShowAllSurveys((s) => !s)} className="flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-300">
                {showAllSurveys ? "Show Less" : "See All"} <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
              </button>
            )}
          </div>

          {surveys.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-6 flex flex-col items-center text-center gap-3">
              <span className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 text-primary" />
              </span>
              <p className="text-sm text-muted-foreground">Start creating a survey and continue working on it.</p>
              <button onClick={startNewSurvey} className="flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-300">
                Add Survey <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSurveys.map((s) => <SurveyRow key={s.id} entry={s} />)}
              <button
                onClick={startNewSurvey}
                className="w-full py-3 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add New Survey
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={() => setView("memberVisit")}
          disabled={surveys.length === 0}
          className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      <NewSurveySheet
        open={newSurveyOpen}
        survey={draftSurvey}
        purpose={draftPurpose}
        onPickSurvey={() => setPicker({ title: "Survey", options: SURVEYS, value: draftSurvey, onPick: setDraftSurvey })}
        onPickPurpose={() => setPicker({ title: "Survey Purpose", options: SURVEY_PURPOSES, value: draftPurpose, onPick: setDraftPurpose })}
        onStart={beginSurvey}
        onCancel={() => setNewSurveyOpen(false)}
      />
      <OptionPicker picker={picker} onClose={() => setPicker(null)} />
    </div>
  );
};

/* ---------- New Survey bottom sheet ---------- */
const NewSurveySheet = ({
  open, survey, purpose, onPickSurvey, onPickPurpose, onStart, onCancel,
}: {
  open: boolean;
  survey?: string;
  purpose?: string;
  onPickSurvey: () => void;
  onPickPurpose: () => void;
  onStart: () => void;
  onCancel: () => void;
}) => (
  <Drawer open={open} onOpenChange={(o) => !o && onCancel()}>
    <DrawerContent className="bg-card rounded-t-3xl">
      <button onClick={onCancel} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
        <X className="w-4 h-4 text-foreground" />
      </button>
      <DrawerHeader className="text-center pt-6">
        <DrawerTitle className="text-lg font-semibold">New Survey</DrawerTitle>
        <DrawerDescription className="sr-only">Pick a survey and its purpose to start filling it in</DrawerDescription>
      </DrawerHeader>
      <div className="px-4 pb-8">
        <Field label="Survey">
          <SelectRow placeholder="Select the survey" value={survey} onClick={onPickSurvey} />
        </Field>
        <Field label="Survey Purpose">
          <SelectRow placeholder="Select the purpose" value={purpose} onClick={onPickPurpose} />
        </Field>
        <button
          onClick={onStart}
          disabled={!survey}
          className="w-full mt-2 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Start
        </button>
        <button onClick={onCancel} className="w-full mt-3 py-2 text-primary font-semibold text-sm">
          Cancel
        </button>
      </div>
    </DrawerContent>
  </Drawer>
);

export default AdHocVisit;
