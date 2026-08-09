import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  CalendarDays, ChevronDown, Check, ContactRound, GripVertical, Hash, MapPin,
  Network, Repeat, Search, SlidersHorizontal, Trash2, User, X, ArrowLeft,
  ChevronRight, Crosshair, Plus, CheckCircle2, Eye,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import AppHeader from "@/components/AppHeader";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/* hexagon badge used in confirmation / success states */
const HexIcon = ({ tone, children }: { tone: "info" | "success"; children: React.ReactNode }) => (
  <span className="relative mx-auto flex items-center justify-center w-12 h-12">
    <svg viewBox="0 0 24 24" className={`w-12 h-12 ${tone === "info" ? "text-sky-500" : "text-emerald-600"}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5z" strokeLinejoin="round" />
    </svg>
    <span className={`absolute ${tone === "info" ? "text-sky-500" : "text-emerald-600"}`}>{children}</span>
  </span>
);

/* ---------------- demo data (prototype only) ---------------- */
const VISIT_TYPES = ["Planned Visit", "Ad-Hoc Visit"];
const USER_TYPES = ["Modern Trade", "Sales Promoter", "Distributor", "Retailer"];
const ASSIGNEES = ["Ahmad Khaled", "Sara Al Otaibi", "Mohammed Nasser", "Layla Hassan"];
const STEPS_OF_CALL = ["Merchandising Audit", "Stock Check", "Sales Pitch", "Training"];
const REGIONS = ["Riyadh", "Makkah", "Eastern Province", "Madinah", "Asir", "Qassim", "Tabuk", "Hail"];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Khobar", "Makkah", "Madinah", "Abha", "Buraidah"];
const DISTRICTS = ["Al Olaya", "Al Malaz", "Al Nakheel", "Al Hamra", "Al Rawdah", "Al Salamah"];

interface Member {
  id: string;
  name: string;
  channelType: string;
  code: string;
  parent: string;
  region: string;
  city: string;
  district: string;
}

const MEMBERS: Member[] = [
  { id: "M-1", name: "Al Nakheel Telecom", channelType: "Modern Trade", code: "MT-1042", parent: "Riyadh Hub", region: "Riyadh", city: "Riyadh", district: "Al Nakheel" },
  { id: "M-2", name: "Red Sea Mobile", channelType: "Retailer", code: "RT-2210", parent: "Jeddah Hub", region: "Makkah", city: "Jeddah", district: "Al Hamra" },
  { id: "M-3", name: "Gulf Connect Store", channelType: "Distributor", code: "DS-3381", parent: "Dammam Hub", region: "Eastern Province", city: "Dammam", district: "Al Rawdah" },
  { id: "M-4", name: "Olaya Digital", channelType: "Modern Trade", code: "MT-1188", parent: "Riyadh Hub", region: "Riyadh", city: "Riyadh", district: "Al Olaya" },
  { id: "M-5", name: "Madinah Mobile Center", channelType: "Retailer", code: "RT-2456", parent: "Madinah Hub", region: "Madinah", city: "Madinah", district: "Al Salamah" },
];

const MEMBER_COORDS: Record<string, [number, number]> = {
  "M-1": [24.7536, 46.6853], "M-2": [21.5433, 39.1728], "M-3": [26.4207, 50.0888],
  "M-4": [24.6944, 46.6853], "M-5": [24.4686, 39.6142],
};

const KPIS = [
  { name: "Gross Activations", trend: "Degrowth - 10", pct: 90, target: 300, achievement: "298.326", lm: "132.56", mtd: "25.13", lmtd: "213.21" },
  { name: "Recharge Value", trend: "Degrowth - 10", pct: 72, target: 500, achievement: "360.100", lm: "98.20", mtd: "40.05", lmtd: "180.44" },
];

const STOCK = [
  { label: "E- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" }, { label: "E- SIM", qty: "10 PCS" },
  { label: "E- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" }, { label: "P- SIM", qty: "10 PCS" },
];

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
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="w-3.5 h-3.5" /> {m.region}, {m.city}, {m.district}
    </p>
  </div>
);

/* ---------------- page ---------------- */
const CreateVisit = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planned = params.get("type") !== "adhoc";

  const [view, setView] = useState<"form" | "members" | "filter" | "map" | "memberVisit" | "viewResult" | "visitDetails">("form");
  const [resultMember, setResultMember] = useState<Member | null>(null);
  const [results, setResults] = useState<Record<string, { title: string; purpose: string; date: string; survey: string }[]>>({});
  const [draftResult, setDraftResult] = useState({ title: "", purpose: "", date: "17 Aug 2024", survey: "" });

  // form state
  const [visitType, setVisitType] = useState<string | undefined>(planned ? "Planned Visit" : "Ad-Hoc Visit");
  const [userType, setUserType] = useState<string>();
  const [assignTo, setAssignTo] = useState<string>();
  const [stepsOfCall, setStepsOfCall] = useState<string>();
  const [range, setRange] = useState<DateRange | undefined>();
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [lastDayOfMonth, setLastDayOfMonth] = useState(false);
  const [datesSheet, setDatesSheet] = useState(false);
  const [selected, setSelected] = useState<Member[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    const t = setTimeout(() => navigate("/visit-management"), 1800);
    return () => clearTimeout(t);
  }, [submitted]);

  // pickers
  const [picker, setPicker] = useState<null | { title: string; options: string[]; value?: string; onPick: (v: string) => void }>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();

  // members view state
  const [survey, setSurvey] = useState<string>();
  const [query, setQuery] = useState("");
  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const [detailsMember, setDetailsMember] = useState<Member | null>(null);
  const [detailsTab, setDetailsTab] = useState<"kpi" | "stock">("kpi");
  const [openKpi, setOpenKpi] = useState(0);
  const [selectedSheet, setSelectedSheet] = useState(false);

  // filter view state
  const [fRegion, setFRegion] = useState<string[]>([]);
  const [fCity, setFCity] = useState<string[]>([]);
  const [fDistrict, setFDistrict] = useState<string[]>([]);
  const [multiPicker, setMultiPicker] = useState<null | { title: string; options: string[]; value: string[]; onApply: (v: string[]) => void }>(null);

  const fmt = (d: Date) => format(d, "d MMM yyyy");
  const dateLabel = range?.from ? `${fmt(range.from)}${range.to ? ` - ${fmt(range.to)}` : ""}` : undefined;

  const filteredMembers = useMemo(
    () =>
      MEMBERS.filter((m) => {
        if (query && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (fRegion.length && !fRegion.includes(m.region)) return false;
        if (fCity.length && !fCity.includes(m.city)) return false;
        if (fDistrict.length && !fDistrict.includes(m.district)) return false;
        return true;
      }),
    [query, fRegion, fCity, fDistrict],
  );

  const allChecked = filteredMembers.length > 0 && filteredMembers.every((m) => draftSelected.includes(m.id));

  const openMembers = () => {
    setDraftSelected(selected.map((m) => m.id));
    setView("members");
  };

  const confirmMembers = () => {
    setSelected(MEMBERS.filter((m) => draftSelected.includes(m.id)));
    setView("form");
  };

  const canSubmitBase = visitType && userType && assignTo && stepsOfCall && range?.from && selected.length > 0;

  /* ---------- recurring occurrence engine ---------- */
  const rangeDays = useMemo(() => {
    if (!range?.from) return [] as Date[];
    const end = range.to ?? range.from;
    const out: Date[] = [];
    const cur = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate());
    while (cur <= end) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }, [range]);

  const isLastDayOfMonth = (d: Date) => d.getDate() === new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  const occurrences = useMemo(() => {
    if (!recurring) return [] as Date[];
    if (frequency === "daily") return rangeDays;
    if (frequency === "weekly") return rangeDays.filter((d) => weekDays.includes(d.getDay()));
    return rangeDays.filter((d) => monthDays.includes(d.getDate()) || (lastDayOfMonth && isLastDayOfMonth(d)));
  }, [recurring, frequency, rangeDays, weekDays, monthDays, lastDayOfMonth]);

  const WEEK_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
  const WEEK_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };

  const recurrenceTitle = () => {
    if (frequency === "daily") return "Repeats every day";
    if (frequency === "weekly") {
      if (!weekDays.length) return "Select at least one day of the week";
      return `Repeats every week on ${[...weekDays].sort((a, b) => a - b).map((d) => WEEK_NAMES[d]).join(", ")}`;
    }
    const parts = [...monthDays].sort((a, b) => a - b).map(ordinal);
    if (lastDayOfMonth) parts.push("last day");
    if (!parts.length) return "Select at least one day of the month";
    return `Repeats monthly on the ${parts.join(", ")}`;
  };

  const canSubmit = canSubmitBase && (!recurring || occurrences.length > 0);

  /* ---------- MAP VIEW ---------- */
  if (view === "map") {
    return <MembersMap members={filteredMembers} onBack={() => setView("members")} />;
  }

  /* ---------- MEMBER VISIT LIST ---------- */
  if (view === "memberVisit") {
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="Member Visit" showBack onBackClick={() => setView("form")} />
        <div className="px-4 space-y-3">
          {selected.map((m) => (
            <button
              key={m.id}
              onClick={() => { setResultMember(m); setView("viewResult"); }}
              className="w-full text-start rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-center gap-3"
            >
              <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{m.name}</p>
                <MemberMeta m={m} />
              </div>
              <ChevronRight className="w-5 h-5 text-sky-600 dark:text-sky-300 shrink-0 rtl:-scale-x-100" />
            </button>
          ))}
          {selected.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No members added yet</p>}
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={openMembers} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            Add New Members
          </button>
        </div>
      </div>
    );
  }

  /* ---------- VIEW RESULT ---------- */
  if (view === "viewResult" && resultMember) {
    const list = results[resultMember.id] ?? [];
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="View Result" showBack onBackClick={() => setView("memberVisit")} />
        <div className="px-4">
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{resultMember.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span className="bg-muted/60 rounded px-1.5 py-0.5">{resultMember.channelType}</span>
                <span>{resultMember.code}</span>
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                <Network className="w-3.5 h-3.5" /> {resultMember.parent}
              </p>
            </div>
          </div>

          <p className="text-sm font-medium text-foreground mt-4 mb-2">Location</p>
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </span>
            <p className="font-semibold text-foreground">{resultMember.region} / {resultMember.city} / {resultMember.district}</p>
          </div>

          <div className="flex items-center justify-between mt-4 mb-2">
            <p className="text-sm font-medium text-foreground">Visit Result</p>
            <button
              onClick={() => { setDraftResult({ title: "", purpose: "", date: "17 Aug 2024", survey: "" }); setView("visitDetails"); }}
              className="text-sm font-semibold text-sky-600 dark:text-sky-300 flex items-center gap-1"
            >
              Add New Result <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] divide-y divide-border/60">
            {(list.length ? list : [{ title: "Visit", purpose: "", date: "", survey: "" }]).map((r, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">{r.title || "Visit"}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${list.length ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                    {list.length ? "Performed" : "Not Performed"}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground rtl:-scale-x-100" />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={() => setView("memberVisit")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            Submit
          </button>
        </div>
      </div>
    );
  }

  /* ---------- VISIT DETAILS (result form) ---------- */
  if (view === "visitDetails" && resultMember) {
    const saveResult = () => {
      setResults((prev) => ({
        ...prev,
        [resultMember.id]: [...(prev[resultMember.id] ?? []), { ...draftResult, title: draftResult.title || "Visit" }],
      }));
      setView("viewResult");
    };
    return (
      <div className="mobile-container pb-8 bg-background h-screen overflow-y-auto scrollbar-hide flex flex-col">
        <AppHeader title="Visit Details" showBack onBackClick={() => setView("viewResult")} />
        <div className="px-4 flex-1">
          <Field label="Visit Title">
            <input
              value={draftResult.title}
              onChange={(e) => setDraftResult((d) => ({ ...d, title: e.target.value }))}
              placeholder="Visit title"
              className="w-full h-12 rounded-xl bg-card border border-border px-4 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </Field>
          <Field label="Visit Purpose">
            <SelectRow
              placeholder="Visit Purpose"
              value={draftResult.purpose || undefined}
              onClick={() => setPicker({ title: "Visit Purpose", options: ["Merchandising Audit", "Stock Check", "Training", "Complaint Follow-up"], value: draftResult.purpose, onPick: (v) => setDraftResult((d) => ({ ...d, purpose: v })) })}
            />
          </Field>
          <Field label="Visit Date">
            <div className="w-full h-12 rounded-xl bg-muted/60 border border-border px-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{draftResult.date}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            </div>
          </Field>
          <Field label="Survey">
            <SelectRow
              placeholder="Survey Name"
              value={draftResult.survey || undefined}
              onClick={() => setPicker({ title: "Survey", options: ["Merchandising Survey", "Stock Survey", "Customer Feedback"], value: draftResult.survey, onPick: (v) => setDraftResult((d) => ({ ...d, survey: v })) })}
            />
          </Field>
        </div>
        <div className="px-4 pb-8 pt-4">
          <button onClick={saveResult} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Submit</button>
          <button onClick={() => setView("viewResult")} className="w-full mt-3 py-2 text-primary font-semibold text-sm">Cancel</button>
        </div>
        <OptionPicker picker={picker} onClose={() => setPicker(null)} />
      </div>
    );
  }

  /* ---------- FILTER VIEW ---------- */
  if (view === "filter") {
    const rows: { label: string; value: string[]; options: string[]; set: (v: string[]) => void }[] = [
      { label: "Region", value: fRegion, options: REGIONS, set: setFRegion },
      { label: "City", value: fCity, options: CITIES, set: setFCity },
      { label: "District", value: fDistrict, options: DISTRICTS, set: setFDistrict },
    ];
    return (
      <div className="mobile-container bg-background h-screen overflow-y-auto scrollbar-hide flex flex-col">
        <AppHeader title="Filter" showBack onBackClick={() => setView("members")} />
        <div className="px-4 flex-1">
          {rows.map((r) => (
            <Field key={r.label} label={r.label}>
              <button
                onClick={() => setMultiPicker({ title: r.label, options: r.options, value: r.value, onApply: r.set })}
                className="w-full h-12 rounded-xl border border-border bg-card px-4 flex items-center justify-between text-start"
              >
                <span className={`text-sm truncate ${r.value.length ? "text-foreground" : "text-muted-foreground"}`}>
                  {r.value.join(", ") || `Select the ${r.label.toLowerCase()}`}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {r.value.length > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                      {r.value.length}
                    </span>
                  )}
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </span>
              </button>
            </Field>
          ))}
        </div>
        <div className="px-4 pb-8 pt-4">
          <button onClick={() => setView("members")} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            Apply
          </button>
          <button
            onClick={() => { setFRegion([]); setFCity([]); setFDistrict([]); }}
            className="w-full mt-3 py-2 text-primary font-semibold text-sm"
          >
            Clear Filter
          </button>
        </div>

        {/* multi-select option sheet */}
        <Drawer open={!!multiPicker} onOpenChange={(o) => !o && setMultiPicker(null)}>
          <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
            <DrawerHeader className="pt-6 relative text-center">
              <button
                onClick={() => setMultiPicker(null)}
                aria-label="Back"
                className="absolute start-4 top-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 text-foreground rtl:-scale-x-100" />
              </button>
              <DrawerTitle className="text-lg font-semibold">{multiPicker?.title}</DrawerTitle>
              <DrawerDescription className="sr-only">Select values</DrawerDescription>
            </DrawerHeader>
            {multiPicker && (
              <MultiSelectList
                options={multiPicker.options}
                initial={multiPicker.value}
                onApply={(vals) => { multiPicker.onApply(vals); setMultiPicker(null); }}
                onClear={() => { multiPicker.onApply([]); setMultiPicker(null); }}
              />
            )}
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  /* ---------- MEMBERS VIEW ---------- */
  if (view === "members") {
    return (
      <div className="mobile-container pb-28 bg-background h-screen overflow-y-auto scrollbar-hide">
        <AppHeader title="Select Channel Member" showBack onBackClick={() => setView("form")} />

        <div className="px-4">
          <p className="text-sm font-semibold text-foreground mb-2">Survey</p>
          <p className="text-sm text-muted-foreground mb-2">Default Survey</p>
          <SelectRow
            placeholder="Select Survey"
            value={survey}
            onClick={() => setPicker({ title: "Select Survey", options: ["Merchandising Survey", "Stock Survey", "Customer Feedback"], value: survey, onPick: setSurvey })}
          />

          <p className="text-sm font-semibold text-foreground mt-5 mb-2">Channel Members</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-12 rounded-xl bg-card border border-border ps-4 pe-11 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <button onClick={() => setView("filter")} aria-label="Filter" className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </button>
            <button onClick={() => setView("map")} aria-label="Map view" className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </button>
          </div>

          {(fRegion.length > 0 || fCity.length > 0 || fDistrict.length > 0) && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
              {[
                ...fRegion.map((v) => ({ v, clear: () => setFRegion((p) => p.filter((x) => x !== v)) })),
                ...fCity.map((v) => ({ v, clear: () => setFCity((p) => p.filter((x) => x !== v)) })),
                ...fDistrict.map((v) => ({ v, clear: () => setFDistrict((p) => p.filter((x) => x !== v)) })),
              ].map(({ v, clear }) => (
                <button key={v} onClick={clear} className="shrink-0 px-3 py-1 rounded-full border border-primary text-primary text-xs font-medium flex items-center gap-1">
                  {v} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {draftSelected.length > 0 && (
            <button
              onClick={() => setSelectedSheet(true)}
              className="w-full mt-3 h-12 rounded-xl bg-card border border-border px-4 flex items-center justify-between"
            >
              <span className="text-sm text-foreground">Select channel members</span>
              <span className="flex items-center gap-2">
                <span className="min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
                  {draftSelected.length}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground rtl:-scale-x-100" />
              </span>
            </button>
          )}

          <label className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => setDraftSelected(e.target.checked ? filteredMembers.map((m) => m.id) : [])}
              className="w-4 h-4 accent-[hsl(var(--primary))]"
            />
            <span className="text-sm text-foreground">Select All Members</span>
          </label>

          <div className="mt-3 space-y-3">
            {filteredMembers.map((m) => {
              const on = draftSelected.includes(m.id);
              return (
                <div key={m.id} className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setDraftSelected((p) => (on ? p.filter((x) => x !== m.id) : [...p, m.id]))}
                    className="w-4 h-4 mt-1 accent-[hsl(var(--primary))]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
                    <MemberMeta m={m} />
                  </div>
                  <button onClick={() => { setDetailsMember(m); setDetailsTab("kpi"); }} aria-label="Member details" className="shrink-0 w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                    <ContactRound className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                  </button>
                </div>
              );
            })}
            {filteredMembers.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No members match your filters</p>}
          </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 mx-auto max-w-[430px] p-4 bg-background/95 backdrop-blur border-t border-border/60">
          <button onClick={confirmMembers} disabled={draftSelected.length === 0} className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
            Select
          </button>
        </div>

        {/* single-option picker */}
        <OptionPicker picker={picker} onClose={() => setPicker(null)} />

        {/* member details sheet */}
        <Drawer open={!!detailsMember} onOpenChange={(o) => !o && setDetailsMember(null)}>
          <DrawerContent className="bg-card rounded-t-3xl max-h-[92vh]">
            <button onClick={() => setDetailsMember(null)} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
              <X className="w-4 h-4 text-foreground" />
            </button>
            <DrawerHeader className="text-center pt-6">
              <DrawerTitle className="text-lg font-semibold">Channel Member Details</DrawerTitle>
              <DrawerDescription className="sr-only">Member KPIs and stock</DrawerDescription>
            </DrawerHeader>
            {detailsMember && (
              <div className="px-4 pb-8 overflow-y-auto scrollbar-hide">
                <div className="rounded-2xl bg-muted/40 p-3 flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{detailsMember.name}</p>
                    <MemberMeta m={detailsMember} />
                  </div>
                </div>

                <p className="text-sm font-medium text-foreground mt-4 mb-2">Location</p>
                <div className="rounded-2xl bg-muted/40 p-3 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <p className="font-semibold text-foreground">
                    {detailsMember.region} / {detailsMember.city} / {detailsMember.district}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 border-b border-border">
                  {(["kpi", "stock"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDetailsTab(tab)}
                      className={`py-2.5 text-sm font-semibold border-b-2 -mb-px ${detailsTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
                    >
                      {tab === "kpi" ? "KPI's" : "Stock"}
                    </button>
                  ))}
                </div>

                {detailsTab === "kpi" ? (
                  <div className="mt-4 space-y-3">
                    {KPIS.map((k, i) => (
                      <div key={k.name} className="rounded-2xl border border-border/60 overflow-hidden">
                        <button onClick={() => setOpenKpi(openKpi === i ? -1 : i)} className="w-full flex items-center justify-between gap-2 px-3 py-3 bg-primary/5">
                          <span className="font-semibold text-foreground text-sm">{k.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">{k.trend}</span>
                            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${openKpi === i ? "rotate-180" : ""}`} />
                          </span>
                        </button>
                        {openKpi === i && (
                          <div className="p-3">
                            <div className="grid grid-cols-2 gap-3 items-center">
                              <div className="flex flex-col items-center">
                                <div
                                  className="w-24 h-24 rounded-full flex items-center justify-center"
                                  style={{ background: `conic-gradient(hsl(var(--primary)) ${k.pct * 3.6}deg, hsl(var(--muted)) 0deg)` }}
                                >
                                  <span className="w-16 h-16 rounded-full bg-card flex items-center justify-center font-bold text-foreground">{k.pct}%</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-1.5">Achievement / Target</p>
                              </div>
                              <div className="space-y-2">
                                <div className="rounded-xl bg-muted/40 py-2 text-center">
                                  <p className="text-[11px] text-muted-foreground">Target</p>
                                  <p className="font-semibold text-foreground">{k.target}</p>
                                </div>
                                <div className="rounded-xl bg-muted/40 py-2 text-center">
                                  <p className="text-[11px] text-muted-foreground">Achievement</p>
                                  <p className="font-semibold text-foreground">{k.achievement}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                              {[["LM", k.lm], ["MTD", k.mtd], ["LMTD", k.lmtd]].map(([l, v]) => (
                                <div key={l} className="rounded-xl bg-muted/40 py-2 text-center">
                                  <p className="text-[11px] text-muted-foreground">{l}</p>
                                  <p className="font-semibold text-foreground">{v}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {STOCK.map((s, i) => (
                      <div key={i} className="rounded-2xl border border-border/60 py-3 flex flex-col items-center gap-1">
                        <span className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center text-lg">📱</span>
                        <p className="text-sm font-semibold text-foreground">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.qty}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(() => {
                  const on = draftSelected.includes(detailsMember.id);
                  return (
                    <button
                      onClick={() => {
                        setDraftSelected((p) => (on ? p.filter((x) => x !== detailsMember.id) : [...p, detailsMember.id]));
                      }}
                      className={`w-full mt-5 py-3.5 rounded-full font-semibold text-sm ${on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}
                    >
                      {on ? "Unselect Member" : "Select Member"}
                    </button>
                  );
                })()}
              </div>
            )}
          </DrawerContent>
        </Drawer>

        {/* selected members sheet */}
        <Drawer open={selectedSheet} onOpenChange={setSelectedSheet}>
          <DrawerContent className="bg-card rounded-t-3xl max-h-[80vh]">
            <button onClick={() => setSelectedSheet(false)} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
              <X className="w-4 h-4 text-foreground" />
            </button>
            <DrawerHeader className="text-center pt-6">
              <DrawerTitle className="text-lg font-semibold">Selected Channel Member</DrawerTitle>
              <DrawerDescription className="sr-only">Members added to this visit</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-8 space-y-3 overflow-y-auto scrollbar-hide">
              {MEMBERS.filter((m) => draftSelected.includes(m.id)).map((m) => (
                <div key={m.id} className="rounded-2xl bg-muted/30 border border-border/60 p-3 flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
                    <MemberMeta m={m} />
                  </div>
                  <button onClick={() => { setDetailsMember(m); setSelectedSheet(false); }} aria-label="Details" className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                    <ContactRound className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                  </button>
                  <button onClick={() => setDraftSelected((p) => p.filter((x) => x !== m.id))} aria-label="Remove" className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-primary" />
                  </button>
                </div>
              ))}
              {draftSelected.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No members selected yet</p>}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  /* ---------- FORM VIEW ---------- */
  return (
    <div className="mobile-container pb-8 bg-background h-screen overflow-y-auto scrollbar-hide">
      <AppHeader title="Create New Visit" showBack onBackClick={() => navigate("/visit-management")} />

      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">Visit Details</p>
          <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required</p>
        </div>
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
          <Field label="Visit Type" required>
            <SelectRow placeholder="Select the type" value={visitType} onClick={() => setPicker({ title: "Visit Type", options: VISIT_TYPES, value: visitType, onPick: setVisitType })} />
          </Field>
          <Field label="User Type" required>
            <SelectRow placeholder="Select the type eg. sales promoter" value={userType} onClick={() => setPicker({ title: "User Type", options: USER_TYPES, value: userType, onPick: setUserType })} />
          </Field>
          <Field label="Assign To" required>
            <SelectRow placeholder="Select assigned to" value={assignTo} onClick={() => setPicker({ title: "Assign To", options: ASSIGNEES, value: assignTo, onPick: setAssignTo })} />
          </Field>
          <Field label="Steps of Call" required>
            <SelectRow placeholder="Select steps of call" value={stepsOfCall} onClick={() => setPicker({ title: "Steps of Call", options: STEPS_OF_CALL, value: stepsOfCall, onPick: setStepsOfCall })} />
          </Field>
          <Field label="Date Range" required>
            <button
              onClick={() => { setDraftRange(range); setDateOpen(true); }}
              className="w-full h-12 rounded-xl border border-border bg-card px-4 flex items-center justify-between"
            >
              <span className={`text-sm ${dateLabel ? "text-foreground" : "text-muted-foreground"}`}>{dateLabel || "Select date range"}</span>
              <CalendarDays className="w-5 h-5 text-muted-foreground" />
            </button>
            <p className="text-xs text-muted-foreground mt-2">Visits will repeat between these dates based on the pattern below.</p>
          </Field>
        </div>

        <div className="mt-3 rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Repeat className="w-5 h-5 text-primary" />
            </span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Recurring Visit</p>
              <p className="text-sm text-muted-foreground">Repeat this visit automatically.</p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {recurring && (
            <div className="mt-4 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Frequency</p>
                <p className="text-xs text-muted-foreground">
                  {rangeDays.length ? `${rangeDays.length}-day range` : "Select a date range"}
                </p>
              </div>
              <div className="flex gap-2">
                {(["daily", "weekly", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${frequency === f ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {frequency === "weekly" && (
                <>
                  <p className="text-sm font-medium text-foreground mt-4 mb-2">Repeat on</p>
                  <div className="flex gap-2">
                    {WEEK_LABELS.map((l, i) => {
                      const on = weekDays.includes(i);
                      return (
                        <button
                          key={i}
                          aria-label={WEEK_NAMES[i]}
                          onClick={() => setWeekDays((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}
                          className={`w-9 h-9 rounded-full text-xs font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground"}`}
                        >
                          {l}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {frequency === "monthly" && (
                <>
                  <p className="text-sm font-medium text-foreground mt-4 mb-2">Days of month</p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => {
                      const on = monthDays.includes(d);
                      return (
                        <button
                          key={d}
                          onClick={() => setMonthDays((p) => (on ? p.filter((x) => x !== d) : [...p, d]))}
                          className={`h-9 rounded-lg text-xs font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setLastDayOfMonth((v) => !v)}
                    className={`w-full mt-1.5 h-9 rounded-lg text-xs font-semibold ${lastDayOfMonth ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}
                  >
                    Last day of month
                  </button>
                </>
              )}

              <div className="mt-4 rounded-2xl border border-border/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{recurrenceTitle()}</p>
                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 text-[11px] font-semibold">
                    {occurrences.length} Visit
                  </span>
                </div>
                {range?.from && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fmt(range.from)} → {fmt(range.to ?? range.from)}
                  </p>
                )}
                {occurrences.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
                    {occurrences.slice(0, 5).map((d, i) => (
                      <span key={i} className="shrink-0 px-2.5 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                        {format(d, "MMM d")}
                      </span>
                    ))}
                    {occurrences.length > 5 && (
                      <button
                        onClick={() => setDatesSheet(true)}
                        className="shrink-0 px-2.5 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {occurrences.length - 5}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 mb-2">
          <p className="text-sm font-semibold text-foreground">
            Member Visit<span className="text-destructive ms-0.5">*</span>
          </p>
          {selected.length > 0 && (
            <button onClick={() => setView("memberVisit")} className="text-sm font-semibold text-sky-600 dark:text-sky-300 flex items-center gap-1">
              See All <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          )}
        </div>
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
          {selected.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </span>
              <p className="text-sm text-muted-foreground">Add at least member to begin the visit</p>
              <button onClick={openMembers} className="text-sm font-semibold text-sky-600 dark:text-sky-300 flex items-center gap-1">
                Add Channel Members <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selected.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setResultMember(m); setView("viewResult"); }}
                  className="w-full text-start rounded-xl bg-muted/30 p-3 flex items-center gap-3"
                >
                  <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
                    <MemberMeta m={m} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-sky-600 dark:text-sky-300 shrink-0 rtl:-scale-x-100" />
                </button>
              ))}
              <button
                onClick={openMembers}
                className="w-full py-3 rounded-full bg-primary/10 text-foreground font-medium text-sm flex items-center justify-center gap-1.5"
              >
                Add Channel Member <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSubmit}
          className="w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      <OptionPicker picker={picker} onClose={() => setPicker(null)} />

      {/* selected recurring dates sheet */}
      <Drawer open={datesSheet} onOpenChange={setDatesSheet}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[70vh]">
          <DrawerHeader className="pt-6 relative">
            <button onClick={() => setDatesSheet(false)} aria-label="Back" className="absolute start-4 top-5 w-8 h-8 rounded-full border border-border flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-foreground rtl:-scale-x-100" />
            </button>
            <DrawerTitle className="text-lg font-semibold text-center">Selected Date</DrawerTitle>
            <DrawerDescription className="sr-only">All recurring visit dates</DrawerDescription>
            <button onClick={() => setDatesSheet(false)} aria-label="Close" className="absolute end-4 top-5 w-8 h-8 rounded-full border border-border flex items-center justify-center">
              <X className="w-4 h-4 text-foreground" />
            </button>
          </DrawerHeader>
          <div className="px-4 pb-8 overflow-y-auto scrollbar-hide divide-y divide-border/60">
            {occurrences.map((d, i) => (
              <p key={i} className="py-3 text-sm text-foreground">{format(d, "MMM d, yyyy")}</p>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* date range sheet */}
      <Drawer open={dateOpen} onOpenChange={setDateOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[92vh]">
          <button onClick={() => setDateOpen(false)} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-6">
            <DrawerTitle className="text-lg font-semibold">Pick a Date</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">Please select a date</DrawerDescription>
          </DrawerHeader>
          <div className="px-2 pb-6 overflow-y-auto scrollbar-hide">
            <Calendar mode="range" selected={draftRange} onSelect={setDraftRange} className="w-full p-0 [&_.rdp-month]:w-full [&_table]:w-full" />
            <div className="mx-2 mt-3 rounded-2xl bg-muted/40 px-3 divide-y divide-border/60">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">Date From</span>
                <span className="text-sm font-semibold text-foreground">{draftRange?.from ? fmt(draftRange.from) : "—"}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">Date To</span>
                <span className="text-sm font-semibold text-foreground">{draftRange?.to ? fmt(draftRange.to) : "—"}</span>
              </div>
            </div>
            <div className="px-2">
              <button onClick={() => { setRange(draftRange); setDateOpen(false); }} className="w-full mt-4 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Apply</button>
              <button onClick={() => { setDraftRange(undefined); setRange(undefined); setDateOpen(false); }} className="w-full mt-2 py-2 text-primary font-semibold text-sm">Clear Filter</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* confirmation message */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl">
          <DrawerHeader className="text-center pt-4">
            <DrawerTitle className="text-lg font-semibold">Confirmation Message</DrawerTitle>
            <DrawerDescription className="sr-only">Confirm submitting the visit request</DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-8 text-center">
            <HexIcon tone="info"><span className="text-lg font-bold leading-none">!</span></HexIcon>
            <p className="mt-3 text-base font-semibold text-sky-500">Submit Request</p>
            <p className="mt-1 text-sm text-muted-foreground">Do you want to submit the new visit request ?</p>
            <button
              onClick={() => { setConfirmOpen(false); setSubmitted(true); }}
              className="w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              Submit
            </button>
            <button onClick={() => setConfirmOpen(false)} className="w-full mt-3 py-2 text-primary font-semibold text-sm">
              Cancel
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* success overlay */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 px-5 pb-8">
          <div className="w-full max-w-[360px] rounded-2xl bg-card px-6 py-5 text-center shadow-lg">
            <HexIcon tone="success"><Check className="w-4 h-4" strokeWidth={3} /></HexIcon>
            <p className="mt-2 text-base font-semibold text-emerald-600">Submit Request</p>
            <p className="mt-1 text-sm text-muted-foreground">Your visit request has been sent successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- helpers ---------- */
const OptionPicker = ({
  picker,
  onClose,
}: {
  picker: null | { title: string; options: string[]; value?: string; onPick: (v: string) => void };
  onClose: () => void;
}) => (
  <Drawer open={!!picker} onOpenChange={(o) => !o && onClose()}>
    <DrawerContent className="bg-card rounded-t-3xl max-h-[80vh]">
      <button onClick={onClose} aria-label="Close" className="absolute end-4 top-6 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
        <X className="w-4 h-4 text-foreground" />
      </button>
      <DrawerHeader className="text-center pt-6">
        <DrawerTitle className="text-lg font-semibold">{picker?.title}</DrawerTitle>
        <DrawerDescription className="sr-only">Select an option</DrawerDescription>
      </DrawerHeader>
      <div className="px-4 pb-8 overflow-y-auto scrollbar-hide">
        {picker?.options.map((o) => {
          const on = picker.value === o;
          return (
            <button
              key={o}
              onClick={() => { picker.onPick(o); onClose(); }}
              className={`w-full text-start px-4 py-3 rounded-xl mb-2 flex items-center justify-between ${on ? "bg-primary/10 text-primary font-semibold" : "bg-muted/30 text-foreground"}`}
            >
              {o}
              {on && <Check className="w-4 h-4" />}
            </button>
          );
        })}
      </div>
    </DrawerContent>
  </Drawer>
);

const MultiSelectList = ({
  options,
  initial,
  onApply,
  onClear,
}: {
  options: string[];
  initial: string[];
  onApply: (v: string[]) => void;
  onClear: () => void;
}) => {
  const [vals, setVals] = useState<string[]>(initial);
  const [q, setQ] = useState("");
  const list = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="px-4 pb-8 overflow-y-auto scrollbar-hide">
      <div className="relative">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="w-full h-12 rounded-xl bg-card border border-border ps-4 pe-11 text-[16px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />
        <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      </div>
      <div className="mt-3 rounded-xl border border-border/60 overflow-hidden divide-y divide-border/60">
        {list.map((o) => {
          const on = vals.includes(o);
          return (
            <label key={o} className={`flex items-center gap-3 px-4 py-3 ${on ? "bg-primary/5" : "bg-card"}`}>
              <input
                type="checkbox"
                checked={on}
                onChange={() => setVals((p) => (on ? p.filter((x) => x !== o) : [...p, o]))}
                className="w-4 h-4 accent-[hsl(var(--primary))]"
              />
              <span className="text-sm text-foreground">{o}</span>
            </label>
          );
        })}
      </div>
      <button onClick={() => onApply(vals)} className="w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm">Apply</button>
      <button onClick={onClear} className="w-full mt-2 py-2 text-primary font-semibold text-sm">Clear Filter</button>
    </div>
  );
};

/* ---------- members map ---------- */
const MembersMap = ({ members, onBack }: { members: Member[]; onBack: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!ref.current || map.current) return;
    const m = L.map(ref.current, { zoomControl: false }).setView([24.7136, 46.6753], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(m);
    const pins = members
      .map((mem) => (MEMBER_COORDS[mem.id] ? L.marker(MEMBER_COORDS[mem.id]).bindPopup(mem.name).addTo(m) : null))
      .filter(Boolean) as L.Marker[];
    if (pins.length) m.fitBounds(L.featureGroup(pins).getBounds().pad(0.3));
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, [members]);

  const recenter = () => map.current?.setView([24.7136, 46.6753], 6);
  const search = () => {
    const hit = members.find((mem) => mem.name.toLowerCase().includes(q.toLowerCase()));
    if (hit && MEMBER_COORDS[hit.id]) map.current?.setView(MEMBER_COORDS[hit.id], 13);
  };

  return (
    <div className="mobile-container bg-background h-screen relative overflow-hidden">
      <div ref={ref} className="absolute inset-0 z-0" />
      <div className="absolute top-4 inset-x-4 z-10 flex items-center gap-2">
        <button onClick={onBack} aria-label="Back" className="w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5 text-foreground rtl:-scale-x-100" />
        </button>
        <div className="flex-1 relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search .."
            className="w-full h-11 rounded-full bg-card shadow-lg ps-4 pe-11 text-[16px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={search} aria-label="Search" className="absolute end-3 top-1/2 -translate-y-1/2">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
      <button onClick={recenter} aria-label="Recenter" className="absolute bottom-8 end-5 z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center">
        <Crosshair className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CreateVisit;
