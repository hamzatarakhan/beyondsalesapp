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
import { useCvmOfferText, OfferRow, CvmOfferSuccessNote } from "@/components/CvmOfferBanner";
import PayOption from "@/components/activation/PayOption";
import WalletShortNotice from "@/components/WalletShortNotice";
import { useWalletBalance } from "@/contexts/WalletBalanceContext";
import PinCodeSheet from "@/components/PinCodeSheet";
import RiyalSymbol from "@/components/RiyalSymbol";
import CvmOfferTile from "@/components/CvmOfferTile";
import { useDragScroll } from "@/hooks/useDragScroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CANCEL_REASONS } from "@/lib/cancelReasons";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CVM_CUSTOMERS, cvmRechargeBounds, cvmBillRequired, type CvmCustomer, type CvmOffer, type CvmOfferKind } from "@/lib/cvmOffers";
import { AlertCircle, ArrowLeftRight, Check, ClipboardList, CreditCard, Gift, Phone, Receipt, ReceiptText, Repeat, RotateCcw, Search, Send, Wallet, X, XCircle } from "lucide-react";

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
// Prototype: amount due on the postpaid customer's bill when a bill offer is reviewed.
const CVM_BILL_DUE = 300;
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

// Same card + title as the other flows' CardSection (icon chip + title, then rows).
const CardSection = ({ title, icon: Icon, children }: { title: string; icon: typeof ClipboardList; children: React.ReactNode }) => (
  <section className="bg-card rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    {children}
  </section>
);

