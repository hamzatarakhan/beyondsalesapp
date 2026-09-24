import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, X, MoreVertical, Inbox, ListChecks, CheckCheck, Trash2, Check } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useDragScroll } from "@/hooks/useDragScroll";
import officePhoto from "@/assets/hero-banner.jpg";

type Category = "general" | "payment" | "orders" | "unpaid";
type ChipValue = "all" | "unread" | "payment" | "orders" | "unpaid";

interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  date: string;
  time: string;
  read: boolean;
  category: Category;
  // Where pressing this notification should take the dealer — a specific order/bill/customer
  // page. Absent for "general" announcements, which aren't about any one record — those still
  // open the in-app notification detail view instead.
  linkTo?: string;
}

// Prototype-only static notifications — no backend to source these from yet, but each one
// references a real seeded record (an actual order id, bill number, or credit customer already
// used elsewhere in the app) so both the deep link and the detail view show something real.
const RAMADAN_HOURS_BODY =
  "Starting next week, all branches will operate on adjusted Ramadan hours: 10:00 AM – 4:00 PM, Saturday to Thursday. Please update your team's schedules accordingly.";
const COMMISSION_UPDATE_BODY =
  "The updated commission tiers for postpaid and Vnet activations are now live. Review the new payout percentages in your dealer portal before submitting this month's claims.";
// Test fixture for a long-form announcement (~10 lines at card width) — demonstrates the
// list card's clamp-to-3-lines + tap-through-to-full-detail pattern (see the card render
// below and the detail view's whitespace-pre-line body).
const POLICY_UPDATE_BODY =
  "Effective next billing cycle, the dealer commission and compliance policy is being revised across all product lines.\n\n" +
  "1. Postpaid activations now require Nafath verification to be completed before the sale is marked complete, with no manual override.\n\n" +
  "2. Prepaid-to-postpaid migrations must include an updated proof of address on file, refreshed at least once every 12 months.\n\n" +
  "3. Commission payout on Vnet and 5G Data plans moves to a tiered structure based on the dealer's rolling 90-day activation volume.\n\n" +
  "4. SIM replacement requests flagged as high-risk by the fraud model will require branch manager approval before completion.\n\n" +
  "Full policy details and the updated payout tables are available in the dealer portal. Please review before your next activation.";
// Test fixture for a long body on a *deep-linking* notification (has linkTo, so the card's
// own tap navigates straight to Bill Payment and never opens the detail view) — demonstrates
// that "Read more" still reaches the full text even when the card tap goes elsewhere.
const OVERDUE_BILL_BODY =
  "Bill BL-2026-07-5590 for MSISDN 0502222222 is now 14 days overdue.\n\n" +
  "Outstanding amount: 780.00 SAR, including a 25.00 SAR late fee applied after the 10-day grace period.\n\n" +
  "The line has been placed on a payment hold: outgoing calls, SMS, and mobile data are suspended until the balance is cleared.\n\n" +
  "If payment isn't received within 7 days, the line will move to the disconnection queue per the standard postpaid dunning schedule.\n\n" +
  "Tap to open Bill Payment and collect the outstanding balance, or a partial payment, from the customer now.";

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "0a", title: "Bill payment reminder", subtitle: "MSISDN 0502222222", body: OVERDUE_BILL_BODY, date: "23 Dec", time: "9:30 AM", read: false, category: "payment", linkTo: "/bill-payment" },
  { id: "0", title: "Dealer commission & compliance policy update", subtitle: "Operations Announcement", body: POLICY_UPDATE_BODY, date: "23 Dec", time: "9:10 AM", read: false, category: "general" },
  { id: "1", title: "Ramadan working hours update", subtitle: "Operations Announcement", body: RAMADAN_HOURS_BODY, date: "22 Dec", time: "8:52 AM", read: false, category: "general" },
  { id: "2", title: "Bill payment reminder", subtitle: "MSISDN 0502222222", body: "Bill BL-2026-07-5590 (780.00 SAR) is overdue. Tap to collect payment now.", date: "21 Dec", time: "8:52 AM", read: false, category: "payment", linkTo: "/bill-payment" },
  { id: "3", title: "Sales Order SO-2026-2005 awaiting your approval", subtitle: "Noura Al-Harbi · Dammam Branch", body: "This sales order has been quoted and is now waiting on your approval before it moves to scanning.", date: "21 Dec", time: "8:52 AM", read: false, category: "orders", linkTo: "/sales-orders/SO-2026-2005" },
  { id: "4", title: "Outstanding balance flagged for review", subtitle: "Sara Al-Otaibi", body: "Sara Al-Otaibi's outstanding balance is approaching her 500 SAR credit limit. Tap to review and adjust.", date: "20 Dec", time: "8:52 AM", read: true, category: "unpaid", linkTo: "/credit-limit-adjustment" },
  { id: "5", title: "New commission structure effective this month", subtitle: "Finance Announcement", body: COMMISSION_UPDATE_BODY, date: "20 Dec", time: "8:52 AM", read: true, category: "general" },
  { id: "6", title: "Payment received", subtitle: "MSISDN 0502222211", body: "A payment was recorded against bill BL-2026-07-4412. Tap to view the payment history or record another payment.", date: "19 Dec", time: "8:52 AM", read: true, category: "payment", linkTo: "/bill-payment" },
  { id: "7", title: "Purchase Order PO-2026-1006 — quotation received", subtitle: "Jeddah Branch", body: "The supplier has sent a quotation for this purchase order. Tap to review and approve or reject it.", date: "19 Dec", time: "8:52 AM", read: true, category: "orders", linkTo: "/purchase-orders/PO-2026-1006" },
];

