import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import EmptyState from "@/components/EmptyState";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import { PREPAID_PLANS, POSTPAID_PLANS } from "@/pages/NewActivation";
import PlanCard from "@/components/PlanCard";
import { useCvmOfferText, OfferCard, OfferRow } from "@/components/CvmOfferBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CANCEL_REASONS } from "@/lib/cancelReasons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CVM_CUSTOMERS, cvmOfferTarget, type CvmCustomer, type CvmOffer, type CvmOfferKind } from "@/lib/cvmOffers";
import { AlertCircle, ClipboardList, Gift, Phone, Search, SlidersHorizontal, X } from "lucide-react";

// Customer Offers (CVM, from Pelatro): MSISDN → OTP → every offer Pelatro has for the customer.
// Built only from the same pieces as the other customer flows (Change Prepaid Plan etc.):
// FlowStepper, Field + PhoneNumberInput, OTP drawer, CardSection/SummaryRow cards, plan-type
// chips, confirm drawer, SuccessBottomSheet and the red-hexagon lookup error.

const SECTIONS: { key: string; kinds: CvmOfferKind[] }[] = [
  { key: "recharge", kinds: ["recharge"] },
  { key: "plans", kinds: ["changePlan", "postpaidPlan"] },
  { key: "btl", kinds: ["btl"] },
  { key: "direct", kinds: ["direct"] },
  { key: "bill", kinds: ["billFull", "billWaiver", "billWaiverDiscount"] },
  { key: "migration", kinds: ["migration"] },
];

