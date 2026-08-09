import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, User, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StoreLocationMap from "@/components/StoreLocationMap";

// Prototype-only demo visit — no visit-scheduling backend to source this from yet.
const DEMO_VISIT = {
  id: "VST-100294",
  dateFrom: "2 May 2022",
  dateTo: "2 May 2022",
};

const MEMBERS = ["Al Nakheel Telecom", "Red Sea Mobile", "Tahlia Connect"];

const DealerVisitWidget = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mapOpen, setMapOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [adHocOpen, setAdHocOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [member, setMember] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const reasonOptions = [
    t("home.dealerVisit.reasons.stock"),
    t("home.dealerVisit.reasons.complaint"),
    t("home.dealerVisit.reasons.training"),
    t("home.dealerVisit.reasons.collection"),
    t("home.dealerVisit.reasons.other"),
  ];

  const submitAdHoc = () => {
    setAdHocOpen(false);
    setSuccessOpen(true);
    setMember("");
    setReason("");
    setNotes("");
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{t("home.dealerVisit.title")}</h3>
          <button
            onClick={() => navigate("/visit-management")}
            className="flex items-center gap-1 text-primary text-sm font-medium"
          >
            {t("home.dealerVisit.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {/* Active visit banner */}
        <div className="rounded-2xl bg-primary p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-primary-foreground font-semibold text-[15px] truncate">
              {t("home.dealerVisit.visitName")}
            </p>
            <p className="text-primary-foreground/80 text-xs mt-0.5 truncate">
              {t("home.dealerVisit.visitType")}
            </p>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground text-[11px] font-semibold">
            {t("home.dealerVisit.active")}
          </span>
        </div>

        {/* Dates */}
        <div className="mt-3 rounded-2xl bg-muted/40 px-3 divide-y divide-border/60">
          <Row label={t("home.dealerVisit.dateFrom")} value={DEMO_VISIT.dateFrom} />
          <Row label={t("home.dealerVisit.dateTo")} value={DEMO_VISIT.dateTo} />
        </div>

        {/* Next dealer */}
        <p className="text-xs text-muted-foreground mt-4 mb-1.5">{t("home.dealerVisit.nextDealer")}</p>
        <div className="rounded-2xl bg-muted/40 p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{t("home.dealerVisit.memberName")}</p>
            <p className="text-xs text-muted-foreground truncate">{t("home.dealerVisit.memberCode")}</p>
          </div>
        </div>

        {/* Location */}
        <p className="text-xs text-muted-foreground mt-4 mb-1.5">{t("home.dealerVisit.location")}</p>
        <button
          onClick={() => setMapOpen(true)}
          className="relative w-full h-[70px] rounded-2xl overflow-hidden bg-muted"
        >
          <img
            src="https://tile.openstreetmap.org/13/4837/3479.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-foreground/45 flex items-center justify-center text-sm font-medium text-background">
            {t("home.dealerVisit.viewMap")}
          </span>
        </button>

        {/* Actions */}
        <button
          onClick={() => setDetailsOpen(true)}
          className="w-full mt-4 py-3 rounded-full bg-primary/10 text-foreground font-semibold text-sm"
        >
          {t("home.dealerVisit.showDetails")}
        </button>
        <div className="flex items-center gap-3 my-3">
          <span className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">{t("home.dealerVisit.or")}</span>
          <span className="flex-1 h-px bg-border" />
        </div>
        <button
          onClick={() => setAdHocOpen(true)}
          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
        >
          {t("home.dealerVisit.adHocVisit")}
        </button>
      </div>

      <StoreLocationMap
        open={mapOpen}
        onOpenChange={setMapOpen}
        storeName={t("home.dealerVisit.memberName")}
        storeLocation={t("home.dealerVisit.memberCode")}
      />

      {/* Visit details */}
      <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setDetailsOpen(false)}
            aria-label={t("home.dealerVisit.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("home.dealerVisit.detailsTitle")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8">
            <div className="rounded-2xl bg-muted/40 px-3 divide-y divide-border/60">
              <Row label={t("home.dealerVisit.status")} value={t("home.dealerVisit.active")} />
              <Row label={t("home.dealerVisit.visitId")} value={DEMO_VISIT.id} />
              <Row label={t("home.dealerVisit.dateFrom")} value={DEMO_VISIT.dateFrom} />
              <Row label={t("home.dealerVisit.dateTo")} value={DEMO_VISIT.dateTo} />
              <Row label={t("home.dealerVisit.purpose")} value={t("home.dealerVisit.purposeValue")} />
            </div>
            <p className="text-xs text-muted-foreground mt-4 mb-1.5">{t("home.dealerVisit.notes")}</p>
            <p className="text-sm text-foreground">{t("home.dealerVisit.notesValue")}</p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add-hoc visit */}
      <Drawer open={adHocOpen} onOpenChange={setAdHocOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setAdHocOpen(false)}
            aria-label={t("home.dealerVisit.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("home.dealerVisit.adHocTitle")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {t("home.dealerVisit.adHocSubtitle")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("home.dealerVisit.channelMember")}</label>
              <Select value={member} onValueChange={setMember}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder={t("home.dealerVisit.selectMember")} />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">{t("home.dealerVisit.reason")}</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder={t("home.dealerVisit.selectReason")} />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("home.dealerVisit.notesPlaceholder")}
              className="rounded-xl min-h-[90px]"
            />
            <button
              onClick={submitAdHoc}
              disabled={!member || !reason}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
            >
              {t("home.dealerVisit.submit")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl text-center">
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-semibold text-foreground">{t("home.dealerVisit.successTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("home.dealerVisit.successText")}</p>
            <button
              onClick={() => { setSuccessOpen(false); navigate("/"); }}
              className="w-full mt-2 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("home.dealerVisit.goHome")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DealerVisitWidget;
