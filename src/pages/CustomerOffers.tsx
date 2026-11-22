import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import EmptyState from "@/components/EmptyState";
import { SuccessBottomSheet } from "@/components/SuccessBottomSheet";
import { PREPAID_PLANS, POSTPAID_PLANS, FRIENDI_PLANS } from "@/pages/NewActivation";
import { useBrand } from "@/contexts/BrandContext";
import PlanCard from "@/components/PlanCard";
import { useCvmOfferText } from "@/components/CvmOfferBanner";
import CvmOfferTile, { OfferAction } from "@/components/CvmOfferTile";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CANCEL_REASONS } from "@/lib/cancelReasons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { primeKeyboard, releaseKeyboard } from "@/lib/keyboard";
import { CVM_CUSTOMERS, cvmOfferTarget, type CvmCustomer, type CvmOffer, type CvmOfferKind } from "@/lib/cvmOffers";
import { AlertCircle, Check, ClipboardList, Gift, Phone, RotateCcw, Search, X, XCircle } from "lucide-react";

// Customer Offers (CVM, from Pelatro): MSISDN → OTP → every offer Pelatro has for the customer.
// Built only from the same pieces as the other customer flows (Change Prepaid Plan etc.):
// FlowStepper, Field + PhoneNumberInput, OTP drawer, CardSection/SummaryRow cards, plan-type
// chips, confirm drawer, SuccessBottomSheet and the red-hexagon lookup error.

const SECTIONS: { key: string; kinds: CvmOfferKind[] }[] = [
  // Free gifts first (instant, no payment), then recharge, plans (plan offers + special plans).
  { key: "direct", kinds: ["direct"] },
  { key: "recharge", kinds: ["recharge"] },
  { key: "plans", kinds: ["changePlan", "postpaidPlan", "btl"] },
  { key: "bill", kinds: ["billFull", "billWaiver", "billWaiverDiscount"] },
  { key: "migration", kinds: ["migration"] },
];

const CTA_KEY: Record<CvmOfferKind, string> = {
  recharge: "ctaTopUp",
  btl: "ctaChangePlan",
  changePlan: "ctaChangePlan",
  postpaidPlan: "ctaChangePlan",
  direct: "ctaOptIn",
  billFull: "ctaPayBill",
  billWaiver: "ctaPayBill",
  billWaiverDiscount: "ctaPayBill",
  migration: "ctaMigrate",
};

// Used offers stay hidden while navigating, but a page refresh starts clean (this runs once per page load).
try { Object.keys(sessionStorage).filter((k) => k.startsWith("cvmClaimed:")).forEach((k) => sessionStorage.removeItem(k)); } catch { /* storage unavailable */ }

const MAX_OTP_ATTEMPTS = 3;
const SHOW_CURRENT_PLAN = false;
// Offer count above which the text search shows (below it the type chips are enough).
const SEARCH_MIN_OFFERS = 6;

const planOf = (title: string) => [...PREPAID_PLANS, ...POSTPAID_PLANS, ...FRIENDI_PLANS].find((x) => x.title === title);
const layoutOf = (cats: string[]): "flex" | "postpaid" | "baqa" | "aman" | "combo" =>
  cats.includes("switch-postpaid") ? "postpaid"
  : cats.includes("combo") || cats.includes("flexi") ? "combo"
  : cats.includes("aman") ? "aman"
  : cats.includes("base-plan") ? "baqa"
  : "flex";
