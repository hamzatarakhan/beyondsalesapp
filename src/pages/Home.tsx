import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  QrCode, 
  XCircle,
  UserX,
  Users,
  Wallet,
  Package,
  Smartphone,
  CreditCard,
  RefreshCw,
  PackageCheck,
  ArrowLeftRight,
  UserPlus,
  ClipboardList,
  Sparkles,
  Receipt,
  PhoneOff,
  ChevronRight,
  Send,
  PlusCircle,
  MessageSquareWarning,
  IdCard,
  Activity,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ActivityIcon from "@/components/ActivityIcon";
import WorkingShiftWidget from "@/components/WorkingShiftWidget";
import DealerVisitWidget from "@/components/DealerVisitWidget";

import SematiVerification from "@/components/SematiVerification";
import { useBrand, Brand } from "@/contexts/BrandContext";
import { useWidgets } from "@/contexts/WidgetsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslation } from "react-i18next";
import heroBanner from "@/assets/hero-banner.jpg";
import RiyalSymbol from "@/components/RiyalSymbol";
import { DEALER_WALLET_BALANCE } from "@/pages/NewActivation";
import virginMobileLogo from "@/assets/virgin-mobile-logo.svg";
import friendiMobileLogo from "@/assets/friendi-mobile-logo.svg";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ListChecks, LayoutList, X as XIcon } from "lucide-react";
import QRCode from "react-qr-code";

// labels resolved dynamically inside component via t()



// Hero banner slides — same content repeated for now, swap in real variations later.
const HERO_SLIDES = [0, 1, 2];
const HERO_AUTOPLAY_MS = 4000;

