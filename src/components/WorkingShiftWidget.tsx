import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { AlertCircle, Calendar, ChevronRight, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StoreLocationMap from "@/components/StoreLocationMap";
import { cn } from "@/lib/utils";

// Prototype-only demo shift — no scheduling backend to source this from yet. Toggling
// hasShiftToday to false previews the "no shift scheduled" empty state from the design.
const DEMO_SHIFT = {
  hasShiftToday: true,
  start: "10:00 AM",
  end: "6:00 PM",
  startHour: 10,
  endHour: 18,
  storeNameKey: "home.workingShift.storeName",
  storeLocationKey: "home.workingShift.storeLocation",
};

const STATUS_STYLE: Record<"not-checked-in" | "ongoing" | "completed", string> = {
  "not-checked-in": "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

type JustifyKind = "checkin-late" | "checkout-early" | "checkout-late";

const WorkingShiftWidget = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [justifyOpen, setJustifyOpen] = useState<JustifyKind | null>(null);
  const [reason, setReason] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [mapOpen, setMapOpen] = useState(false);

  const status: "not-checked-in" | "ongoing" | "completed" = checkOutTime ? "completed" : checkInTime ? "ongoing" : "not-checked-in";

  const STATUS_LABEL: Record<typeof status, string> = {
    "not-checked-in": t("home.workingShift.statusNotCheckedIn"),
    ongoing: t("home.workingShift.statusOngoing"),
    completed: t("home.workingShift.statusCompleted"),
  };

  const JUSTIFY_CONTENT: Record<JustifyKind, { title: string; subtitle: string }> = {
    "checkin-late": { title: t("home.workingShift.lateCheckinTitle"), subtitle: t("home.workingShift.lateCheckinSubtitle") },
    "checkout-early": { title: t("home.workingShift.earlyCheckoutTitle"), subtitle: t("home.workingShift.earlyCheckoutSubtitle") },
    "checkout-late": { title: t("home.workingShift.lateCheckoutTitle"), subtitle: t("home.workingShift.lateCheckoutSubtitle") },
  };

  const REASON_OPTIONS: Record<JustifyKind, string[]> = {
    "checkin-late": [
      t("home.workingShift.reasons.lateCheckin.traffic"),
      t("home.workingShift.reasons.lateCheckin.publicTransport"),
      t("home.workingShift.reasons.lateCheckin.personalEmergency"),
      t("home.workingShift.reasons.lateCheckin.overslept"),
      t("home.workingShift.reasons.lateCheckin.other"),
    ],
    "checkout-early": [
      t("home.workingShift.reasons.earlyCheckout.personalEmergency"),
      t("home.workingShift.reasons.earlyCheckout.feelingUnwell"),
      t("home.workingShift.reasons.earlyCheckout.approvedLeave"),
      t("home.workingShift.reasons.earlyCheckout.other"),
    ],
    "checkout-late": [
      t("home.workingShift.reasons.lateCheckout.highVolume"),
      t("home.workingShift.reasons.lateCheckout.closingTasks"),
      t("home.workingShift.reasons.lateCheckout.teamMeeting"),
      t("home.workingShift.reasons.lateCheckout.systemIssue"),
      t("home.workingShift.reasons.lateCheckout.other"),
    ],
  };

  const openJustify = (kind: JustifyKind) => {
    setReason("");
    setReasonText("");
    setJustifyOpen(kind);
  };

  // Check-in/out land on time, early, or late relative to the fixed demo shift window —
  // late check-in and off-schedule check-out both need a justification before they record.
  const handleCheckInClick = () => {
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(DEMO_SHIFT.startHour, 0, 0, 0);
    if (now > shiftStart) openJustify("checkin-late");
    else setCheckInTime(format(now, "h:mm a"));
  };

  const handleCheckOutClick = () => {
    const now = new Date();
    const shiftEnd = new Date(now);
    shiftEnd.setHours(DEMO_SHIFT.endHour, 0, 0, 0);
    if (now < shiftEnd) openJustify("checkout-early");
    else if (now > shiftEnd) openJustify("checkout-late");
    else setCheckOutTime(format(now, "h:mm a"));
  };

  const handleJustifySubmit = () => {
    const now = format(new Date(), "h:mm a");
    if (justifyOpen === "checkin-late") setCheckInTime(now);
    else setCheckOutTime(now);
    setJustifyOpen(null);
  };

  return (
    <div className="px-4 mb-4">
      <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">{t("home.workingShift.title")}</h3>
          <button
            type="button"
            onClick={() => navigate("/my-shifts")}
            className="flex items-center gap-1 text-link text-sm font-medium"
          >
            {t("home.workingShift.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>

        {!DEMO_SHIFT.hasShiftToday ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">{t("home.workingShift.noShiftsTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("home.workingShift.noShiftsSubtitle")}</p>
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-xl p-3 mb-3 flex items-center justify-between gap-2">
              <div>
                <p dir="ltr" className="text-sm font-semibold text-foreground">{DEMO_SHIFT.start} - {DEMO_SHIFT.end}</p>
                <p className="text-xs text-muted-foreground">{t("home.workingShift.today")}, {format(new Date(), "d MMM")}</p>
              </div>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium shrink-0", STATUS_STYLE[status])}>
                {STATUS_LABEL[status]}
              </span>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{t(DEMO_SHIFT.storeNameKey)}</p>
                  <p className="text-xs text-muted-foreground truncate">{t(DEMO_SHIFT.storeLocationKey)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-medium shrink-0"
              >
                {t("home.workingShift.viewMap")}
              </button>
            </div>

            {(checkInTime || checkOutTime) && (
              <div className="flex gap-2 mb-3">
                {checkInTime && (
                  <span className="flex-1 text-center px-2 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium">
                    ✓ {t("home.workingShift.checkInLabel")}: <bdi dir="ltr">{checkInTime}</bdi>
                  </span>
                )}
                {checkOutTime && (
                  <span className="flex-1 text-center px-2 py-1.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 text-xs font-medium">
                    ✓ {t("home.workingShift.checkOutLabel")}: <bdi dir="ltr">{checkOutTime}</bdi>
                  </span>
                )}
              </div>
            )}

            {status === "not-checked-in" && (
              <button type="button" onClick={handleCheckInClick} className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm">
                {t("home.workingShift.checkIn")}
              </button>
            )}
            {status === "ongoing" && (
              <button type="button" onClick={handleCheckOutClick} className="w-full py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm">
                {t("home.workingShift.checkOut")}
              </button>
            )}
          </>
        )}
      </div>

      {/* Late check-in / early or late check-out justification */}
      <Drawer open={justifyOpen !== null} onOpenChange={(o) => !o && setJustifyOpen(null)}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="relative flex items-center justify-center pb-3">
            <h3 className="text-lg font-bold text-foreground">{t("home.workingShift.confirmationMessage")}</h3>
            <DrawerClose className="absolute end-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>

          {justifyOpen && (
            <>
              <div className="flex flex-col items-center gap-3 text-center pb-2">
                <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-7 h-7 text-sky-500" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-sky-600 dark:text-sky-400 mb-1">{JUSTIFY_CONTENT[justifyOpen].title}</h4>
                  <p className="text-sm text-muted-foreground">{JUSTIFY_CONTENT[justifyOpen].subtitle}</p>
                </div>
              </div>

              <div className="space-y-3 text-start mt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("home.workingShift.reasonLabel")}</label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger className="w-full bg-card rounded-xl h-12"><SelectValue placeholder={t("home.workingShift.selectTheReason")} /></SelectTrigger>
                    <SelectContent className="bg-card">
                      {REASON_OPTIONS[justifyOpen].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{t("home.workingShift.reasonTextLabel")}</label>
                  <Textarea value={reasonText} onChange={(e) => setReasonText(e.target.value)} placeholder={t("home.workingShift.reasonTextPlaceholder")} className="bg-card rounded-xl resize-none" rows={3} />
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                <Button className="w-full h-12 rounded-full font-semibold" disabled={!reason} onClick={handleJustifySubmit}>
                  {t("home.workingShift.submit")}
                </Button>
                <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setJustifyOpen(null)}>
                  {t("home.workingShift.cancel")}
                </button>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <StoreLocationMap
        open={mapOpen}
        onOpenChange={setMapOpen}
        storeName={t(DEMO_SHIFT.storeNameKey)}
        storeLocation={t(DEMO_SHIFT.storeLocationKey)}
      />
    </div>
  );
};

export default WorkingShiftWidget;