const CTA_KEY: Record<CvmOfferKind, string> = {
  recharge: "ctaTopUp",
  btl: "ctaSubscribe",
  changePlan: "ctaChangePlan",
  postpaidPlan: "ctaChangePlan",
  direct: "ctaOptIn",
  billFull: "ctaPayBill",
  billWaiver: "ctaPayBill",
  billWaiverDiscount: "ctaPayBill",
  migration: "ctaMigrate",
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const CustomerOffers = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const offerText = useCvmOfferText();
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  // Picked in the sheet, applied on "Apply" — same as Order History's filter sheet.
  const [draftFilter, setDraftFilter] = useState("all");

  const [step, setStep] = useState(0);
  // Once past step 0, going back no longer offers an easy back-to-Home — only Close (with the
  // cancel-reason prompt), same as every other customer flow.
  const [everProgressed, setEverProgressed] = useState(false);
  useEffect(() => { if (step > 0) setEverProgressed(true); }, [step]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherText, setCancelOtherText] = useState("");
  const closeCancel = () => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); };
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msisdn, setMsisdn] = useState("0501234567");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<CvmCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);

  const [optIn, setOptIn] = useState<CvmOffer | null>(null);
  const [claimed, setClaimed] = useState<string[]>([]);
  const [reference, setReference] = useState("");

  // ---------- MSISDN auto-lookup (same debounced check as the other MSISDN flows) ----------
  useEffect(() => {
    setCustomer(null);
    setLookupError(null);
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = CVM_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) return setLookupError(t("customerOffers.errorNotFound"));
      if (found.status === "terminated") return setLookupError(t("customerOffers.errorTerminated"));
      setCustomer(found);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn]);

  // ---------- OTP (same behaviour as Change Prepaid Plan's) ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(interval);
  }, [otpOpen]);

  const setOtpDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      if (d && i === 3) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "1111") return setOtpError(true);
          setOtpError(false);
          setOtpOpen(false);
          setStep(1);
        }, 300);
      }
      return next;
    });
    if (d && i < 3) (document.getElementById(`cvm-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    (document.getElementById("cvm-otp-0") as HTMLInputElement | null)?.focus();
  };

  const openOffer = (o: CvmOffer) => {
    const target = cvmOfferTarget(o, msisdn);
    if (target) navigate(target.path, { state: target.state });
    else setOptIn(o);
  };

  const offers = (customer?.offers ?? []).filter((o) => !claimed.includes(o.id));
  const sections = SECTIONS.map((s) => ({ ...s, offers: offers.filter((o) => s.kinds.includes(o.kind)) })).filter((s) => s.offers.length);
  const q = search.trim().toLowerCase();
  const matches = (o: CvmOffer) => {
    if (!q) return true;
    const { title, benefits } = offerText(o);
    return `${title} ${benefits ?? ""}`.toLowerCase().includes(q);
  };
  const visible = sections
    .filter((s) => filter === "all" || s.key === filter)
    .map((s) => ({ ...s, offers: s.offers.filter(matches) }))
    .filter((s) => s.offers.length);
  // Only an offer still on screen counts — searching/filtering it away clears the action.
  const selectedOffer = visible.flatMap((s) => s.offers).find((o) => o.id === selectedId) ?? null;

  const steps = [
    { label: t("customerOffers.stepNumber"), Icon: Phone },
    { label: t("customerOffers.stepOffers"), Icon: Gift },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("customerOffers.pageTitle")}
        showBack={step > 0 || !everProgressed}
        onBackClick={() => { if (step === 0) navigate("/"); else { setStep(0); setSelectedId(null); } }}
        rightElement={
          (step > 0 || everProgressed) ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Number ── */}
        {step === 0 && (
          <>
            <Field label={t("customerOffers.msisdn")}>
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} icon={<Phone className="w-4 h-4" />} />
              {checking && <p className="text-[11px] text-muted-foreground">{t("customerOffers.checking")}</p>}
            </Field>
            <PrototypeTestBox
              heading={t("customerOffers.testHeading")}
              description={t("customerOffers.testDescription")}
              items={[
                { value: "0501234567", note: t("customerOffers.testPrepaid"), group: t("customerOffers.testGroupOffers") },
                { value: "0502222211", note: t("customerOffers.testPostpaid"), group: t("customerOffers.testGroupOffers") },
                { value: "0501234512", note: t("customerOffers.testNoOffers"), group: t("customerOffers.testGroupOther") },
                { value: "0501234533", note: t("customerOffers.testTerminated"), group: t("customerOffers.testGroupOther") },
                { value: "0509999999", note: t("customerOffers.testNotFound"), group: t("customerOffers.testGroupOther") },
              ]}
              onSelect={setMsisdn}
            />
          </>
        )}

        {/* ── Step 1: Offers ── */}
        {step === 1 && customer && (
          <>
            {/* Current Plan — same header pill + PlanCard as Subscription Migration's. */}
            {(() => {
              const p = [...PREPAID_PLANS, ...POSTPAID_PLANS].find((x) => x.title === customer.planName);
              if (!p) return null;
              const cats = p.categories ?? [];
              const layout: "flex" | "postpaid" | "baqa" | "aman" = cats.includes("switch-postpaid")
                ? "postpaid"
                : cats.includes("aman")
                ? "aman"
                : cats.includes("base-plan")
                ? "baqa"
                : "flex";
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 px-1 mb-3 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{t("customerOffers.currentPlan")}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
                      <ClipboardList className="w-3 h-3" />
                      {t(customer.type === "prepaid" ? "customerOffers.prepaid" : "customerOffers.postpaid")} · {customer.planName}
                    </span>
                  </div>
                  <PlanCard
                    plan={{ ...p, badge: undefined }}
                    selected
                    active
                    onSelect={() => {}}
                    hideRadio
                    minsLabel={cats.includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                    layout={layout}
                  />
                </div>
              );
            })()}

            {sections.length === 0 ? (
              <EmptyState icon={Gift} title={t("customerOffers.emptyTitle")} description={t("customerOffers.emptyDesc")} />
            ) : (
              <>
                {/* Search + filter — same pair as Order History / All Plans. */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("customerOffers.searchPlaceholder")}
                      className="h-11 bg-card rounded-xl ps-9"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setDraftFilter(filter); setFilterOpen(true); }}
                    aria-label={t("customerOffers.filterTitle")}
                    className="relative w-11 h-11 rounded-xl bg-card shadow-sm border border-border/60 flex items-center justify-center shrink-0"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                  </button>
                </div>

                {filter !== "all" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 ps-3 pe-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {t(`customerOffers.section.${filter}`)}
                      <button type="button" onClick={() => setFilter("all")} aria-label={t("customerOffers.removeFilter")} className="w-4 h-4 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                )}

                {visible.length === 0 && (
                  <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
                    {t("customerOffers.noMatch")}
                  </div>
                )}

                {visible.map((s) => (
                  <div key={s.key} className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground px-1">{t(`customerOffers.section.${s.key}`)}</h3>
                    {s.offers.map((o) => {
                      const { title, benefits, note } = offerText(o);
                      return (
                        <OfferCard key={o.id} title={title} selected={selectedId === o.id} onClick={() => setSelectedId(o.id)}>
                          {benefits && <OfferRow label={t("customerOffers.benefits")} value={benefits} />}
                          <OfferRow label={t("customerOffers.validUntilLabel")} value={o.validUntil} />
                          {note && <p className="text-[11px] text-muted-foreground leading-snug pt-2">{note}</p>}
                        </OfferCard>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom — pick an offer, then one primary action (same as picking a plan). */}
      {(step === 0 || sections.length > 0) && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            {step === 0 ? (
              <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!customer} onClick={() => setOtpOpen(true)}>
                {t("customerOffers.verifyAndContinue")}
              </Button>
            ) : (
              <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!selectedOffer} onClick={() => selectedOffer && openOffer(selectedOffer)}>
                {selectedOffer ? t(`customerOffers.${CTA_KEY[selectedOffer.kind]}`) : t("customerOffers.continue")}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("customerOffers.otpTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("customerOffers.otpIncorrect") : t("customerOffers.otpSent", { msisdn })}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`cvm-otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigitAt(i, e.target.value)}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 text-center text-base font-semibold focus:outline-none",
                    otpError ? "border-destructive text-destructive" : "border-border focus:border-primary text-foreground",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("customerOffers.didntReceive")}{" "}
              {otpError || otpSecondsLeft === 0 ? (
                <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("customerOffers.resend")}</button>
              ) : (
                <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Free gift opt-in — same confirm drawer as Change Prepaid Plan's. */}
      <Drawer open={!!optIn} onOpenChange={(o) => !o && setOptIn(null)}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          {optIn && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-sky-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">{t("customerOffers.optInTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("customerOffers.optInDesc", { gift: offerText(optIn).benefits, msisdn })}
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <Button
                  className="w-full h-12 rounded-full font-semibold"
                  onClick={() => {
                    setClaimed((c) => [...c, optIn.id]);
                    setSelectedId(null);
                    setOptIn(null);
                    setReference(`CVM-${Math.floor(100000 + Math.random() * 900000)}`);
                  }}
                >
                  {t("customerOffers.yesConfirm")}
                </Button>
                <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setOptIn(null)}>
                  {t("customerOffers.cancel")}
                </button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      <SuccessBottomSheet
        open={!!reference}
        onClose={() => { setReference(""); navigate("/"); }}
        orderId={reference}
        title={t("customerOffers.optInSuccessTitle")}
        message={t("customerOffers.optInSuccess")}
      />

      {/* Filter sheet — same layout as All Plans' filter sheet. */}
      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh] overflow-hidden">
          <button
            onClick={() => setFilterOpen(false)}
            aria-label={t("customerOffers.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("customerOffers.filterTitle")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 px-4 pb-8 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{t("customerOffers.offerType")}</h3>
              <div className="flex flex-wrap gap-2">
                {["all", ...sections.map((s) => s.key)].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraftFilter(key)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                      draftFilter === key ? "bg-primary text-white" : "bg-muted text-foreground",
                    )}
                  >
                    {t(`customerOffers.section.${key}`)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setFilter(draftFilter); setFilterOpen(false); }}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("customerOffers.applyFilters")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Cancel flow (top-right X) — same cancel-reason sheet as the other customer flows. */}
      <Drawer open={cancelOpen} onOpenChange={(o) => (o ? setCancelOpen(true) : closeCancel())}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <DrawerHeader className="text-start px-0 pb-4">
            <DrawerTitle>{t("customerOffers.cancelSheet.title")}</DrawerTitle>
            <DrawerDescription>{t("customerOffers.cancelSheet.subtitle")}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">{t("changePrepaidBundle.cancelSheet.reasonLabel")} <span className="text-destructive">*</span></label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger className="h-12 px-4 bg-white border border-border/60 rounded-xl text-sm">
                  <SelectValue placeholder={t("changePrepaidBundle.cancelSheet.selectReason")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60 rounded-xl">
                  {CANCEL_REASONS.customerOffers.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{t(`cancelReasons.${r.labelKey}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cancelReason === "other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-sm font-semibold text-foreground">{t("changePrepaidBundle.cancelSheet.specify")} <span className="text-destructive">*</span></label>
                <Textarea value={cancelOtherText} onChange={(e) => setCancelOtherText(e.target.value)} placeholder={t("changePrepaidBundle.cancelSheet.specifyPlaceholder")} className="min-h-[100px] px-4 py-3 bg-white border border-border/60 rounded-xl text-sm resize-none rtl:text-right" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-6">
            <Button disabled={!cancelReason || (cancelReason === "other" && !cancelOtherText.trim())} onClick={() => { closeCancel(); navigate("/"); }} className="w-full h-11 rounded-full">{t("changePrepaidBundle.cancelSheet.confirm")}</Button>
            <Button variant="outline" onClick={closeCancel} className="w-full h-11 rounded-full border-primary text-primary">{t("changePrepaidBundle.cancelSheet.keepEditing")}</Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Lookup error — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => !o && setLookupError(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("customerOffers.errorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button onClick={() => setLookupError(null)} className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm">
            {t("customerOffers.gotIt")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerOffers;