const PLAN_KINDS: CvmOfferKind[] = ["changePlan", "postpaidPlan", "btl"];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const CustomerOffers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const offerText = useCvmOfferText();
  const chipsDragScroll = useDragScroll<HTMLDivElement>();
  const [resume] = useState(() => {
    const r = (location.state as { cvmResume?: { msisdn: string; used: string } } | null)?.cvmResume;
    const c = r && CVM_CUSTOMERS.find((x) => x.msisdn === r.msisdn);
    return r && c ? { customer: c, used: r.used } : null;
  });
  const { brand, setBrand } = useBrand();
  // Number belongs to the other brand (FM number while on VM, or the reverse) — offer to switch.
  const [brandMismatch, setBrandMismatch] = useState<CvmCustomer | null>(null);
  const [search, setSearch] = useState("");

  const [step, setStep] = useState(resume ? 1 : 0);
  // Once past step 0, going back no longer offers an easy back-to-Home — only Close (with the
  // cancel-reason prompt), same as every other customer flow.
  const [everProgressed, setEverProgressed] = useState(false);
  useEffect(() => { if (step > 0) setEverProgressed(true); }, [step]);
  // Each stage opens at its top (the pages scroll in different containers, so reset them all).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("root")?.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>(".mobile-container").forEach((el) => el.scrollTo(0, 0));
  }, [step]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOtherText, setCancelOtherText] = useState("");
  const closeCancel = () => { setCancelOpen(false); setCancelReason(""); setCancelOtherText(""); };
  const [msisdn, setMsisdn] = useState(resume?.customer.msisdn ?? "0501234567");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<CvmCustomer | null>(resume?.customer ?? null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  // Result popup after the 4th digit. Wrong code (1111 in the prototype) up to 3 times → blocked.
  const [otpResult, setOtpResult] = useState<null | "verified" | "wrong" | "blocked">(null);
  const [otpAttempts, setOtpAttempts] = useState(0);
  // Keep showing the last result while the popup fades out, otherwise a closing "verified" briefly flips to the error layout.
  const lastOtpResult = useRef<"verified" | "wrong" | "blocked">("verified");
  if (otpResult) lastOtpResult.current = otpResult;
  // Closing "verified" always moves on to the offers; closing an error just dismisses it.
  const closeOtpResult = () => {
    if (otpResult === "verified") setStep(1);
    if (otpResult === "blocked") setOtpAttempts(0);
    setOtpResult(null);
  };
  // "Verified" moves on to the offers by itself after 1.5s.
  useEffect(() => {
    if (otpResult !== "verified") return;
    const timer = setTimeout(() => { setOtpResult(null); setStep(1); }, 1500);
    return () => clearTimeout(timer);
  }, [otpResult]);

  const [optIn, setOptIn] = useState<CvmOffer | null>(null);
  // Used offers are remembered per number for the session, so finishing a second offer
  // never brings an earlier used one back.
  const [claimed, setClaimed] = useState<string[]>(() => {
    if (!resume) return [];
    const key = `cvmClaimed:${resume.customer.msisdn}`;
    let prev: string[] = [];
    try { prev = JSON.parse(sessionStorage.getItem(key) || "[]"); } catch { prev = []; }
    const all = Array.from(new Set([...prev, resume.used].filter(Boolean)));
    sessionStorage.setItem(key, JSON.stringify(all));
    return all;
  });
  useEffect(() => {
    if (!customer) return;
    const key = `cvmClaimed:${customer.msisdn}`;
    let prev: string[] = [];
    try { prev = JSON.parse(sessionStorage.getItem(key) || "[]"); } catch { prev = []; }
    const all = Array.from(new Set([...prev, ...claimed]));
    if (all.length !== claimed.length) setClaimed(all);
    sessionStorage.setItem(key, JSON.stringify(all));
  }, [customer, claimed]);
  // Opt-in failed (prototype: first try of a "failsOptIn" gift) → failure sheet with Try again.
  const [optInFailed, setOptInFailed] = useState<CvmOffer | null>(null);
  const [failedOnce, setFailedOnce] = useState<string[]>([]);
  // Offer expired / already used by the time the dealer accepts it.
  const [goneOffer, setGoneOffer] = useState<CvmOffer | null>(null);
  // Loading offers from Pelatro: loading → ready, or error with Try again.
  const [load, setLoad] = useState<"error" | "ready">("ready");
  const [loadFailedFor, setLoadFailedFor] = useState<string[]>([]);
  // No loading step between stages (same as SIM Activation): offers show instantly. Only the
  // prototype's "Pelatro down" number lands on the error card, before the first paint.
  const loadOffers = () => {
    if (!customer) return;
    if (customer.offersFailFirst && !loadFailedFor.includes(customer.msisdn)) {
      setLoadFailedFor((l) => [...l, customer.msisdn]);
      setLoad("error");
    } else setLoad("ready");
  };
  useLayoutEffect(() => {
    if (step === 1) loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, customer?.msisdn]);
  const [reference, setReference] = useState("");

  // ---------- MSISDN check — runs on "Verify & Continue", not while typing or picking a test number ----------
  useEffect(() => {
    setCustomer((c) => (c && c.msisdn === msisdn ? c : null));
    setLookupError(null);
    setOtpAttempts(0);
  }, [msisdn]);

  const verifyNumber = () => {
    primeKeyboard();
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = CVM_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) { releaseKeyboard(); return setLookupError(t("customerOffers.errorNotFound")); }
      if (found.status === "terminated") { releaseKeyboard(); return setLookupError(t("customerOffers.errorTerminated")); }
      if (found.brand !== brand) { releaseKeyboard(); return setBrandMismatch(found); }
      setCustomer(found);
      setOtpOpen(true);
    }, 800);
  };

  // ---------- OTP (same behaviour as Change Prepaid Plan's) ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    // Cursor starts in the first box once the sheet has slid up, so the dealer can type straight away.
    const focusTimer = setTimeout(() => (document.getElementById("cvm-otp-0") as HTMLInputElement | null)?.focus(), 350);
    return () => { clearInterval(interval); clearTimeout(focusTimer); };
  }, [otpOpen]);

  const setOtpDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[i] = d;
    setOtpDigits(next);
    // Last digit entered → close the sheet and show the result popup (verified / not verified / blocked).
    if (d && i === 3 && next.every(Boolean)) {
      const code = next.join("");
      setTimeout(() => {
        setOtpOpen(false);
        if (code !== "1111") {
          setOtpAttempts(0);
          setOtpResult("verified");
          return;
        }
        const n = otpAttempts + 1;
        setOtpAttempts(n);
        setOtpResult(n >= MAX_OTP_ATTEMPTS ? "blocked" : "wrong");
      }, 300);
    }
    if (d && i < 3) (document.getElementById(`cvm-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    (document.getElementById("cvm-otp-0") as HTMLInputElement | null)?.focus();
  };

  const openOffer = (o: CvmOffer) => {
    if (o.goneOnAccept) return setGoneOffer(o);
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

  const steps = [
    { label: t("customerOffers.stepNumber"), Icon: Phone },
    { label: t("customerOffers.stepOffers"), Icon: Gift },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("customerOffers.pageTitle")}
        showBack={step > 0 || !everProgressed}
        onBackClick={() => { if (step === 0) navigate("/"); else setStep(0); }}
        rightElement={
          (step > 0 || everProgressed) ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      {/* Hidden: only two stages, so the stepper adds height without showing real progress (same as Bill Payment). Uncomment to bring it back. */}
      {/* <FlowStepper current={step} steps={steps} /> */}

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
                { value: "0501234544", note: t("customerOffers.testFriendi"), group: t("customerOffers.testGroupOffers") },
                { value: "0501234599", note: t("customerOffers.testPelatroDown"), group: t("customerOffers.testGroupOther") },
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
            {/* Current Plan — same header pill + PlanCard as Subscription Migration's. Hidden for
                now so the offers start right under the stepper; flip SHOW_CURRENT_PLAN to bring it back. */}
            {SHOW_CURRENT_PLAN && (() => {
              const p = planOf(customer.planName);
              if (!p) return null;
              const cats = p.categories ?? [];
              const layout = layoutOf(cats);
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

            {load === "error" ? (
              <div className="bg-card rounded-2xl p-6 shadow-sm text-center">
                <div className="mx-auto mb-3 relative w-14 h-14 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
                    <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
                  </svg>
                  <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
                </div>
                <p className="font-semibold text-foreground mb-1">{t("customerOffers.loadErrorTitle")}</p>
                <p className="text-sm text-muted-foreground mb-4 leading-snug">{t("customerOffers.loadErrorDesc")}</p>
                <Button variant="outline" onClick={loadOffers} className="h-11 rounded-full border-primary text-primary px-6">
                  <RotateCcw className="w-4 h-4" /> {t("customerOffers.tryAgain")}
                </Button>
              </div>
            ) : sections.length === 0 ? (
              <EmptyState icon={Gift} title={t("customerOffers.emptyTitle")} description={t("customerOffers.emptyDesc")} />
            ) : (
              <>
                {/* Text search only earns its place on a long list. */}
                {offers.length > SEARCH_MIN_OFFERS && (
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("customerOffers.searchPlaceholder")}
                      className="h-11 bg-card rounded-xl ps-9"
                    />
                  </div>
                )}

                {/* Offer-type chips, visible by default — same pattern as Change Prepaid Plan's plan-type chips. */}
                {sections.length > 1 && (
                  <div
                    {...chipsDragScroll}
                    className={cn("flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", chipsDragScroll.className)}
                  >
                    {[{ key: "all", count: offers.length }, ...sections.map((x) => ({ key: x.key, count: x.offers.length }))].map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setFilter(c.key)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5",
                          filter === c.key ? "bg-primary text-white" : "bg-card text-foreground shadow-sm",
                        )}
                      >
                        {t(`customerOffers.section.${c.key}`)}
                        <span className={cn("min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center", filter === c.key ? "bg-white/25 text-white" : "bg-primary text-primary-foreground")}>{c.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                {visible.length === 0 && (
                  <div className="bg-card rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-sm">
                    {t("customerOffers.noMatch")}
                  </div>
                )}

                {visible.map((s) => (
                  <div key={s.key} className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-sm font-semibold text-foreground">{t(`customerOffers.section.${s.key}`)}</h3>
                    </div>
                    {s.offers.map((o) => {
                      const { benefits } = offerText(o);
                      const plan = PLAN_KINDS.includes(o.kind) && "planTitle" in o ? planOf(o.planTitle) : undefined;
                      if (plan) {
                        return (
                          <PlanCard
                            key={o.id}
                            plan={{ ...plan, badge: undefined, bonuses: o.kind === "btl" || !benefits ? [] : benefits.split(" · ") }}
                            selected={false}
                            onSelect={() => {}}
                            hideRadio
                            layout={layoutOf(plan.categories ?? [])}
                            minsLabel={(plan.categories ?? []).includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                            footer={
                              <>
                                <p className="text-[11px] text-muted-foreground">
                                  {o.kind === "btl" ? `${t("customerOffers.btlRibbon")} • ` : o.kind === "changePlan" && o.renew ? `${t("customerOffers.renewRibbon")} • ` : ""}
                                  {t("customerOffers.validUntil", { date: o.validUntil })}
                                </p>
                                <OfferAction label={t(`customerOffers.${CTA_KEY[o.kind]}`)} onClick={() => openOffer(o)} />
                              </>
                            }
                          />
                        );
                      }
                      return (
                        <CvmOfferTile key={o.id} offer={o} action={<OfferAction label={t(`customerOffers.${CTA_KEY[o.kind]}`)} onClick={() => openOffer(o)} />} />
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom — number step only; on the offers step each card carries its own action. */}
      {step === 0 && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!/^\d{10}$/.test(msisdn) || checking} onClick={verifyNumber}>
              {t("customerOffers.verifyAndContinue")}
            </Button>
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
                    if (optIn.failsOptIn && !failedOnce.includes(optIn.id)) {
                      setFailedOnce((f) => [...f, optIn.id]);
                      setOptInFailed(optIn);
                      setOptIn(null);
                      return;
                    }
                    setClaimed((c) => [...c, optIn.id]);
                   
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
        hideAction
        open={!!reference}
        onClose={() => { setReference(""); navigate("/"); }}
        orderId={reference}
        title={t("customerOffers.optInSuccessTitle")}
        message={t("customerOffers.optInSuccess")}
      />

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

      {/* Opt-in failed — same failure sheet as Change Prepaid Plan's. */}
      <Drawer open={!!optInFailed} onOpenChange={(o) => !o && setOptInFailed(null)}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-destructive/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("customerOffers.optInFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("customerOffers.optInFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { const o = optInFailed; setOptInFailed(null); setOptIn(o); }}>
              {t("customerOffers.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setOptInFailed(null)}>
              {t("customerOffers.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Offer expired / already used between viewing and accepting — it drops off the list. */}
      <Dialog open={!!goneOffer} onOpenChange={(o) => { if (!o && goneOffer) { setClaimed((c) => [...c, goneOffer.id]); setGoneOffer(null); } }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-5 gap-0 text-center [&>button]:hidden">
          <div className="mx-auto mb-3 relative w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("customerOffers.goneTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-5 leading-snug">
            {goneOffer?.goneOnAccept === "used" ? t("customerOffers.goneUsed") : t("customerOffers.goneExpired")}
          </p>
          <button
            onClick={() => { if (goneOffer) setClaimed((c) => [...c, goneOffer.id]); setGoneOffer(null); }}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("customerOffers.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      {/* Number from the other brand — same blue-hexagon prompt as the app's confirm messages. */}
      <Dialog open={!!brandMismatch} onOpenChange={(o) => !o && setBrandMismatch(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-5 gap-0 text-center [&>button]:hidden">
          <button
            type="button"
            onClick={() => setBrandMismatch(null)}
            aria-label={t("customerOffers.close")}
            className="absolute end-3 top-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          {brandMismatch && (() => {
            const other = t(`customerOffers.brand.${brandMismatch.brand}`);
            return (
              <>
                <div className="mx-auto mb-3 relative w-14 h-14 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-sky-500" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
                    <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
                  </svg>
                  <AlertCircle className="w-7 h-7 text-sky-500 relative" strokeWidth={2} />
                </div>
                <h4 className="font-semibold text-sky-600 mb-1 text-lg">{t("customerOffers.brandMismatchTitle", { brand: other })}</h4>
                <p className="text-sm text-muted-foreground mb-5 leading-snug">
                  {t("customerOffers.brandMismatchDesc", { msisdn: brandMismatch.msisdn, brand: other, current: t(`customerOffers.brand.${brand}`) })}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const c = brandMismatch;
                      setBrandMismatch(null);
                      setBrand(c.brand);
                      // Brand loader plays first, then verification continues for this customer.
                      setTimeout(() => { setCustomer(c); setOtpOpen(true); }, 1300);
                    }}
                    className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
                  >
                    {t("customerOffers.brandSwitch", { brand: other })}
                  </button>
                  <button onClick={() => setBrandMismatch(null)} className="w-full py-2 text-sm font-semibold text-muted-foreground">
                    {t("customerOffers.cancel")}
                  </button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* OTP result — same popup shape as the lookup error: green for verified, red for not verified / blocked. */}
      <Dialog open={!!otpResult} onOpenChange={(o) => !o && closeOtpResult()}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-5 gap-0 text-center [&>button]:hidden">
          <button
            type="button"
            onClick={closeOtpResult}
            aria-label={t("customerOffers.close")}
            className="absolute end-3 top-3 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          {(() => {
            const shown = otpResult ?? lastOtpResult.current;
            const ok = shown === "verified";
            const tone = ok ? "text-emerald-600" : "text-destructive";
            const title = ok ? t("customerOffers.otpVerifiedTitle") : shown === "blocked" ? t("customerOffers.otpBlockedTitle") : t("customerOffers.otpWrongTitle");
            const desc = ok
              ? t("customerOffers.otpVerifiedDesc", { msisdn })
              : shown === "blocked"
              ? t("customerOffers.otpBlockedDesc")
              : t("customerOffers.otpWrongDesc", { count: MAX_OTP_ATTEMPTS - otpAttempts });
            return (
              <>
                <div className="mx-auto mb-3 relative w-14 h-14 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className={cn("absolute inset-0 w-full h-full", tone)} fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
                    <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
                  </svg>
                  {ok ? <Check className={cn("w-7 h-7 relative", tone)} strokeWidth={2.5} /> : <AlertCircle className={cn("w-7 h-7 relative", tone)} strokeWidth={2} />}
                </div>
                <h4 className={cn("font-semibold mb-1 text-lg", tone)}>{title}</h4>
                <p className="text-sm text-muted-foreground mb-5 leading-snug">{desc}</p>
                {ok ? (
                  // No button: the offers open on their own a moment later (or on X / tap outside).
                  <p className="text-xs text-muted-foreground -mt-2">{t("customerOffers.openingOffers")}</p>
                ) : shown === "wrong" ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setOtpResult(null); setOtpOpen(true); }} className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm">
                      {t("customerOffers.tryAgain")}
                    </button>
                    <button onClick={() => setOtpResult(null)} className="w-full py-2 text-sm font-semibold text-muted-foreground">
                      {t("customerOffers.cancel")}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setOtpResult(null); setOtpAttempts(0); }} className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm">
                    {t("customerOffers.gotIt")}
                  </button>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Lookup error — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => !o && setLookupError(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-5 gap-0 text-center [&>button]:hidden">
          <div className="mx-auto mb-3 relative w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("customerOffers.errorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-5 leading-snug">{lookupError}</p>
          <button onClick={() => setLookupError(null)} className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm">
            {t("customerOffers.gotIt")}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerOffers;
