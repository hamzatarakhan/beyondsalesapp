import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays, ChevronDown, ChevronRight, Eye, FileText, Hash, Image as ImageIcon,
  MapPin, Network, Plus, QrCode, User, X, CheckCircle2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";

/* ---------------- demo data (prototype only) ---------------- */
interface Member {
  id: string; name: string; channelType: string; code: string; parent: string;
  region: string; city: string; district: string;
}

const MEMBERS: Member[] = [
  { id: "M-1", name: "Al Nakheel Telecom", channelType: "Modern Trade", code: "MT-1042", parent: "Riyadh Hub", region: "Riyadh", city: "Riyadh", district: "Al Nakheel" },
  { id: "M-4", name: "Olaya Digital", channelType: "Modern Trade", code: "MT-1188", parent: "Riyadh Hub", region: "Riyadh", city: "Riyadh", district: "Al Olaya" },
  { id: "M-2", name: "Red Sea Mobile", channelType: "Retailer", code: "RT-2210", parent: "Jeddah Hub", region: "Makkah", city: "Jeddah", district: "Al Hamra" },
];

const KPIS = [
  { name: "Gross Activations", trend: "Degrowth - 10", pct: 90, target: 300, achievement: "298.326", lm: "132.56", mtd: "25.13", lmtd: "213.21" },
  { name: "Recharge Value", trend: "Degrowth - 10", pct: 72, target: 500, achievement: "360.100", lm: "98.20", mtd: "40.05", lmtd: "180.44" },
];
const STOCK = [
  { label: "E- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" }, { label: "E- SIM", qty: "10 PCS" },
  { label: "E- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" },
];
const PURPOSES = ["Merchandising Audit", "Stock Check", "Training", "Complaint Follow-up"];
const SURVEYS = ["Merchandising Survey", "Stock Survey", "Customer Feedback"];
const RESULTS = ["Passed", "Failed", "Rescheduled"];
const STEPS_OF_CALL = ["Merchandising Audit", "Stock Check", "Sales Pitch", "Training"];
const CANCEL_PURPOSES = ["Store Closed", "Dealer Unavailable", "Weather Conditions", "Rescheduled by Dealer", "Other"];

