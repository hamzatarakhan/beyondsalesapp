import { useRef, useState } from "react";
import { ChevronRight, Check, X, Eye, EyeOff, GripVertical } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { useWidgets } from "@/contexts/WidgetsContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const APPEARANCE_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const SettingsPage = () => {
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const { widgets, toggleWidget, reorderWidget } = useWidgets();
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [appearanceSheetOpen, setAppearanceSheetOpen] = useState(false);
  const [widgetsSheetOpen, setWidgetsSheetOpen] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);

  const [faceId, setFaceId] = useState(true);
  const [biometrics, setBiometrics] = useState(true);

  // Drag-to-reorder for the widget rows — Pointer Events so mouse and touch share one
  // code path. Pointer capture keeps move/up events targeting this same handle even
  // once the finger/cursor has moved off it, so no window-level listeners are needed.
  const widgetListRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{ id: string; startY: number; offsetY: number } | null>(null);

  const startDrag = (id: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragState({ id, startY: e.clientY, offsetY: 0 });
  };

  const onDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragState) return;
    const offsetY = e.clientY - dragState.startY;
    const rowEl = widgetListRef.current?.querySelector<HTMLElement>("[data-widget-row]");
    const rowHeight = (rowEl?.offsetHeight ?? 48) + 10; // + space-y-2.5 gap
    const fromIndex = widgets.findIndex((w) => w.id === dragState.id);
    const toIndex = Math.min(Math.max(fromIndex + Math.round(offsetY / rowHeight), 0), widgets.length - 1);
    if (toIndex !== fromIndex) {
      reorderWidget(fromIndex, toIndex);
      // Re-baseline so the next delta is measured from the row's new position.
      setDragState({ id: dragState.id, startY: e.clientY, offsetY: 0 });
    } else {
      setDragState({ ...dragState, offsetY });
    }
  };

  const endDrag = () => setDragState(null);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const languages: { code: "en" | "ar"; label: string }[] = [
    { code: "en", label: t("settings.english") },
    { code: "ar", label: t("settings.arabic") },
  ];

  const selectLang = (code: "en" | "ar") => {
    setLang(code);
    setLangSheetOpen(false);
  };

  const submitPin = () => {
    setPinSheetOpen(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title={t("settings.title")} showBack />

      <div className="px-4 mt-4 space-y-3">
        <button
          onClick={() => setWidgetsSheetOpen(true)}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between text-start"
        >
          <p className="text-sm font-semibold text-foreground">Widgets</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>

        <button
          onClick={() => setPinSheetOpen(true)}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between text-start"
        >
          <p className="text-sm font-semibold text-foreground">Change PIN Code</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>

        {/* Language row → opens languages sheet */}
        <button
          onClick={() => setLangSheetOpen(true)}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between text-start"
        >
          <p className="text-sm font-semibold text-foreground">{t("settings.language")}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs font-semibold uppercase">{lang}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </button>

        <div className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Allow Face ID</p>
          <Switch checked={faceId} onCheckedChange={setFaceId} />
        </div>

        <div className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Biometrics</p>
          <Switch checked={biometrics} onCheckedChange={setBiometrics} />
        </div>

        <button
          onClick={() => setAppearanceSheetOpen(true)}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between text-start"
        >
          <p className="text-sm font-semibold text-foreground">Appearance</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs font-semibold">{APPEARANCE_OPTIONS.find((o) => o.value === themeMode)?.label}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </button>

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-foreground mb-2 px-1">Device Info</h3>
          <div className="bg-card rounded-2xl shadow-sm divide-y divide-border/60">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version Number</span>
              <span className="text-sm font-semibold text-foreground">41.5</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Build Number</span>
              <span className="text-sm font-semibold text-foreground">Value</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Languages bottom sheet */}
      <Drawer open={langSheetOpen} onOpenChange={setLangSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="w-9" />
            <h3 className="text-xl font-bold text-foreground">{t("settings.languagesTitle")}</h3>
            <button
              onClick={() => setLangSheetOpen(false)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center"
              aria-label={t("activation.signature.close")}
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="divide-y divide-border/60">
            {languages.map((l) => {
              const active = lang === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => selectLang(l.code)}
                  className="w-full flex items-center justify-between py-4 text-start"
                >
                  <span className={`text-base ${active ? "font-semibold text-primary" : "text-foreground"}`}>
                    {l.label}
                  </span>
                  {active && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Appearance bottom sheet */}
      <Drawer open={appearanceSheetOpen} onOpenChange={setAppearanceSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="w-9" />
            <DrawerTitle className="text-xl font-bold text-foreground">Appearance</DrawerTitle>
            <button
              onClick={() => setAppearanceSheetOpen(false)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="divide-y divide-border/60">
            {APPEARANCE_OPTIONS.map((opt) => {
              const active = themeMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { setThemeMode(opt.value); setAppearanceSheetOpen(false); }}
                  className={cn("w-full flex items-center justify-between py-4 px-3 -mx-3 rounded-xl text-start", active && "bg-primary/10")}
                >
                  <span className={cn("text-base", active ? "font-semibold text-primary" : "text-foreground")}>{opt.label}</span>
                  {active && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Widgets bottom sheet — toggles show/hide the widget on Home, drag reorders it there too */}
      <Drawer open={widgetsSheetOpen} onOpenChange={setWidgetsSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">Widgets</DrawerTitle>
          </DrawerHeader>
          <div ref={widgetListRef} className="px-4 pb-8 space-y-2.5">
            {widgets.map((w) => {
              const isDragging = dragState?.id === w.id;
              return (
                <div
                  key={w.id}
                  data-widget-row
                  style={isDragging ? { transform: `translateY(${dragState.offsetY}px)`, position: "relative", zIndex: 10 } : undefined}
                  className={cn(
                    "w-full flex items-center gap-2 py-3 px-3 rounded-xl bg-muted/40 transition-shadow",
                    isDragging && "shadow-lg bg-card",
                  )}
                >
                  <button
                    type="button"
                    aria-label={`Reorder ${w.label}`}
                    onPointerDown={startDrag(w.id)}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                  </button>
                  <span className="flex-1 text-sm text-foreground">{w.label}</span>
                  <Switch checked={w.enabled} onCheckedChange={() => toggleWidget(w.id)} />
                </div>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Change PIN Code bottom sheet */}
      <Drawer open={pinSheetOpen} onOpenChange={setPinSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setPinSheetOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">Change PIN Code</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Current PIN</label>
              <div className="relative">
                <Input
                  type={showCurrentPin ? "text" : "password"}
                  inputMode="numeric"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder="Enter current PIN"
                  className="h-12 bg-card rounded-xl pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin((v) => !v)}
                  aria-label={showCurrentPin ? "Hide PIN" : "Show PIN"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">New PIN</label>
              <div className="relative">
                <Input
                  type={showNewPin ? "text" : "password"}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter New PIN"
                  className="h-12 bg-card rounded-xl pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin((v) => !v)}
                  aria-label={showNewPin ? "Hide PIN" : "Show PIN"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confirm PIN Code</label>
              <div className="relative">
                <Input
                  type={showConfirmPin ? "text" : "password"}
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Enter New PIN"
                  className="h-12 bg-card rounded-xl pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin((v) => !v)}
                  aria-label={showConfirmPin ? "Hide PIN" : "Show PIN"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={submitPin}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm mt-2"
            >
              Submit
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SettingsPage;
