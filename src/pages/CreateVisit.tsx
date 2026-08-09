import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  CalendarDays, ChevronDown, Check, ContactRound, GripVertical, Hash, MapPin,
  Network, Repeat, Search, SlidersHorizontal, Trash2, User, X, ArrowLeft,
  ChevronRight, Crosshair, Plus, CheckCircle2,
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
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4 last:mb-0">
    <p className="text-sm font-medium text-foreground mb-2">{label}</p>
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
  const [selected, setSelected] = useState<Member[]>([]);
  const [submitted, setSubmitted] = useState(false);

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

  const canSubmit = visitType && userType && assignTo && stepsOfCall && range?.from && selected.length > 0;

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
              <SelectRow
                placeholder={`Select the ${r.label.toLowerCase()}`}
                value={r.value.join(", ") || undefined}
                onClick={() => setMultiPicker({ title: r.label, options: r.options, value: r.value, onApply: r.set })}
              />
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
            <button onClick={() => setSelectedSheet(true)} aria-label="Selected members" className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 relative">
              <MapPin className="w-5 h-5 text-primary" />
              {draftSelected.length > 0 && (
                <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                  {draftSelected.length}
                </span>
              )}
            </button>
          </div>

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
        <p className="text-sm font-semibold text-foreground mb-2">Visit Details</p>
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4">
          <Field label="Visit Type">
            <SelectRow placeholder="Select the type" value={visitType} onClick={() => setPicker({ title: "Visit Type", options: VISIT_TYPES, value: visitType, onPick: setVisitType })} />
          </Field>
          <Field label="User Type">
            <SelectRow placeholder="Select the type eg. sales promoter" value={userType} onClick={() => setPicker({ title: "User Type", options: USER_TYPES, value: userType, onPick: setUserType })} />
          </Field>
          <Field label="Assign To">
            <SelectRow placeholder="Select assigned to" value={assignTo} onClick={() => setPicker({ title: "Assign To", options: ASSIGNEES, value: assignTo, onPick: setAssignTo })} />
          </Field>
          <Field label="Steps of Call">
            <SelectRow placeholder="Select steps of call" value={stepsOfCall} onClick={() => setPicker({ title: "Steps of Call", options: STEPS_OF_CALL, value: stepsOfCall, onPick: setStepsOfCall })} />
          </Field>
          <Field label="Date Range">
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

        <div className="mt-3 rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5 text-primary" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Recurring Visit</p>
            <p className="text-sm text-muted-foreground">Repeat this visit automatically.</p>
          </div>
          <Switch checked={recurring} onCheckedChange={setRecurring} />
        </div>

        <p className="text-sm font-semibold text-foreground mt-4 mb-2">Members Visit</p>
        <div className="rounded-2xl bg-card border border-border/60 shadow-[var(--card-shadow)] p-5">
          {selected.length === 0 ? (
            <div className="flex flex-col items-center gap-2">
              <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </span>
              <p className="text-sm text-muted-foreground">Add at least member to begin the visit</p>
              <button onClick={openMembers} className="text-sm font-semibold text-sky-600 dark:text-sky-300">Add Channel Members ＋</button>
            </div>
          ) : (
            <div className="space-y-3">
              {selected.map((m) => (
                <div key={m.id} className="rounded-xl bg-muted/30 p-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
                    <MemberMeta m={m} />
                  </div>
                  <button onClick={() => setSelected((p) => p.filter((x) => x.id !== m.id))} aria-label="Remove" className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-primary" />
                  </button>
                </div>
              ))}
              <button onClick={openMembers} className="w-full text-sm font-semibold text-sky-600 dark:text-sky-300 pt-1">Add Channel Members ＋</button>
            </div>
          )}
        </div>

        <button
          onClick={() => setSubmitted(true)}
          disabled={!canSubmit}
          className="w-full mt-5 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Submit
        </button>
      </div>

      <OptionPicker picker={picker} onClose={() => setPicker(null)} />

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

      {/* success */}
      <Dialog open={submitted} onOpenChange={setSubmitted}>
        <DialogContent className="max-w-[320px] rounded-3xl text-center">
          <DialogHeader>
            <span className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center mb-2">
              <Check className="w-7 h-7 text-emerald-600 dark:text-emerald-300" />
            </span>
            <DialogTitle className="text-center">Visit Created</DialogTitle>
            <DialogDescription className="text-center">
              The visit has been created and assigned successfully.
            </DialogDescription>
          </DialogHeader>
          <button onClick={() => navigate("/visit-management")} className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            Go to Visits
          </button>
        </DialogContent>
      </Dialog>
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

export default CreateVisit;