const CustomerOffers3 = () => {
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

  // The offer ticked on the offers list; Continue (sticky footer) opens its Review stage.
  const [pick, setPick] = useState<string | null>(null);
  // Stage 3 (Review): the offer being reviewed, the recharge amount, PIN sheet and the success reference.
  const [selected, setSelected] = useState<CvmOffer | null>(null);
  const [amountText, setAmountText] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [migPlan, setMigPlan] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const { balance: walletBalance, justToppedUp } = useWalletBalance();
  const [doneRef, setDoneRef] = useState("");
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

  // ---------- MSISDN check — runs on "Verify & Continue", not while typing or picking a test number ----------
  useEffect(() => {
    setCustomer((c) => (c && c.msisdn === msisdn ? c : null));
    setLookupError(null);
    setOtpAttempts(0);
  }, [msisdn]);

  const verifyNumber = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = CVM_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) return setLookupError(t("customerOffers.errorNotFound"));
      if (found.status === "terminated") return setLookupError(t("customerOffers.errorTerminated"));
      if (found.brand !== brand) return setBrandMismatch(found);
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
    setSelected(o);
    setMigPlan(null);
    setPayMethod("wallet");
    setAmountText(o.kind === "recharge" && o.rule !== "any" ? String(o.minAmount) : "");
    setStep(o.kind === "migration" || (o.kind === "recharge" && o.rule !== "exact") ? 2 : 3);
  };
  const newRef = () => `CVM-${Math.floor(100000 + Math.random() * 900000)}`;
  // Confirm on Review: gifts opt in straight away (no payment), migration continues in its own flow,
  // everything else asks for the dealer PIN first.
  const confirmOffer = (o: CvmOffer) => {
    if (o.kind === "direct") {
      // Prototype: the first try of a "failsOptIn" gift fails, to show the failure sheet.
      if (o.failsOptIn && !failedOnce.includes(o.id)) {
        setFailedOnce((f) => [...f, o.id]);
        setOptInFailed(o);
        return;
      }
      return setDoneRef(newRef());
    }
    setPinOpen(true);
  };
  const finishOffer = () => {
    if (selected) setClaimed((c) => [...c, selected.id]);
    setPick(null);
    setDoneRef("");
    setSelected(null);
    setStep(1);
  };

  const offers = (customer?.offers ?? []).filter((o) => !claimed.includes(o.id));
  const pickedOffer = offers.find((o) => o.id === pick) ?? null;

  // Everything the Review stage needs for the selected offer: amount check, plan price, total to pay.
  const reviewInfo = (o: CvmOffer) => {
    const bounds = cvmRechargeBounds(o);
    const amount = amountText === "" ? 0 : Number(amountText);
    const amountOk = o.kind !== "recharge" || (amount > 0 && amount >= bounds.min && (bounds.max == null || amount <= bounds.max));
    const plan = "planTitle" in o ? planOf(o.planTitle) : undefined;
    const migPlanObj = o.kind === "migration" ? POSTPAID_PLANS.find((x) => x.title === migPlan) : undefined;
    const planPrice = o.kind === "btl" ? o.price : o.kind === "migration" ? migPlanObj?.price : plan?.price;
    const isBill = o.kind === "billFull" || o.kind === "billWaiver" || o.kind === "billWaiverDiscount";
    const pay = cvmBillRequired(o, CVM_BILL_DUE);
    const total = o.kind === "recharge" ? (amountOk ? amount : 0) : o.kind === "direct" ? 0 : isBill ? pay : planPrice ?? 0;
    const walletShort = total > walletBalance;
    const canConfirm = amountOk && (o.kind !== "migration" || !!migPlanObj) && (total === 0 || payMethod === "pos" || !walletShort);
    return { amount, amountOk, plan, migPlanObj, planPrice, isBill, pay, total, walletShort, canConfirm };
  };
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

  // Migration is the only offer where the dealer also picks a plan, so it gets its own "Plan" stage
  // (plan cards on their own step, then the checkout) like every other plan-changing flow.
  const needsDetail = !!selected && (selected.kind === "migration" || (selected.kind === "recharge" && selected.rule !== "exact"));
  const steps = [
    { label: t("customerOffers.stepNumber"), Icon: Phone },
    { label: t("customerOffers.stepOffers"), Icon: Gift },
    ...(needsDetail ? [selected?.kind === "migration" ? { label: t("customerOffers.stepPlan"), Icon: Repeat } : { label: t("customerOffers.stepAmount"), Icon: Send }] : []),
    { label: t("customerOffers.stepReview"), Icon: ClipboardList },
  ];
  const stepperCurrent = step === 3 && !needsDetail ? 2 : step;

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("customerOffers.pageTitle")}
        showBack={step > 0 || !everProgressed}
        onBackClick={() => {
          if (step === 0) navigate("/");
          else if (step === 3) { if (needsDetail) setStep(2); else { setSelected(null); setStep(1); } }
          else if (step === 2) { setSelected(null); setStep(1); }
          else setStep(0);
        }}
        rightElement={
          (step > 0 || everProgressed) ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      <FlowStepper current={stepperCurrent} steps={steps} />

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
                            selected={pick === o.id}
                            onSelect={() => setPick(o.id)}
                            layout={layoutOf(plan.categories ?? [])}
                            minsLabel={(plan.categories ?? []).includes("switch-postpaid") ? t("activation.plan.localMins") : t("activation.plan.flexMins")}
                            footer={
                              <>
                                <p className="text-[11px] text-muted-foreground">
                                  {o.kind === "btl" ? `${t("customerOffers.btlRibbon")} • ` : o.kind === "changePlan" && o.renew ? `${t("customerOffers.renewRibbon")} • ` : ""}
                                  {t("customerOffers.validUntil", { date: o.validUntil })}
                                </p>
                              </>
                            }
                          />
                        );
                      }
                      return (
                        <CvmOfferTile key={o.id} offer={o} selected={pick === o.id} onSelect={() => setPick(o.id)} />
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── Step 2: Plan (migration only) ── */}
        {step === 2 && customer && selected?.kind === "migration" && (
          <>
            <CvmOfferTile offer={selected} />
            <div className="space-y-3">
              <div className="px-1">
                <h3 className="text-sm font-semibold text-foreground">{t("customerOffers.review.choosePlan")}</h3>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{t("customerOffers.review.choosePlanHint")}</p>
              </div>
              {POSTPAID_PLANS.map((pl) => (
                <PlanCard
                  key={pl.title}
                  plan={{ ...pl, badge: undefined }}
                  selected={migPlan === pl.title}
                  onSelect={() => setMigPlan(pl.title)}
                  layout="postpaid"
                  minsLabel={t("activation.plan.localMins")}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Step 2: Amount (recharge with a range or any amount) ── */}
        {step === 2 && customer && selected?.kind === "recharge" && (() => {
          const o = selected;
          const k = "customerOffers.review";
          const { amountOk } = reviewInfo(o);
          const { benefits } = offerText(o);
          const presets = o.rule === "range" && o.maxAmount != null
            ? Array.from(new Set([o.minAmount, Math.round((o.minAmount + o.maxAmount) / 2), o.maxAmount]))
            : [30, 50, 100, 200];
          return (
            <>
              <CvmOfferTile offer={o} />
              <CardSection title={t(`${k}.section.topUp`)} icon={Send}>
                <div className="space-y-2.5">
                  <label className="text-[11px] text-muted-foreground">{t(`${k}.amount`)}</label>
                  <div className="relative">
                    <Input
                      value={amountText}
                      onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="h-14 bg-card rounded-xl pe-10 text-xl font-semibold"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"><RiyalSymbol /></span>
                  </div>
                  {/* Range: from-to hint (red once outside it). Any: just says any amount works. */}
                  <p className={cn("text-[11px]", !amountOk && amountText !== "" ? "text-destructive" : "text-muted-foreground")}>
                    {o.rule === "range"
                      ? t(!amountOk && amountText !== "" ? "customerOffers.rechargeRangeHint" : `${k}.hintRange`, { min: o.minAmount, max: o.maxAmount })
                      : t(`${k}.hintAny`)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {presets.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmountText(String(v))}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                          amountText === String(v) ? "border-[0.5px] bg-primary/10 border-primary/20 text-primary" : "border bg-card border-border/60 text-foreground",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </CardSection>
              {/* What this amount earns, shown only once the amount is valid. */}
              {amountOk && benefits && (
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 flex items-start gap-2">
                  <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-foreground leading-snug"><span className="font-semibold">{t(`${k}.youGet`)}:</span> {benefits}</p>
                </div>
              )}
            </>
          );
        })()}

        {/* ── Step 3: Review — same checkout layout as the other flows: summary, payment summary, payment method ── */}
        {step === 3 && customer && selected && (() => {
          const o = selected;
          const k = "customerOffers.review";
          const { benefits } = offerText(o);
          const { amountOk, plan, migPlanObj, planPrice, isBill, pay, total, walletShort } = reviewInfo(o);
          const money = (n: number) => <><RiyalSymbol /> {n.toFixed(2)}</>;
          const newPlanName = o.kind === "migration" ? migPlanObj?.title : "planTitle" in o ? o.planTitle : undefined;
          return (
            <>
              {/* Like the other flows' checkout, plans show as summary rows (plan cards belong to the picking step). The offer card covers the offer itself, except for plan offers, whose bonus goes in the rows below. */}
              {!PLAN_KINDS.includes(o.kind) && <CvmOfferTile offer={o} />}


              {/* The offer card above already shows the benefits, validity and next-bill example, so this card is only the transaction itself, titled by what it is. */}
              <CardSection
                title={t(`${k}.section.${o.kind === "recharge" ? "topUp" : o.kind === "migration" ? "migration" : o.kind === "direct" ? "gift" : isBill ? "bill" : "plan"}`)}
                icon={o.kind === "recharge" ? Send : o.kind === "migration" ? ArrowLeftRight : o.kind === "direct" ? Gift : isBill ? ReceiptText : Repeat}
              >
                <OfferRow label={t(`${k}.number`)} value={customer.msisdn} />
                <OfferRow label={t(`${k}.currentPlan`)} value={customer.planName} />
                {newPlanName && <OfferRow label={t(`${k}.newPlan`)} value={newPlanName} />}
                {PLAN_KINDS.includes(o.kind) && (
                  <>
                    <OfferRow
                      label={t("changePostpaidPlan.changeType")}
                      value={o.kind === "btl" ? t("customerOffers.btlRibbon") : o.kind === "changePlan" && o.renew ? t("customerOffers.renewRibbon") : t("changePostpaidPlan.changeTypeUpgrade")}
                    />
                    {plan?.validityLabel && <OfferRow label={t("subscriptionMigration.planValidity")} value={plan.validityLabel} />}
                    {o.kind !== "btl" && benefits && <OfferRow label={t(`${k}.youGet`)} value={benefits} />}
                    <OfferRow label={t(`${k}.validUntil`)} value={o.validUntil} />
                  </>
                )}
                {o.kind === "migration" && <OfferRow label={t(`${k}.migrationType`)} value={t(`${k}.preToPost`)} />}
                {o.kind === "migration" && <OfferRow label={t(`${k}.discount`)} value={t(`${k}.discountFor`, { pct: o.discountPct, months: o.months })} />}
                {o.kind === "recharge" && <OfferRow label={t(`${k}.amount`)} value={money(o.rule === "exact" ? o.minAmount : Number(amountText))} />}
              </CardSection>

              {o.kind !== "direct" && (
                <CardSection title={t("changePostpaidPlan.paymentSummary")} icon={Receipt}>
                  {o.kind === "recharge" && <OfferRow label={t(`${k}.amount`)} value={money(amountOk ? Number(amountText) : 0)} />}
                  {(o.kind === "changePlan" || o.kind === "postpaidPlan" || o.kind === "btl" || o.kind === "migration") && (
                    <OfferRow label={t(`${k}.price`)} value={planPrice != null ? money(planPrice) : t("changePostpaidPlan.dash")} />
                  )}
                  {isBill && <OfferRow label={t(`${k}.billDue`)} value={money(CVM_BILL_DUE)} />}
                  {isBill && o.kind !== "billFull" && <OfferRow label={t(`${k}.waived`)} value={money(CVM_BILL_DUE - pay)} />}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-sm font-semibold text-foreground">{t("changePostpaidPlan.total")}</span>
                    <span className="text-base font-bold text-primary">{money(total)}</span>
                  </div>
                </CardSection>
              )}

              {total > 0 && (
                <CardSection title={t("changePostpaidPlan.paymentMethod")} icon={CreditCard}>
                  <div className="space-y-2">
                    <PayOption
                      icon={Wallet}
                      label={t("changePostpaidPlan.dealerWallet")}
                      description={t("changePostpaidPlan.dealerWalletDesc", { balance: walletBalance.toFixed(2) })}
                      selected={payMethod === "wallet"}
                      disabled={walletShort}
                      justToppedUp={justToppedUp}
                      onClick={() => setPayMethod("wallet")}
                    >
                      {walletShort && (
                        <WalletShortNotice
                          message={t("changePostpaidPlan.walletShort", { amount: (total - walletBalance).toFixed(2) })}
                          buttonLabel={t("changePostpaidPlan.topUpWallet")}
                        />
                      )}
                    </PayOption>
                    <PayOption
                      icon={CreditCard}
                      label={t("changePostpaidPlan.posTerminal")}
                      description={t("changePostpaidPlan.posTerminalDesc")}
                      selected={payMethod === "pos"}
                      onClick={() => setPayMethod("pos")}
                    />
                  </div>
                </CardSection>
              )}

            </>
          );
        })()}
      </div>

      {/* Sticky bottom — number step: verify; review step: confirm. The offers step has per-card actions. */}
      {step === 0 && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!/^\d{10}$/.test(msisdn) || checking} onClick={verifyNumber}>
              {t("customerOffers.verifyAndContinue")}
            </Button>
          </div>
        </div>
      )}

      {step === 1 && load === "ready" && sections.length > 0 && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!pickedOffer} onClick={() => pickedOffer && openOffer(pickedOffer)}>
              {t("customerOffers.continue")}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && selected?.kind === "migration" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!migPlan} onClick={() => setStep(3)}>
              {t("customerOffers.continue")}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && selected?.kind === "recharge" && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!reviewInfo(selected).amountOk || amountText === ""} onClick={() => setStep(3)}>
              {t("customerOffers.continue")}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && selected && (
        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="sm:max-w-[390px] mx-auto">
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!reviewInfo(selected).canConfirm} onClick={() => confirmOffer(selected)}>
              {/* Same as the other checkouts: "Pay SAR X" when money moves, "Submit" when nothing is charged. */}
              {reviewInfo(selected).total > 0 ? <>{t("changePostpaidPlan.pay")} <RiyalSymbol /> {reviewInfo(selected).total.toFixed(2)}</> : t("changePostpaidPlan.submit")}
            </Button>
          </div>
        </div>
      )}

      <PinCodeSheet open={pinOpen} onOpenChange={setPinOpen} onVerified={() => setDoneRef(newRef())} idPrefix="cvm-review" />
      <SuccessBottomSheet
        open={!!doneRef}
        onClose={finishOffer}
        orderId={doneRef}
        title={t("customerOffers.review.successTitle")}
        message={t("customerOffers.review.successMessage", { msisdn })}
      >
        <CvmOfferSuccessNote offer={selected ? { ...selected, msisdn } : null} />
      </SuccessBottomSheet>

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
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { const o = optInFailed; setOptInFailed(null); if (o) confirmOffer(o); }}>
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

export default CustomerOffers3;