type VisitStatus = "Active" | "Pending" | "Missed" | "Canceled" | "Completed";
const VISIT_STATUS: Record<string, { name: string; status: VisitStatus }> = {
  "VST-1001": { name: "Riyadh North Route", status: "Pending" },
  "VST-1002": { name: "Jeddah Corniche Route", status: "Missed" },
  "VST-1003": { name: "Tahlia Dealers", status: "Completed" },
  "VST-1004": { name: "Dammam Central", status: "Canceled" },
  "VST-1005": { name: "Al Nakheel Plaza", status: "Active" },
};
const VISIT_STATUS_PILL: Record<VisitStatus, string> = {
  Active: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  Missed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  Canceled: "bg-muted text-muted-foreground",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

type ResultStatus = "Passed" | "Cancelled" | "Not Performed";

interface VisitResult {
  id: string; title: string; status: ResultStatus;
  purpose?: string; date?: string; survey?: string; result?: string;
}

const INITIAL_RESULTS: Record<string, VisitResult[]> = {
  "M-1": [{ id: "R-1", title: "Visit 1", status: "Passed", purpose: "Stock Check", date: "17 Aug 2024", survey: "Stock Survey", result: "Passed" }],
  "M-4": [{ id: "R-2", title: "Visit 1", status: "Cancelled", purpose: "Training", date: "17 Aug 2024", survey: "Merchandising Survey", result: "Rescheduled" }],
};

const STATUS_PILL: Record<ResultStatus, string> = {
  Passed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  Cancelled: "bg-muted text-muted-foreground",
  "Not Performed": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

/* ---------------- building blocks ---------------- */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4 last:mb-0">
    <p className="text-sm font-medium text-foreground mb-2">{label}</p>
    {children}
  </div>
);

const SelectRow = ({ value, placeholder, onClick, disabled }: { value?: string; placeholder: string; onClick?: () => void; disabled?: boolean }) => (
  <button
    onClick={disabled ? undefined : onClick}
    className={`w-full h-12 rounded-xl border border-border px-4 flex items-center justify-between text-start ${disabled ? "bg-muted/60" : "bg-card"}`}
  >
    <span className={`text-sm truncate ${value ? "text-foreground" : "text-muted-foreground"}`}>{value || placeholder}</span>
    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
  </button>
);

const MemberMeta = ({ m }: { m: Member }) => (
  <div className="space-y-1.5 mt-1.5">
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Hash className="w-3.5 h-3.5" />
      <span className="bg-muted/60 rounded px-1.5 py-0.5">{m.channelType}</span>
      <span>{m.code}</span>
    </p>
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Network className="w-3.5 h-3.5" /> {m.parent}
    </p>
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

/* ---------------- page ---------------- */
const VisitDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [view, setView] = useState<"visit" | "result" | "form" | "qr" | "overview">("visit");
  const [member, setMember] = useState<Member | null>(null);
  const [results, setResults] = useState<Record<string, VisitResult[]>>(INITIAL_RESULTS);
  const [openResult, setOpenResult] = useState<VisitResult | null>(null);
  const [draft, setDraft] = useState<VisitResult>({ id: "", title: "", status: "Not Performed", date: "17 Aug 2024" });

  const [picker, setPicker] = useState<null | { title: string; options: string[]; value?: string; onPick: (v: string) => void }>(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<"remark" | "document">("remark");
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelPurpose, setCancelPurpose] = useState("");
  const [overview, setOverview] = useState<Member | null>(null);
  const [overviewTab, setOverviewTab] = useState<"kpi" | "stock">("kpi");
  const [openKpi, setOpenKpi] = useState(0);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [showAllMembers, setShowAllMembers] = useState(false);

  const visit = useMemo(
    () => {
      const key = id ?? "VST-1005";
      const meta = VISIT_STATUS[key] ?? { name: "Al Nakheel Plaza", status: "Active" as VisitStatus };
      return { id: key, name: meta.name, type: "Planned Visit", assignee: "Ahmad Khaled", userType: "POS", steps: "Merchandising Audit", date: "03 Jun 2026", recurrence: "Monthly", status: meta.status };
    },
    [id],
  );

  const memberResults = member ? results[member.id] ?? [] : [];

  const saveDraft = () => {
    if (!member || !draft.title && !draft.purpose && !draft.survey && !draft.result) { setView("result"); return; }
    const entry: VisitResult = { ...draft, id: `R-${Date.now()}`, title: draft.title || `Visit ${(results[member.id]?.length ?? 0) + 1}`, status: (draft.result === "Passed" ? "Passed" : draft.result ? "Cancelled" : "Not Performed") };
    setResults((p) => ({ ...p, [member.id]: [...(p[member.id] ?? []), entry] }));
    setView("result");
  };

  /* ---------- DEALER OVERVIEW (full page, after scan) ---------- */
  if (view === "overview") {
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="Dealer Overview" showBack onBackClick={() => setView("qr")} />
        <div className="px-4">
          <div className="flex border-b border-border mb-4">
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
              {KPIS.map((k) => (
                <div key={k.name} className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] overflow-hidden">
                  <div className="bg-primary/10 px-4 py-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{k.name}</p>
                      <p className="text-[11px] text-muted-foreground">Update on : 2/5/2026</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/15 text-primary shrink-0">{k.trend}</span>
                  </div>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] overflow-hidden">
              <p className="bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">Available Stock</p>
              <div className="p-4 grid grid-cols-3 gap-3">
                {STOCK.slice(0, 3).map((s, i) => (
                  <div key={i} className="rounded-xl border border-border/60 px-2 py-3 text-center">
                    <span className="w-10 h-10 rounded-full bg-muted/60 mx-auto flex items-center justify-center mb-2 text-xs">{i === 2 ? "📶" : "📱"}</span>
                    <p className="text-sm font-semibold text-foreground">{i === 2 ? "Router" : s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.qty}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button
            onClick={() => { if (openResult) { setOpenResult(null); setView("result"); } else { saveDraft(); } }}
            className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* ---------- QR SCAN ---------- */
  if (view === "qr") {
    return (
      <div className="mobile-container bg-background h-screen overflow-hidden flex flex-col">
        <AppHeader title="Scan QR" showBack onBackClick={() => setView("form")} />
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

  /* ---------- RESULT FORM ---------- */
  if (view === "form" && member) {
    const readOnly = !!openResult;
    const data = openResult ?? draft;
    return (
      <div className="mobile-container bg-background h-screen overflow-y-auto scrollbar-hide flex flex-col pb-8">
        <AppHeader title="View Result" showBack onBackClick={() => { setOpenResult(null); setView("result"); }} />
        <div className="px-4 flex-1">
          {readOnly && (
            <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4 mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_PILL[data.status]}`}>{data.status}</span>
            </div>
          )}
          {!readOnly && (
            <Field label="Visit Title">
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Visit title"
                className="w-full h-12 rounded-xl bg-card border border-border px-4 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </Field>
          )}
          <Field label="Visit Purpose">
            <SelectRow
              placeholder="Value" value={data.purpose} disabled={readOnly}
              onClick={() => setPicker({ title: "Visit Purpose", options: PURPOSES, value: draft.purpose, onPick: (v) => setDraft((d) => ({ ...d, purpose: v })) })}
            />
          </Field>
          <Field label="Visit Date">
            <div className={`w-full h-12 rounded-xl border border-border px-4 flex items-center justify-between ${readOnly ? "bg-muted/60" : "bg-card"}`}>
              <span className="text-sm text-muted-foreground">{data.date || "Pick a visit date"}</span>
              {readOnly ? <CalendarDays className="w-5 h-5 text-muted-foreground" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />}
            </div>
          </Field>
          <Field label="Survey">
            <SelectRow
              placeholder="Select survey" value={data.survey} disabled={readOnly}
              onClick={() => setPicker({ title: "Survey", options: SURVEYS, value: draft.survey, onPick: (v) => setDraft((d) => ({ ...d, survey: v })) })}
            />
          </Field>
          <Field label="Visit Result">
            <SelectRow
              placeholder="Select result" value={data.result} disabled={readOnly}
              onClick={() => setPicker({ title: "Visit Result", options: RESULTS, value: draft.result, onPick: (v) => setDraft((d) => ({ ...d, result: v })) })}
            />
          </Field>

          <p className="text-sm font-semibold text-foreground mt-5 mb-2">Survey</p>
          <button
            onClick={() => setView("qr")}
            className="w-full rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4 flex items-center justify-between text-start"
          >
            <span>
              <span className="block text-sm font-semibold text-foreground">{data.survey || "Survey Title"}</span>
              <span className="block text-xs text-muted-foreground">Fill Address</span>
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-300">
              Start <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
            </span>
          </button>

          <p className="text-sm font-semibold text-foreground mt-5 mb-2">Document</p>
          <div className="rounded-2xl bg-card border border-dashed border-border p-1 divide-y divide-border/60">
            {[{ icon: FileText, label: "File Title" }, { icon: ImageIcon, label: "Image Title" }].map(({ icon: Icon, label }) => (
              <div key={label} className="px-3 py-3.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="w-4 h-4" /> {label}
                </span>
                <button onClick={() => setDocPreview(label)} aria-label={`Preview ${label}`}>
                  <Eye className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {!readOnly && (
          <div className="px-4 pt-4">
            <button onClick={() => setView("qr")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Submit</button>
            <button onClick={() => setView("result")} className="w-full mt-3 py-2 text-primary font-semibold text-sm">Cancel</button>
          </div>
        )}

        <OptionPicker picker={picker} onClose={() => setPicker(null)} />
        <Drawer open={!!docPreview} onOpenChange={(o) => !o && setDocPreview(null)}>
          <DrawerContent className="bg-card rounded-t-3xl">
            <DrawerHeader className="text-center pt-6">
              <DrawerTitle className="text-lg font-semibold">{docPreview}</DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">Attached to this visit result</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8">
              <div className="rounded-2xl bg-muted/50 h-56 flex items-center justify-center text-sm text-muted-foreground">
                Preview not available in prototype
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  /* ---------- VIEW RESULT (member) ---------- */
  if (view === "result" && member) {
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="View Result" showBack onBackClick={() => setView("visit")} />
        <div className="px-4">
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{member.name}</p>
              <MemberMeta m={member} />
            </div>
          </div>

          <p className="text-sm font-medium text-foreground mt-4 mb-2">Location</p>
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </span>
            <p className="font-semibold text-foreground">{member.region} / {member.city} / {member.district}</p>
          </div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <p className="text-sm font-medium text-foreground">Visit Result</p>
            <button
              onClick={() => { setOpenResult(null); setDraft({ id: "", title: "", status: "Not Performed", date: "17 Aug 2024" }); setView("form"); }}
              className="text-sm font-semibold text-sky-600 dark:text-sky-300 flex items-center gap-1"
            >
              Add New Result <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] divide-y divide-border/60">
            {memberResults.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">No results recorded yet</p>
            )}
            {memberResults.map((r) => (
              <button key={r.id} onClick={() => { setOpenResult(r); setView("form"); }} className="w-full p-3.5 flex items-center justify-between gap-2 text-start">
                <span className="text-sm font-medium text-foreground truncate">{r.title}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${STATUS_PILL[r.status]}`}>{r.status}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground rtl:-scale-x-100" />
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={() => setView("visit")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Submit</button>
        </div>
      </div>
    );
  }

  /* ---------- VIEW VISIT ---------- */
  return (
    <div className={`mobile-container bg-background h-screen overflow-y-auto scrollbar-hide ${visit.status === "Active" ? "pb-40" : visit.status === "Pending" ? "pb-32" : "pb-8"}`}>
      <AppHeader title="View Visit" showBack onBackClick={() => navigate("/visit-management")} />

      <div className="px-4">
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] px-4 py-1">
          <div className="divide-y divide-border/60">
            <div className="flex items-center justify-between py-3.5">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${VISIT_STATUS_PILL[visit.status]}`}>{visit.status}</span>
            </div>
            {[["Visit Type", visit.type], ["User Type", visit.userType], ["Assigned To", visit.assignee]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">{k}</span>
                <span className="text-sm font-semibold text-foreground">{v}</span>
              </div>
            ))}
            <button onClick={() => setStepsOpen(true)} className="w-full flex items-center justify-between py-3.5">
              <span className="text-sm text-muted-foreground">Steps of Call</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {visit.steps} <Eye className="w-4 h-4 text-sky-600 dark:text-sky-300" />
              </span>
            </button>
            {[["Visit Date", visit.date], ["Recurrence", visit.recurrence]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-3.5">
                <span className="text-sm text-muted-foreground">{k}</span>
                <span className="text-sm font-semibold text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 mb-2">
          <p className="text-base font-semibold text-foreground">Member Visit</p>
          <button onClick={() => setShowAllMembers((s) => !s)} className="flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-300">
            {showAllMembers ? "Show Less" : "See All"} <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 space-y-3">
          {(showAllMembers ? MEMBERS : MEMBERS.slice(0, 2)).map((m) => (
            <div key={m.id} className="rounded-2xl bg-muted/30 border border-border/60 p-3 flex items-center gap-3">
              <button onClick={() => setOverview(m)} aria-label={`Dealer overview for ${m.name}`} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </button>
              <button onClick={() => { setMember(m); setView("result"); }} className="flex-1 min-w-0 text-start">
                <p className="font-semibold text-foreground truncate">{m.name}</p>
                <MemberMeta m={m} />
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {m.region}, {m.city}, {m.district}
                </p>
              </button>
              <ChevronRight className="w-5 h-5 text-sky-600 dark:text-sky-300 shrink-0 rtl:-scale-x-100" />
            </div>
          ))}
        </div>
      </div>

      {(visit.status === "Active" || visit.status === "Pending") && (
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          {visit.status === "Active" ? (
            <>
              <button onClick={() => navigate("/visit-management")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Update</button>
              <button onClick={() => { setCancelPurpose(""); setCancelRemark(""); setCancelOpen(true); }} className="w-full mt-2 py-2 text-primary font-semibold text-sm">Cancel</button>
            </>
          ) : (
            <button onClick={() => { setCancelPurpose(""); setCancelRemark(""); setCancelOpen(true); }} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Cancel</button>
          )}
        </div>
      )}

      {/* Steps of Call */}
      <Drawer open={stepsOpen} onOpenChange={setStepsOpen}>
        <DrawerContent className="bg-card rounded-t-3xl">
          <button onClick={() => setStepsOpen(false)} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-lg font-semibold">Steps of Call</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">Steps assigned to this visit</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            {STEPS_OF_CALL.map((s, i) => (
              <div key={s} className="rounded-xl bg-muted/40 px-4 py-3.5 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Cancel Visit */}
      <Drawer open={cancelOpen} onOpenChange={setCancelOpen}>
        <DrawerContent className="bg-card rounded-t-3xl">
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-lg font-semibold">Cancel Visit</DrawerTitle>
            <DrawerDescription className="sr-only">Tell us why this visit is being cancelled</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <p className="text-sm text-muted-foreground mb-2">Cancel Purpose</p>
            <button
              onClick={() => setPicker({ title: "Cancel Purpose", options: CANCEL_PURPOSES, value: cancelPurpose, onPick: setCancelPurpose })}
              className="w-full h-12 rounded-xl bg-card border border-border px-4 flex items-center justify-between"
            >
              <span className={`text-sm ${cancelPurpose ? "text-foreground font-medium" : "text-muted-foreground"}`}>{cancelPurpose || "Select purpose"}</span>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>

            <p className="text-sm text-muted-foreground mt-4 mb-2">Remark</p>
            <textarea
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              rows={3}
              placeholder="Write here ..."
              className="w-full rounded-xl bg-card border border-border p-4 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
            />
            <button
              onClick={() => { setCancelOpen(false); navigate("/visit-management"); }}
              className="w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              Submit
            </button>
            <button onClick={() => setCancelOpen(false)} className="w-full mt-2 py-2 text-primary font-semibold text-sm">Cancel</button>
          </div>
          <OptionPicker picker={picker} onClose={() => setPicker(null)} />
        </DrawerContent>
      </Drawer>

      {/* Dealer overview */}
      <Drawer open={!!overview} onOpenChange={(o) => !o && setOverview(null)}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button onClick={() => setOverview(null)} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-lg font-semibold">{overview?.name}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">Dealer overview</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto scrollbar-hide">
            <div className="flex gap-2 mb-4">
              {(["kpi", "stock"] as const).map((tb) => (
                <button
                  key={tb}
                  onClick={() => setOverviewTab(tb)}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold ${overviewTab === tb ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}
                >
                  {tb === "kpi" ? "Performance" : "Stock"}
                </button>
              ))}
            </div>
            {overviewTab === "kpi" ? (
              <div className="space-y-3">
                {KPIS.map((k, i) => (
                  <div key={k.name} className="rounded-2xl bg-muted/30 p-4">
                    <button onClick={() => setOpenKpi(i)} className="w-full flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{k.name}</span>
                      <span className="text-xs text-muted-foreground">{k.trend}</span>
                    </button>
                    <div className="h-2 rounded-full bg-border mt-3 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${k.pct}%` }} />
                    </div>
                    {openKpi === i && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {[["Target", k.target], ["Achievement", k.achievement], ["LM", k.lm], ["MTD", k.mtd], ["LMTD", k.lmtd]].map(([l, v]) => (
                          <div key={l as string} className="rounded-xl bg-card border border-border/60 px-3 py-2">
                            <p className="text-muted-foreground">{l}</p>
                            <p className="font-semibold text-foreground">{v}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {STOCK.map((s, i) => (
                  <div key={i} className="rounded-xl bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-semibold text-foreground">{s.qty}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default VisitDetails;