const Notifications = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [view, setView] = useState<"list" | "detail">("list");
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [search, setSearch] = useState("");
  const [activeChip, setActiveChip] = useState<ChipValue>("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Tapping a card's thumbnail previews the image in place instead of triggering the card's
  // own tap (deep link / detail view) — the two stay independently reachable.
  const [previewOpen, setPreviewOpen] = useState(false);
  const chipsDragScroll = useDragScroll<HTMLDivElement>();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const CHIPS: { value: ChipValue; label: string; count?: number }[] = [
    { value: "all", label: t("notifications.chips.all") },
    { value: "unread", label: t("notifications.chips.unread"), count: unreadCount },
    { value: "payment", label: t("notifications.chips.payment") },
    { value: "orders", label: t("notifications.chips.orders") },
    { value: "unpaid", label: t("notifications.chips.unpaid") },
  ];

  const filtered = notifications.filter((n) => {
    const matchesChip = activeChip === "all" || (activeChip === "unread" ? !n.read : n.category === activeChip);
    const matchesSearch = !search.trim() || n.title.toLowerCase().includes(search.trim().toLowerCase());
    return matchesChip && matchesSearch;
  });

  const openNotification = (n: NotificationItem) => {
    if (selectMode) {
      toggleSelected(n.id);
      return;
    }
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    // Deep link straight to the related record when there is one (an order, a bill, a
    // customer's credit page); a "general" announcement has no single record to jump to, so
    // it opens the plain in-app notification detail view instead, same as it always has.
    if (n.linkTo) {
      // Flag where this came from so the destination page's back button returns here
      // instead of its usual default (its own list, or home).
      navigate(n.linkTo, { state: { from: "notifications" } });
      return;
    }
    setActiveNotification({ ...n, read: true });
    setView("detail");
  };

  // Deep-link notifications (payment/orders/unpaid) never reach the detail view via the card
  // tap — that always navigates straight to the linked record. So a long body needs its own
  // way in: tapping "Read more" opens the full-text detail view regardless of linkTo, without
  // triggering the card's own tap (deep link / select-mode toggle).
  const openFullText = (n: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setActiveNotification({ ...n, read: true });
    setView("detail");
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const markSelectedRead = () => {
    setNotifications((prev) => prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: true } : n)));
    exitSelectMode();
  };

  const deleteSelected = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    exitSelectMode();
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleBack = () => {
    if (view === "detail") {
      setView("list");
      return;
    }
    if (selectMode) {
      exitSelectMode();
      return;
    }
    navigate("/");
  };

  const headerMenu = selectMode ? (
    <button
      type="button"
      onClick={exitSelectMode}
      aria-label="Close selection"
      className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
    >
      <X className="w-5 h-5 text-foreground" />
    </button>
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More options"
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
        >
          <MoreVertical className="w-5 h-5 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setSelectMode(true)}>
          <ListChecks className="w-4 h-4 mr-2" /> {t("notifications.selectInbox")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={markAllRead}>
          <CheckCheck className="w-4 h-4 mr-2" /> {t("notifications.readAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="mobile-container min-h-screen bg-background pb-24">
      {/* Select/Read-all only act on the list, so the menu is hidden while reading one notification. */}
      <AppHeader
        title={t("notifications.title")}
        showBack
        onBackClick={handleBack}
        rightElement={view === "detail" ? undefined : headerMenu}
      />

      {view === "detail" && activeNotification ? (
        <div className="px-4 space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">{activeNotification.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{activeNotification.subtitle}</p>
            </div>
            <img
              src={officePhoto}
              alt=""
              className="w-full h-48 object-cover rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{activeNotification.date}</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{activeNotification.body}</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <Inbox className="w-14 h-14 text-primary mb-4" strokeWidth={1.5} />
          <p className="font-semibold text-foreground">{t("notifications.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("notifications.emptyDesc")}</p>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {/* Search + chips stay pinned under the 72px-tall AppHeader while the list scrolls
              beneath them. The negative margin lets the background span the full width so
              items don't show through at the edges. */}
          <div className="sticky top-[72px] z-[9] -mx-4 px-4 pb-3 space-y-3 bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("notifications.searchPlaceholder")}
                className="pl-10 pr-9 h-11 rounded-xl bg-card border-border"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div
              {...chipsDragScroll}
              className={cn("flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]", chipsDragScroll.className)}
            >
              {CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setActiveChip(chip.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5",
                    activeChip === chip.value ? "bg-primary text-white" : "bg-card text-foreground shadow-sm",
                  )}
                >
                  {chip.label}
                  {!!chip.count && (
                    <span
                      className={cn(
                        "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center",
                        activeChip === chip.value ? "bg-white/25 text-white" : "bg-primary text-primary-foreground",
                      )}
                    >
                      {chip.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground">{t("notifications.noResults")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => {
                const selected = selectedIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => openNotification(n)}
                    className="bg-card rounded-2xl p-4 shadow-sm flex items-start gap-3 cursor-pointer"
                  >
                    {selectMode && (
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => toggleSelected(n.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 shrink-0 rounded-none border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {/* No detail screen to fall back on now — the card itself has to carry the
                          whole title and body, so neither is truncated/clamped here. */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 min-w-0">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />}
                          {/* min-w-0 on the paragraph itself, not just its wrapper — as a flex
                              item it otherwise refuses to shrink below its own unbroken content
                              width (e.g. one very long run of characters with no spaces),
                              pushing the card wider than the screen. */}
                          <p className="text-sm font-semibold text-foreground break-words min-w-0">{n.title}</p>
                        </div>
                        <div className="flex items-baseline gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground">{n.date}</span>
                          <span className="text-[11px] text-muted-foreground">{n.time}</span>
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-3 mt-1.5">
                        {/* Clamped to 3 lines — a long body (e.g. the policy-update fixture above)
                            previews here. "Read more" opens the full text regardless of category,
                            so a deep-linking card (whose own tap navigates away to the linked
                            record, never to the detail view) still has a way to read the rest. */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] leading-relaxed text-muted-foreground break-words line-clamp-3">{n.body}</p>
                          {/* ponytail: char-count heuristic for "does this overflow 3 lines" rather
                              than measuring scrollHeight — good enough at this card width; swap for
                              a ref-based overflow check if body copy ever varies the width. */}
                          {!selectMode && n.body.length > 140 && (
                            <button
                              type="button"
                              onClick={(e) => openFullText(n, e)}
                              className="text-[11px] font-medium text-primary mt-0.5"
                            >
                              {t("notifications.readMore")}
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
                          aria-label={t("notifications.viewImageAria")}
                          className="shrink-0"
                        >
                          <img src={officePhoto} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="max-w-[390px] mx-auto bg-background border-t border-border px-4 py-3 flex gap-3">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={markSelectedRead}
              className="flex-1 h-12 rounded-full bg-blue-500/10 text-blue-600 font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Check className="w-4 h-4" /> {t("notifications.read")}
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={deleteSelected}
              className="flex-1 h-12 rounded-full bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> {t("notifications.delete")}
            </button>
          </div>
        </div>
      )}

      {/* Image preview — the same placeholder photo every card shows a thumbnail of; tapping
          it here just views it larger, it doesn't navigate anywhere. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[420px] border-0 p-2 bg-transparent shadow-none">
          <DialogTitle className="sr-only">{t("notifications.imagePreviewTitle")}</DialogTitle>
          <img src={officePhoto} alt="" className="w-full max-h-[70vh] object-contain rounded-2xl" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;
