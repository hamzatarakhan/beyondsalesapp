import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  QrCode,
  Network,
  ClipboardCheck,
  UserPlus,
  ClipboardList,
  // Target, BarChart3, // used by the hidden KPI Dashboard section
  PackagePlus,
  PackageOpen,
  Undo2,
  Calendar,
  Headphones,
  ChevronRight,
  ArrowLeftRight,
  Send,
  Zap,
  Receipt,
  FileBarChart,
  History,
  Microchip,
  PackageCheck,
  Receipt as BillIcon,
  CreditCard,
  IdCard,
  Repeat,
  Ban,
  ArrowUpDown,
  UserCog,
  Users,
  MapPin,
  BadgeCheck,
  RefreshCw,
  PhoneOff,
  MessageSquareWarning,
  Ticket,
  PieChart,
  Boxes,
  Search,
  LucideIcon,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { X as XIcon } from "lucide-react";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import { hasSearchTerm, matchesServiceSearch } from "@/lib/serviceSearch";
import { useServiceSearchEnabled } from "@/lib/serviceSearchFlag";
import { useBrand } from "@/contexts/BrandContext";

interface ServiceItem {
  icon: LucideIcon;
  label: string;
  path?: string;
}

const Menu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { brand } = useBrand();
  // Friendi has no postpaid product, so postpaid-only activities are Virgin-only (same as Home).
  const postpaid = brand !== "friendi";

  const sections: { title: string; items: ServiceItem[] }[] = [
    // The seven service groups follow the Services Categories proposal, in the same order as Home.
    // Customer Recharge and Wallet Top-Up are hidden (same as Home).
    {
      title: t("home.catSimNumbers"),
      items: [
        { icon: Microchip, label: t("home.simActivation"), path: "/new-activation-3" },
        { icon: PackageCheck, label: t("home.fulfilment"), path: "/new-activation-3?flow=fulfilment" },
        { icon: BadgeCheck, label: t("home.simStatusCheck"), path: "/sim-status-check" },
        { icon: RefreshCw, label: t("home.simReplacement"), path: "/sim-replacement?option=2" },
        { icon: PhoneOff, label: t("home.simTermination"), path: "/sim-termination?option=3" },
        { icon: Ban, label: t("home.cancelPortIn"), path: "/cancel-port-in" },
      ],
    },
    {
      title: t("home.catPlansSubscription"),
      items: [
        { icon: Repeat, label: t("home.changePrepaidBundle"), path: "/change-prepaid-bundle" },
        ...(postpaid
          ? [
              { icon: ArrowUpDown, label: t("home.changePostpaidPlan"), path: "/change-postpaid-plan" },
              { icon: ArrowLeftRight, label: t("home.subscriptionMigrationOptions.preToPost"), path: "/subscription-migration?direction=pre-to-post" },
              { icon: ArrowLeftRight, label: t("home.subscriptionMigrationOptions.postToPre"), path: "/subscription-migration?direction=post-to-pre" },
            ]
          : []),
      ],
    },
    {
      title: t("home.catBillingCredit"),
      items: [
        { icon: Send, label: t("home.creditTransfer"), path: "/credit-transfer" },
        ...(postpaid
          ? [
              { icon: BillIcon, label: t("home.billPayment"), path: "/bill-payment?option=2" },
              { icon: CreditCard, label: t("home.creditLimitAdjustment"), path: "/credit-limit-adjustment?option=5" },
            ]
          : []),
      ],
    },
    {
      title: t("home.catCustomerCare"),
      items: [
        { icon: Users, label: t("home.changeOwner"), path: "/change-owner" },
        { icon: UserCog, label: t("home.updateId"), path: "/update-id" },
        { icon: IdCard, label: t("home.customerSearch"), path: "/customer-search" },
        { icon: MessageSquareWarning, label: t("home.customerComplaint"), path: "/customer-complaint" },
      ],
    },
    {
      title: t("home.catWalletTopup"),
      items: [
        { icon: Zap, label: t("home.walletRecharge"), path: "/wallet-recharge" },
        { icon: Ticket, label: t("home.eVoucher"), path: "/e-voucher" },
      ],
    },
    {
      title: t("home.catReportsEarnings"),
      items: [
        { icon: Receipt, label: t("home.ewalletTransactions"), path: "/ewallet?view=transactions" },
        { icon: PieChart, label: t("home.eWalletAnalytics"), path: "/e-wallet-analytics" },
        { icon: FileBarChart, label: t("home.commissionReport"), path: "/commission-report" },
        { icon: History, label: t("home.orderHistory"), path: "/order-history" },
        { icon: Network, label: t("menu.myHierarchy"), path: "/profile/hierarchy" },
      ],
    },
    {
      title: t("home.catStockInventory"),
      items: [
        { icon: Boxes, label: t("home.inventoryDashboard"), path: "/inventory-dashboard" },
        { icon: PackagePlus, label: t("home.purchaseOrders"), path: "/purchase-orders" },
        { icon: PackageOpen, label: t("home.salesOrders"), path: "/sales-orders" },
        { icon: Undo2, label: t("home.stockReturn"), path: "/stock-returns" },
      ],
    },
    {
      title: t("menu.channelMemberOnboarding"),
      items: [
        { icon: UserPlus, label: t("home.channelOnboarding"), path: "/channel-onboarding" },
        { icon: ClipboardList, label: t("home.onboardingRequests"), path: "/onboarding-requests" },
      ],
    },
    // KPI Dashboard hidden to match Home (KPI widget is hidden there); uncomment to bring it back.
    // {
    // title: t("menu.kpiDashboard"),
    // items: [
    // { icon: Target, label: t("menu.salesKpis"), path: "/sales-kpis" },
    // { icon: BarChart3, label: t("menu.performanceAtGlance"), path: "/performance-at-glance" },
    // ],
    // },
    {
      title: t("menu.otherWidgets"),
      items: [
        // Training Hub hidden for now (no screen yet)
        { icon: Calendar, label: t("menu.myShifts"), path: "/my-shifts" },
        { icon: MapPin, label: t("home.dealerVisit.title"), path: "/visit-management" },
        { icon: ClipboardCheck, label: t("menu.checkIn"), path: "/visit-management" },
        { icon: Headphones, label: t("menu.tickets"), path: "/tickets" },
      ],
    },
  ];

  // Same approach as Home: typing filters the sections in place. Each section keeps only its matching
  // services (all of them when its name matches) and hides when nothing in it matches.
  // Hidden until switched on in Settings (needs the PM-approval password).
  const searchEnabled = useServiceSearchEnabled();
  const isSearching = searchEnabled && hasSearchTerm(query);
  const visibleSections = isSearching
    ? sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => matchesServiceSearch(query, item.label, section.title, item.path)),
        }))
        .filter((section) => section.items.length > 0)
    : sections;

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background px-4 py-4 grid grid-cols-[2.5rem_1fr_auto] items-center gap-2">
        <button
          onClick={() => navigate("/")}
          aria-label={t("menu.backAria")}
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground rtl:rotate-180" />
        </button>
        <h1 className="text-center text-lg font-semibold text-foreground truncate">{t("menu.title")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrSheetOpen(true)}
            aria-label={t("menu.showQrAria")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <QrCode className="w-[18px] h-[18px] text-foreground" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/notifications")}
            aria-label={t("menu.notificationsAria")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm relative"
          >
            <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={2.5} />
            <span className="absolute top-2 end-2.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {searchEnabled && (
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.searchServicesPlaceholder")}
            aria-label={t("home.searchServicesPlaceholder")}
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            className="w-full h-11 rounded-xl bg-card border border-border/60 shadow-sm ps-10 pe-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("home.clearSearchAria")}
              className="absolute end-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      )}

      <div className="px-4 space-y-4">
        {isSearching && visibleSections.length === 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">{t("home.searchNoResults")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("home.searchNoResultsHint")}</p>
          </div>
        )}
        {visibleSections.map((section) => (
          <div key={section.title} className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
            <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
            <div className="divide-y divide-border/60">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path ?? "/coming-soon", item.path ? undefined : { state: { feature: item.label } })}
                  className="w-full flex items-center gap-3 py-3 text-start"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 rtl:rotate-180" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />

      <Drawer open={qrSheetOpen} onOpenChange={setQrSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setQrSheetOpen(false)}
            aria-label={t("menu.closeAria")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("menu.qrCodeTitle")}</DrawerTitle>
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
              {t("menu.done")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Menu;
