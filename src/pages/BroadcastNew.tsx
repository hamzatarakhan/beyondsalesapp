import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import BroadcastVoiceNote from "@/components/BroadcastVoiceNote";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, Eye, FileText, IdCard, Image as ImageIcon, Mic, Plus, Search, SlidersHorizontal, Square, Trash2, User, X } from "lucide-react";
import { BROADCAST_MEMBERS, BroadcastDoc, BroadcastMember, HIERARCHY_TYPES, HierarchyType, addSentBroadcast, formatVoice } from "@/data/broadcasts";

// Hierarchy Type is multi-select (empty = all); Region / Wilaya / Location pick one each.
type Filter = { hierarchy: HierarchyType[]; region: string; wilaya: string; location: string };
const NO_FILTER: Filter = { hierarchy: [], region: "", wilaya: "", location: "" };
const uniq = (xs: string[]) => [...new Set(xs)];
const PREVIEW_COUNT = 3;

const MemberRow = ({ m }: { m: BroadcastMember }) => (
  <div className="min-w-0">
    <p className="font-medium text-foreground truncate">{m.name}</p>
    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><IdCard className="w-3.5 h-3.5" /><span dir="ltr">{m.code}</span></p>
  </div>
);

// Compose a broadcast: channel members (picked on the Channel Member step), message,
// documents and a voice note. The member picker is a step of this page (?step=members)
// so the draft survives going there and back.
const BroadcastNew = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const picking = params.get("step") === "members";

  const [members, setMembers] = useState<BroadcastMember[]>([]);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<BroadcastDoc[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceSeconds, setVoiceSeconds] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  // Channel Member step state
  const [draft, setDraft] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(NO_FILTER);
  const [draftFilter, setDraftFilter] = useState<Filter>(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [recording]);

  const openPicker = () => {
    setDraft(members.map((m) => m.code));
    setQuery("");
    setParams({ step: "members" });
  };

  const shownMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BROADCAST_MEMBERS.filter((m) =>
      (!q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)) &&
      (filter.hierarchy.length === 0 || filter.hierarchy.includes(m.hierarchy)) &&
      (!filter.region || m.region === filter.region) &&
      (!filter.wilaya || m.wilaya === filter.wilaya) &&
      (!filter.location || m.location === filter.location),
    );
  }, [query, filter]);

  const allShownSelected = shownMembers.length > 0 && shownMembers.every((m) => draft.includes(m.code));
  const toggleAll = () => {
    const codes = shownMembers.map((m) => m.code);
    setDraft((d) => (allShownSelected ? d.filter((c) => !codes.includes(c)) : uniq([...d, ...codes])));
  };
  const toggleOne = (code: string) => setDraft((d) => (d.includes(code) ? d.filter((c) => c !== code) : [...d, code]));

  const applyPicker = () => {
    setMembers(BROADCAST_MEMBERS.filter((m) => draft.includes(m.code)));
    navigate(-1);
  };

  // Filter options narrow down: Wilaya follows Region, Location follows Wilaya.
  const regionOpts = uniq(BROADCAST_MEMBERS.map((m) => m.region));
  const wilayaOpts = uniq(BROADCAST_MEMBERS.filter((m) => !draftFilter.region || m.region === draftFilter.region).map((m) => m.wilaya));
  const locationOpts = uniq(BROADCAST_MEMBERS.filter((m) => (!draftFilter.region || m.region === draftFilter.region) && (!draftFilter.wilaya || m.wilaya === draftFilter.wilaya)).map((m) => m.location));

  const addDocument = () => {
    const isImage = documents.length % 2 === 1;
    setDocuments((prev) => [...prev, { id: `${Date.now()}`, name: isImage ? `Image_${prev.length + 1}.jpg` : `File_${prev.length + 1}.pdf`, kind: isImage ? "image" : "file" }]);
  };

  const stopRecording = () => {
    setRecording(false);
    setVoiceSeconds(Math.max(1, recordSeconds));
  };

  const canSend = members.length > 0 && (message.trim() || documents.length > 0 || voiceSeconds) && !recording;

  const send = () => {
    addSentBroadcast({ message: message.trim(), members, documents, voiceSeconds: voiceSeconds ?? undefined });
    setSuccess(true);
  };

  if (picking) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <AppHeader title={t("broadcast.channelMember")} showBack />

        <div className="px-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("broadcast.search")}
              className="w-full h-12 rounded-xl bg-card border border-border/60 ps-4 pe-11 text-base outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Search className="w-5 h-5 text-muted-foreground absolute end-4 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={() => { setDraftFilter(filter); setFilterOpen(true); }}
            className="relative w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center"
            aria-label={t("broadcast.filter")}
          >
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            {(filter.hierarchy.length > 0 || filter.region || filter.wilaya || filter.location) && <span className="absolute top-2 end-2 w-2 h-2 rounded-full bg-primary" />}
          </button>
        </div>

        <div className="px-4 mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Checkbox checked={allShownSelected} onCheckedChange={toggleAll} disabled={shownMembers.length === 0} />
            {t("broadcast.selectAll")}
          </label>
          <span className="text-xs text-muted-foreground">{t("broadcast.selectedMembers", { count: draft.length })}</span>
        </div>

        <div className="px-4 mt-3 space-y-3">
          {shownMembers.map((m) => (
            <label
              key={m.code}
              className={cn(
                "flex items-center gap-3 bg-card rounded-2xl border p-4 shadow-[var(--card-shadow)] cursor-pointer transition-colors",
                draft.includes(m.code) ? "border-primary/40" : "border-border/60",
              )}
            >
              <Checkbox checked={draft.includes(m.code)} onCheckedChange={() => toggleOne(m.code)} />
              <MemberRow m={m} />
            </label>
          ))}
          {shownMembers.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">{t("broadcast.noMembers")}</p>}
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur px-4 py-4 border-t border-border/60">
          <button
            disabled={draft.length === 0}
            onClick={applyPicker}
            className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold disabled:opacity-40"
          >
            {t("broadcast.select")}
          </button>
        </div>

        <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
          <DrawerContent className="px-4 pb-8">
            <div className="relative pt-2 pb-4 text-center">
              <h2 className="text-lg font-semibold text-foreground">{t("broadcast.filter")}</h2>
              <p className="text-sm text-muted-foreground">{t("broadcast.filterSub")}</p>
              <button
                onClick={() => setFilterOpen(false)}
                className="absolute end-0 top-2 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
                aria-label={t("broadcast.close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t("broadcast.hierarchyType")}</label>
                <Popover>
                  <PopoverTrigger className="w-full h-12 rounded-xl bg-card border border-border/60 px-3 flex items-center justify-between gap-2 text-base text-start">
                    <span className={cn("truncate", draftFilter.hierarchy.length === 0 && "text-muted-foreground")}>
                      {draftFilter.hierarchy.length === 0
                        ? t("broadcast.selectHierarchyType")
                        : HIERARCHY_TYPES.filter((h) => draftFilter.hierarchy.includes(h)).map((h) => t(`profile.hierarchy.roles.${h}`)).join(", ")}
                    </span>
                    <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1 rounded-xl">
                    {HIERARCHY_TYPES.map((h) => {
                      const on = draftFilter.hierarchy.includes(h);
                      return (
                        <label key={h} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer", on ? "bg-primary/5 text-foreground" : "text-foreground hover:bg-muted/60")}>
                          <Checkbox
                            checked={on}
                            onCheckedChange={() => setDraftFilter((d) => ({ ...d, hierarchy: on ? d.hierarchy.filter((x) => x !== h) : [...d.hierarchy, h] }))}
                          />
                          {t(`profile.hierarchy.roles.${h}`)}
                        </label>
                      );
                    })}
                  </PopoverContent>
                </Popover>
              </div>
              {([
                { key: "region", label: t("broadcast.region"), ph: t("broadcast.selectRegion"), opts: regionOpts, reset: { wilaya: "", location: "" } },
                { key: "wilaya", label: t("broadcast.wilaya"), ph: t("broadcast.selectWilaya"), opts: wilayaOpts, reset: { location: "" } },
                { key: "location", label: t("broadcast.location"), ph: t("broadcast.selectLocation"), opts: locationOpts, reset: {} },
              ] as const).map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-foreground mb-2">{f.label}</label>
                  <Select value={draftFilter[f.key]} onValueChange={(v) => setDraftFilter((d) => ({ ...d, ...f.reset, [f.key]: v }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-card border-border/60 text-base">
                      <SelectValue placeholder={f.ph} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setFilter(draftFilter); setFilterOpen(false); }}
              className="mt-6 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              {t("broadcast.apply")}
            </button>
            <button
              onClick={() => { setDraftFilter(NO_FILTER); setFilter(NO_FILTER); setFilterOpen(false); }}
              className="mt-3 w-full h-11 text-primary font-semibold"
            >
              {t("broadcast.clearFilter")}
            </button>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  const visibleMembers = showAllMembers ? members : members.slice(0, PREVIEW_COUNT);

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title={t("broadcast.title")} showBack />

      <div className="px-4 space-y-5">
        {/* Channel members */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">{members.length ? t("broadcast.members") : t("broadcast.channelMembers")}</label>
            {members.length > PREVIEW_COUNT && (
              <button onClick={() => setShowAllMembers((v) => !v)} className="text-link text-sm font-medium">
                {showAllMembers ? t("broadcast.showLess") : t("broadcast.seeAll")}
              </button>
            )}
          </div>
          {members.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] py-6 px-4 flex flex-col items-center gap-2 text-center">
              <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center"><User className="w-5 h-5" /></span>
              <p className="text-sm text-muted-foreground">{t("broadcast.selectRecipientHint")}</p>
              <button onClick={openPicker} className="text-primary text-sm font-semibold flex items-center gap-1">
                {t("broadcast.addChannelMember")} <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-3 space-y-2">
              {visibleMembers.map((m) => (
                <div key={m.code} className="rounded-xl bg-muted/40 px-4 py-3"><MemberRow m={m} /></div>
              ))}
              <button
                onClick={openPicker}
                className="w-full py-3 rounded-full border-[0.5px] border-primary/10 bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1"
              >
                {t("broadcast.addMembers")} <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t("broadcast.message")}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={t("broadcast.messagePlaceholder")}
            className="w-full rounded-2xl bg-card border border-border/60 p-4 text-base outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">{t("broadcast.documents")}</label>
            {documents.length > 0 && (
              <button onClick={addDocument} className="text-primary text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" /> {t("broadcast.addFiles")}
              </button>
            )}
          </div>
          {documents.length === 0 ? (
            <button onClick={addDocument} className="w-full rounded-2xl border border-dashed border-border bg-card py-8 flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center"><Plus className="w-4 h-4" /></span>
              <span className="text-sm text-muted-foreground">{t("broadcast.uploadFiles")}</span>
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                  <span className="flex-1 text-sm text-foreground truncate" dir="ltr">{doc.name}</span>
                  <button className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label={t("broadcast.previewFile")}>
                    <Eye className="w-4 h-4 text-sky-500" />
                  </button>
                  <button
                    onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))}
                    className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center"
                    aria-label={t("broadcast.deleteFile")}
                  >
                    <Trash2 className="w-4 h-4 text-primary" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice note */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t("broadcast.voiceNote")}</label>
          <div className="bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] p-4">
            {voiceSeconds ? (
              <BroadcastVoiceNote seconds={voiceSeconds} onDelete={() => { setVoiceSeconds(null); setRecordSeconds(0); }} />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => (recording ? stopRecording() : (setRecordSeconds(0), setRecording(true)))}
                  className={cn("w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center", recording && "animate-pulse")}
                  aria-label={recording ? t("broadcast.stopRecording") : t("broadcast.startRecording")}
                >
                  {recording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>
                <p className="text-sm text-muted-foreground">
                  {recording ? <>{t("broadcast.recording")} <span dir="ltr" className="tabular-nums">{formatVoice(recordSeconds)}</span></> : t("broadcast.pressToRecord")}
                </p>
              </div>
            )}
          </div>
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
