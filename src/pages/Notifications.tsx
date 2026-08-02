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
}

// Prototype-only static notifications — no backend to source these from yet.
const LOREM =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: "1", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "22, Dec, 2025", time: "8:52 AM", read: false, category: "general" },
  { id: "2", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "21, Dec, 2025", time: "8:52 AM", read: false, category: "payment" },
  { id: "3", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "21, Dec, 2025", time: "8:52 AM", read: false, category: "orders" },
  { id: "4", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "20, Dec, 2025", time: "8:52 AM", read: true, category: "unpaid" },
  { id: "5", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "20, Dec, 2025", time: "8:52 AM", read: true, category: "general" },
  { id: "6", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "19, Dec, 2025", time: "8:52 AM", read: true, category: "payment" },
  { id: "7", title: "New week at the office – attached schedule", subtitle: "Subtitle here", body: LOREM, date: "19, Dec, 2025", time: "8:52 AM", read: true, category: "orders" },
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
        <DropdownMenuItem
          onClick={() => {
            setView("list");
            setSelectMode(true);
          }}
        >
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
                    className="bg-card rounded-xl p-3.5 shadow-sm flex items-start gap-3 cursor-pointer"
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                          <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pr-2">{n.body}</p>
                    </div>
                    <img src={officePhoto} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
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
    </div>
  );
};

export default Notifications;