// Dealer-facing brand badge (top-left of header) — the swap icon next to it
// opens a picker so a dealer selling for multiple brands can switch context.
// Hidden for now — flip back on when the feature is ready to ship.
const SHOW_BRAND_SWITCHER = true;
const OPERATORS = [
  { id: "virgin", name: "Virgin", logo: virginMobileLogo },
  { id: "friendi", name: "Friendi", logo: friendiMobileLogo },
];

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const { brand: activeOperator, setBrand: setActiveOperator } = useBrand();
  const { widgets } = useWidgets();
  const { isRtl } = useLanguage();
  const [operatorSheetOpen, setOperatorSheetOpen] = useState(false);
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [heroEmblaRef, heroEmblaApi] = useEmblaCarousel({ loop: true, direction: isRtl ? "rtl" : "ltr" });
  const [heroActiveSnap, setHeroActiveSnap] = useState(0);
  const heroAutoplayRef = useRef<ReturnType<typeof setInterval>>();
  const activeOp = OPERATORS.find((o) => o.id === activeOperator) ?? OPERATORS[0];
  const [flowChoiceOpen, setFlowChoiceOpen] = useState(false);

  // Hero banner: track the active dot, and auto-advance on a timer — paused while the
  // dealer is dragging the slide with their finger, resumed once they let go.
  useEffect(() => {
    if (!heroEmblaApi) return;
    const onSelect = () => setHeroActiveSnap(heroEmblaApi.selectedScrollSnap());
    heroEmblaApi.on("select", onSelect);
    onSelect();
    return () => { heroEmblaApi.off("select", onSelect); };
  }, [heroEmblaApi]);

  // Re-init when text direction flips (LTR ↔ RTL) so slides scroll the correct way
  useEffect(() => {
    if (!heroEmblaApi) return;
    heroEmblaApi.reInit({ loop: true, direction: isRtl ? "rtl" : "ltr" });
  }, [isRtl, heroEmblaApi]);

  useEffect(() => {
    if (!heroEmblaApi) return;
    const startAutoplay = () => {
      clearInterval(heroAutoplayRef.current);
      heroAutoplayRef.current = setInterval(() => heroEmblaApi.scrollNext(), HERO_AUTOPLAY_MS);
    };
    const stopAutoplay = () => clearInterval(heroAutoplayRef.current);
    startAutoplay();
    heroEmblaApi.on("pointerDown", stopAutoplay);
    heroEmblaApi.on("pointerUp", startAutoplay);
    return () => {
      stopAutoplay();
      heroEmblaApi.off("pointerDown", stopAutoplay);
      heroEmblaApi.off("pointerUp", startAutoplay);
    };
  }, [heroEmblaApi]);

  const memberOnboarding = [
    { icon: UserPlus, label: t("home.channelOnboarding"), path: "/channel-onboarding", badge: t("home.badgeApproved"), badgeTone: "approved" as const },
    { icon: ClipboardList, label: t("home.onboardingRequests"), path: "/onboarding-requests", badge: t("home.badgeApproved"), badgeTone: "approved" as const },
  ];

  // Parallel designs for the same service, kept side by side for review — same "Option N"
  // badge pairing as Credit Limit Adjustment's options. Split into two arrays (rather than
  // one) so the SIM Services card can render them as two sub-sections separated by a divider.
  const simReplacementOptions = [
    { id: "sim-replacement", icon: RefreshCw, label: t("home.simReplacement"), path: "/sim-replacement", badge: t("simReplacement.optionBadge", { number: 1 }), badgeTone: "special" as const },
    // Identity collected up front (ID Type/Nationality/ID Number + MSISDN before search),
    // no card wrapper, SIM type/checkout moved to page 2 with no summary.
    { id: "sim-replacement-2", icon: RefreshCw, label: t("home.simReplacement"), path: "/sim-replacement?option=2", badge: t("simReplacement.optionBadge", { number: 2 }), badgeTone: "special" as const },
    // Option 3 (?option=3) hidden from Home per request — same upfront fields as option 2
    // boxed with an explicit Search button, full Summary + Verification + TnC like option 1,
    // split across 3 stages. Still reachable directly at /sim-replacement?option=3.
  ];
  const simTerminationOptions = [
    { id: "sim-termination", icon: PhoneOff, label: t("home.simTermination"), path: "/sim-termination", badge: t("simTermination.optionBadge", { number: 1 }), badgeTone: "special" as const },
    // Identity collected up front (ID Type/Nationality/ID Number + MSISDN), Continue does the
    // lookup and advances; Termination Reason + Verification + Bill/Payment + Terms all land
    // on one second page instead of being split across the reveal-after-lookup pattern.
    { id: "sim-termination-2", icon: PhoneOff, label: t("home.simTermination"), path: "/sim-termination?option=2", badge: t("simTermination.optionBadge", { number: 2 }), badgeTone: "special" as const },
    // Same layout as option 2 (identity up front, Continue does lookup+advance, Termination
    // Reason inline on page 2, no summary card), but the Outstanding Bill section is styled
    // like Bill Payment's bill card (always expanded, no collapse) with Payment Method
    // directly under it — the entered amount decides pay full/partial/skip.
    { id: "sim-termination-3", icon: PhoneOff, label: t("home.simTermination"), path: "/sim-termination?option=3", badge: t("simTermination.optionBadge", { number: 3 }), badgeTone: "special" as const },
  ];

  // Four separate entry points into the same flow, not a toggle — each tile is fixed to
  // its own way of picking the adjustment amount (?option=1 → slider, ?option=2 →
  // predefined amounts, ?option=3 → boxed swipeable carousel, ?option=4 → plain wheel
  // picker with its own current→new summary, ?option=5 → single zero-centered slider
  // replacing the increase/decrease toggle), so they can be reviewed side by side.
  // "special" badge tone flags them as alternate options rather than a rollout-status badge.
  const creditLimitOptions = [
    { id: "credit-limit-1", icon: CreditCard, label: t("home.creditLimitAdjustment"), path: "/credit-limit-adjustment?option=1", badge: t("home.creditLimitOptions.optionBadge", { number: 1 }), badgeTone: "special" as const },
    { id: "credit-limit-2", icon: CreditCard, label: t("home.creditLimitAdjustment"), path: "/credit-limit-adjustment?option=2", badge: t("home.creditLimitOptions.optionBadge", { number: 2 }), badgeTone: "special" as const },
    { id: "credit-limit-3", icon: CreditCard, label: t("home.creditLimitAdjustment"), path: "/credit-limit-adjustment?option=3", badge: t("home.creditLimitOptions.optionBadge", { number: 3 }), badgeTone: "special" as const },
    { id: "credit-limit-4", icon: CreditCard, label: t("home.creditLimitAdjustment"), path: "/credit-limit-adjustment?option=4", badge: t("home.creditLimitOptions.optionBadge", { number: 4 }), badgeTone: "special" as const },
    { id: "credit-limit-5", icon: CreditCard, label: t("home.creditLimitAdjustment"), path: "/credit-limit-adjustment?option=5", badge: t("home.creditLimitOptions.optionBadge", { number: 5 }), badgeTone: "special" as const },
  ];

  // "Option 1" is the original flow (auto-detects direction from the looked-up number);
  // "Option 2" is a proposed alternative: two separate services, each locked to one
  // direction, rather than the dealer relying on the app to infer which way a given
  // number can migrate. Both direction-locked tiles share the "Option 2" badge — they're
  // one design alternative split across two entry points, not two separate options.
  const subscriptionMigrationOptions = [
    { id: "migration-original", icon: ArrowLeftRight, label: t("home.subscriptionMigration"), path: "/subscription-migration", badge: t("home.subscriptionMigrationOptions.optionBadge", { number: 1 }), badgeTone: "special" as const },
    { id: "migration-pre-to-post", icon: ArrowLeftRight, label: t("home.subscriptionMigrationOptions.preToPost"), path: "/subscription-migration?direction=pre-to-post", badge: t("home.subscriptionMigrationOptions.optionBadge", { number: 2 }), badgeTone: "special" as const },
    { id: "migration-post-to-pre", icon: ArrowLeftRight, label: t("home.subscriptionMigrationOptions.postToPre"), path: "/subscription-migration?direction=post-to-pre", badge: t("home.subscriptionMigrationOptions.optionBadge", { number: 2 }), badgeTone: "special" as const },
  ];

  // Rollout status per service: "approved" is signed off, "confirm" is awaiting sign-off,
  // "progress" is still being built.
  const activities = [
    { id: "sim-3", icon: Sparkles, label: t("home.simActivation"), path: "/new-activation-3", badge: t("home.badgeConfirmed"), badgeTone: "approved" as const },
    { id: "fulfilment", icon: PackageCheck, label: t("home.fulfilment"), path: "/new-activation-3?flow=fulfilment", badge: t("home.badgeNeedsConfirm"), badgeTone: "confirm" as const },
    // Client requirements — applicable to both VM and FM, so no operator filter.
    { id: "customer-search", icon: IdCard, label: t("home.customerSearch"), path: "/customer-search", badge: t("home.badgeInProgress"), badgeTone: "progress" as const },
    { id: "sim-status-check", icon: Activity, label: t("home.simStatusCheck"), path: "/sim-status-check", badge: t("home.badgeInProgress"), badgeTone: "progress" as const },
    // Bill Payment is postpaid-related, so it's Virgin-only — Friendi has no postpaid
    // product. Credit Limit Adjustment and Subscription Migration moved to their own
    // "Options" widgets below, out of this grid.
    ...(activeOperator === "friendi"
      ? []
      : [
          { id: "bill-payment", icon: Receipt, label: t("home.billPayment"), path: "/bill-payment", badge: t("home.badgeInProgress"), badgeTone: "progress" as const },
        ]),
  ];

  // Credit Transfer draws from the dealer's own wallet balance, and eWallet Recharge tops
  // that same wallet up — both are dealer-wallet actions rather than customer activities,
  // for VM and FM alike.
  const eWalletOptions = [
    { id: "credit-transfer", icon: Send, label: t("home.creditTransfer"), path: "/credit-transfer", badge: t("home.badgeInProgress"), badgeTone: "progress" as const },
    { id: "wallet-recharge", icon: PlusCircle, label: t("home.walletRecharge"), path: "/wallet-recharge", badge: t("home.badgeInProgress"), badgeTone: "progress" as const },
  ];

  // Catch-all for services that don't fit Customer Activities or E Wallets — currently
  // just Raise Customer Complaint.
  const otherServicesOptions = [
    { id: "customer-complaint", icon: MessageSquareWarning, label: t("home.customerComplaint"), path: "/customer-complaint", badge: t("home.badgeInProgress"), badgeTone: "progress" as const },
  ];

  const handleActivityClick = (path: string) => {
    setPendingPath(path);
    setVerifyOpen(true);
  };

  const goWithMode = (mode: "classic" | "staged") => {
    try {
      sessionStorage.setItem("activationMode", mode);
    } catch {}
    const path = pendingPath;
    setFlowChoiceOpen(false);
    setPendingPath(null);
    if (path) navigate(path);
  };

  // Keyed by the same widget ids Settings reorders/toggles — rendered below in
  // whatever order `widgets` currently has, skipping any that are disabled there.
  const widgetNodes: Record<string, JSX.Element> = {
    "working-shift": <WorkingShiftWidget key="working-shift" />,
    "dealer-visit": <DealerVisitWidget key="dealer-visit" />,
    "customer-activities": (
      <div key="customer-activities" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.customerActivities")}</h3>
          </div>

          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {activities.map((activity) => (
              <ActivityIcon
                key={activity.label}
                icon={activity.icon}
                label={activity.label}
                color="teal"
                badge={activity.badge}
                badgeTone={activity.badgeTone}
                onClick={() => handleActivityClick(activity.path)}
              />
            ))}
          </div>

        </div>
      </div>
    ),
    // Dealer-wallet actions (Credit Transfer, eWallet Recharge) — split out of Customer
    // Activities since neither is really about a customer's own account. VM and FM both.
    "e-wallets": (
      <div key="e-wallets" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.eWallets")}</h3>
          </div>
          <div className="flex items-center justify-between rounded-2xl px-4 py-3 mb-4 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
            <div>
              <span className="text-[11px] font-medium opacity-90">{t("home.dealerWalletBalance")}</span>
              <p className="text-xl font-bold leading-tight"><RiyalSymbol /> {DEALER_WALLET_BALANCE.toFixed(2)}</p>
            </div>
            <Wallet className="w-6 h-6 opacity-90 shrink-0" />
          </div>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {eWalletOptions.map((item) => (
              <ActivityIcon
                key={item.id}
                icon={item.icon}
                label={item.label}
                color="teal"
                badge={item.badge}
                badgeTone={item.badgeTone}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    "other-services": (
      <div key="other-services" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.otherServices")}</h3>
          </div>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {otherServicesOptions.map((item) => (
              <ActivityIcon
                key={item.id}
                icon={item.icon}
                label={item.label}
                color="teal"
                badge={item.badge}
                badgeTone={item.badgeTone}
                onClick={() => handleActivityClick(item.path)}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    "sim-services": (
      <div key="sim-services" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.simServices")}</h3>
          </div>

          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("home.simReplacement")}</p>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {simReplacementOptions.map((item) => (
              <ActivityIcon
                key={item.id}
                icon={item.icon}
                label={item.label}
                color="teal"
                badge={item.badge}
                badgeTone={item.badgeTone}
                onClick={() => handleActivityClick(item.path)}
              />
            ))}
          </div>

          <div className="border-t border-border/50 my-4" />

          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("home.simTermination")}</p>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {simTerminationOptions.map((item) => (
              <ActivityIcon
                key={item.id}
                icon={item.icon}
                label={item.label}
                color="teal"
                badge={item.badge}
                badgeTone={item.badgeTone}
                onClick={() => handleActivityClick(item.path)}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    // Credit Limit Adjustment lives here on its own instead of buried in the Customer
    // Activities grid — Virgin-only (no postpaid product on Friendi). Four separate entry
    // points, not one flow with an in-page toggle — each tile is fixed to its own way of
    // picking the adjustment amount so they can be reviewed side by side.
    "credit-limit-options": activeOperator === "friendi" ? <div key="credit-limit-options" /> : (
      <div key="credit-limit-options" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.creditLimitOptions.title")}</h3>
          </div>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {creditLimitOptions.map((item) => (
              <ActivityIcon
                key={item.id}
                icon={item.icon}
                label={item.label}
                color="teal"
                badge={item.badge}
                badgeTone={item.badgeTone}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    // Same idea as Credit Limit Options — the original auto-detect flow, plus a proposed
    // split into two direction-locked services, so both approaches can be reviewed side by
    // side. Virgin-only (no postpaid product on Friendi, so no migration at all).
    "subscription-migration-options": activeOperator === "friendi" ? <div key="subscription-migration-options" /> : (
      <div key="subscription-migration-options" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.subscriptionMigrationOptions.title")}</h3>
          </div>
          <div className="flex items-stretch">
            <div className="flex-1 flex items-center justify-center">
              <ActivityIcon
                icon={subscriptionMigrationOptions[0].icon}
                label={subscriptionMigrationOptions[0].label}
                color="teal"
                badge={subscriptionMigrationOptions[0].badge}
                badgeTone={subscriptionMigrationOptions[0].badgeTone}
                onClick={() => handleActivityClick(subscriptionMigrationOptions[0].path)}
              />
            </div>
            <div className="w-px bg-border/60 mx-3" />
            <div className="flex-[2] flex items-center justify-around">
              {subscriptionMigrationOptions.slice(1).map((item) => (
                <ActivityIcon
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  color="teal"
                  badge={item.badge}
                  badgeTone={item.badgeTone}
                  onClick={() => handleActivityClick(item.path)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    "member-onboarding": (
      <div key="member-onboarding" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t("home.memberOnboarding")}</h3>
          </div>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {memberOnboarding.map((item) => (
              <ActivityIcon
                key={item.label}
                icon={item.icon}
                label={item.label}
                color="amber"
                badge={item.badge}
                badgeTone={item.badgeTone}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    tickets: (
      <div key="tickets" className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">{t("home.tickets.title")}</h3>
            <button onClick={() => navigate("/tickets")} className="flex items-center gap-1 text-link text-sm font-medium">
              {t("home.tickets.seeAll")} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { count: 100, label: t("home.tickets.progress"), color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
              { count: 50, label: t("home.tickets.closed"), color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
              { count: 20, label: t("home.tickets.resolved"), color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
            ].map((s) => (
              <div key={s.label} className="bg-muted/40 rounded-xl py-3 flex flex-col items-center gap-1.5">
                <p className="text-xl font-bold text-foreground">{s.count}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.color}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/tickets/new")} className="w-full py-3 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1">
            + {t("home.tickets.newTicket")}
          </button>
        </div>
      </div>
    ),
  };

  return (
    <div className="mobile-container pb-24 bg-background h-screen overflow-y-auto scrollbar-hide">
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold text-foreground text-[15px]">{t("home.greeting")}</p>
            <p className="text-xs text-muted-foreground">{t("home.dealerId")}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {SHOW_BRAND_SWITCHER && (
            <button
              onClick={() => setOperatorSheetOpen(true)}
              aria-label={t("home.switchBrandAria", { brand: activeOp.name })}
              className="h-10 ps-1 pe-2.5 rounded-full bg-card shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <img src={activeOp.logo} alt={activeOp.name} className="w-8 h-8 rounded-full shrink-0" />
              <ArrowLeftRight className="w-4 h-4 text-foreground" />
            </button>
          )}
          <button
            onClick={() => setQrSheetOpen(true)}
            aria-label={t("home.showQrAria")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <QrCode className="w-[18px] h-[18px] text-foreground" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/notifications")}
            aria-label={t("home.notificationsAria")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm relative"
          >
            <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={2.5} />
            <span className="absolute top-2 end-2.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {/* Hero Banner — auto-advances on a timer, swipeable with a finger */}
      <div className="px-4 pb-4">
        <div className="relative rounded-2xl overflow-hidden h-[140px]">
          <div className="overflow-hidden h-full" ref={heroEmblaRef}>
            <div className="flex h-full">
              {HERO_SLIDES.map((slide) => (
                <div key={slide} className="relative shrink-0 grow-0 basis-full h-full bg-gradient-to-r from-primary to-primary/80">
                  <div className="absolute inset-0 p-5 flex flex-col justify-center z-10">
                    <h2 className="text-xl font-bold text-primary-foreground mb-1">
                      {t("home.hero.title")}
                    </h2>
                    <p className="text-sm text-primary-foreground/90 leading-snug">
                      {t("home.hero.subtitle").split("\n").map((line, i) => (
                        <span key={i}>{line}{i === 0 && <br />}</span>
                      ))}
                    </p>
                  </div>
                  <img
                    src={heroBanner}
                    alt="Sales professional"
                    className="absolute end-0 top-0 h-full w-1/2 object-cover object-left opacity-90"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Carousel dots */}
          <div className="absolute bottom-3 start-5 flex gap-1.5 z-20">
            {HERO_SLIDES.map((slide, i) => (
              <span
                key={slide}
                className={i === heroActiveSnap ? "w-5 h-1.5 rounded-full bg-primary-foreground transition-all" : "w-1.5 h-1.5 rounded-full bg-primary-foreground/50 transition-all"}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Widgets — order and visibility come from Settings, dealer-configurable there. */}
      {widgets.filter((w) => w.enabled).map((w) => widgetNodes[w.id])}

      {/*
        NOTE: Hidden per request — keep this widget in source for future use.
        To restore, uncomment the Tickets section below.

      // Tickets
      <div className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Tickets</h3>
            <button className="flex items-center gap-1 text-link text-sm font-medium">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { count: 100, label: "Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
              { count: 50, label: "Closed", color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
              { count: 20, label: "Resolved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
            ].map((s) => (
              <div key={s.label} className="bg-muted/40 rounded-xl py-3 flex flex-col items-center gap-1.5">
                <p className="text-xl font-bold text-foreground">{s.count}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.color}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1">
            + New Ticket
          </button>
        </div>
      </div>
      */}

      <BottomNav />
      <SematiVerification
        open={verifyOpen}
        audience="dealer"
        onClose={() => {
          setVerifyOpen(false);
          setPendingPath(null);
        }}
        onVerified={() => {
          setVerifyOpen(false);
          // Only the Prepaid flow has the two-option choice; everything else
          // navigates directly.
          if (pendingPath === "/prepaid-search") {
            setFlowChoiceOpen(true);
          } else {
            if (pendingPath) navigate(pendingPath);
            setPendingPath(null);
          }
        }}
      />

      <Drawer open={flowChoiceOpen} onOpenChange={(o) => { if (!o) { setFlowChoiceOpen(false); setPendingPath(null); } }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => { setFlowChoiceOpen(false); setPendingPath(null); }}
            aria-label={t("settings.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("home.chooseActivationFlow")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {t("home.chooseActivationFlowSub")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3">
            <button
              onClick={() => goWithMode("classic")}
              className="w-full text-start flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/60 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <LayoutList className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{t("home.stcFlow")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("home.stcFlowSub")}
                </p>
              </div>
            </button>
            <button
              onClick={() => goWithMode("staged")}
              className="w-full text-start flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/60 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{t("home.multiStepFlow")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("home.multiStepFlowSub")}
                </p>
              </div>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={operatorSheetOpen} onOpenChange={setOperatorSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setOperatorSheetOpen(false)}
            aria-label={t("settings.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("home.switchBrands")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {t("home.switchBrandsSub")}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2">
            {OPERATORS.map((op) => {
              const selected = op.id === activeOperator;
              return (
                <button
                  key={op.id}
                  onClick={() => { setActiveOperator(op.id as Brand); setOperatorSheetOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition ${selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "border-border bg-card"}`}
                >
                  <img src={op.logo} alt={op.name} className="w-10 h-10 rounded-full shrink-0" />
                  <p className="flex-1 text-start text-sm font-semibold text-foreground">{op.name}</p>
                  {selected && (
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                      {t("home.selected")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={qrSheetOpen} onOpenChange={setQrSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setQrSheetOpen(false)}
            aria-label={t("settings.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("home.qrCode")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-8 pb-6 flex items-center justify-center">
            <div className="bg-white p-4 rounded-2xl">
              <QRCode value={t("home.dealerId")} size={200} />
            </div>
          </div>
          <div className="px-4 pb-8">
            <button
              onClick={() => setQrSheetOpen(false)}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("home.done")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Home;
