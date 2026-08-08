import { useRef, useState } from "react";
import { ChevronRight, Check, X, Eye, EyeOff, GripVertical, Moon, Smartphone } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme, type ThemeMode } from "@/contexts/ThemeContext";
import { useWidgets, WIDGET_LABEL_KEYS } from "@/contexts/WidgetsContext";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useTheme();
  const { widgets, toggleWidget, reorderWidget } = useWidgets();

  const appearanceOptions: { value: ThemeMode; label: string }[] = [
    { value: "light", label: t("settings.appearanceLight") },
    { value: "dark", label: t("settings.appearanceDark") },
    { value: "system", label: t("settings.appearanceSystem") },
  ];
  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [appearanceSheetOpen, setAppearanceSheetOpen] = useState(false);
  const [widgetsSheetOpen, setWidgetsSheetOpen] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [themeSoonMode, setThemeSoonMode] = useState<"dark" | "system" | null>(null);

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
          <p className="text-sm font-semibold text-foreground">{t("settings.widgets")}</p>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>

        <button
          onClick={() => setPinSheetOpen(true)}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between text-start"
        >
          <p className="text-sm font-semibold text-foreground">{t("settings.changePinCode")}</p>
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
          <p className="text-sm font-semibold text-foreground">{t("settings.allowFaceId")}</p>
          <Switch checked={faceId} onCheckedChange={setFaceId} />
        </div>

        <div className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{t("settings.biometrics")}</p>
          <Switch checked={biometrics} onCheckedChange={setBiometrics} />
        </div>

        <button
          onClick={() => setAppearanceSheetOpen(true)}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between text-start"
        >
          <p className="text-sm font-semibold text-foreground">{t("settings.appearance")}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-xs font-semibold">{appearanceOptions.find((o) => o.value === themeMode)?.label}</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </button>

        <div className="pt-2">
          <h3 className="text-sm font-semibold text-foreground mb-2 px-1">{t("settings.deviceInfo")}</h3>
          <div className="bg-card rounded-2xl shadow-sm divide-y divide-border/60">
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("settings.versionNumber")}</span>
              <span className="text-sm font-semibold text-foreground">41.5</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("settings.buildNumber")}</span>
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
              aria-label={t("settings.close")}
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
            <DrawerTitle className="text-xl font-bold text-foreground">{t("settings.appearance")}</DrawerTitle>
            <button
              onClick={() => setAppearanceSheetOpen(false)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center"
              aria-label={t("settings.close")}
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="divide-y divide-border/60">
            {appearanceOptions.map((opt) => {
              const active = themeMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setAppearanceSheetOpen(false);
                    if (opt.value === "dark" || opt.value === "system") {
                      setThemeSoonMode(opt.value);
                    } else {
                      setThemeMode(opt.value);
                    }
                  }}
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

      {/* Dark and System modes aren't wired up to actually apply yet — this just informs
          the dealer instead of silently no-op'ing when they tap either in the Appearance sheet. */}
      <Dialog open={themeSoonMode !== null} onOpenChange={(o) => !o && setThemeSoonMode(null)}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            {themeSoonMode === "system" ? <Smartphone className="w-6 h-6 text-primary" /> : <Moon className="w-6 h-6 text-primary" />}
          </div>
          <h3 className="font-semibold text-foreground text-lg">
            {t(themeSoonMode === "system" ? "settings.systemModeSoonTitle" : "settings.darkModeSoonTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {t(themeSoonMode === "system" ? "settings.systemModeSoonDesc" : "settings.darkModeSoonDesc")}
          </p>
          {/* Wrapped in a div — DialogContent's [&>button]:hidden (meant only for Radix's
              auto-injected close button) would otherwise also hide this direct-child button. */}
          <div>
            <button
              onClick={() => setThemeSoonMode(null)}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("settings.gotIt")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Widgets bottom sheet — toggles show/hide the widget on Home, drag reorders it there too */}
      <Drawer open={widgetsSheetOpen} onOpenChange={setWidgetsSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("settings.widgets")}</DrawerTitle>
          </DrawerHeader>
          <div ref={widgetListRef} className="px-4 pb-8 space-y-2.5">
            {widgets.map((w) => {
              const isDragging = dragState?.id === w.id;
              const label = t(WIDGET_LABEL_KEYS[w.id] ?? w.id);
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
                    aria-label={t("settings.reorderWidget", { label })}
                    onPointerDown={startDrag(w.id)}
                    onPointerMove={onDragMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="touch-none cursor-grab active:cursor-grabbing shrink-0 p-1 -m-1"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                  </button>
                  <span className="flex-1 text-sm text-foreground">{label}</span>
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
            aria-label={t("settings.close")}
            className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("settings.changePinCode")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("settings.currentPin")}</label>
              <div className="relative">
                <Input
                  type={showCurrentPin ? "text" : "password"}
                  inputMode="numeric"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  placeholder={t("settings.enterCurrentPin")}
                  className="h-12 bg-card rounded-xl pe-11"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPin((v) => !v)}
                  aria-label={showCurrentPin ? t("settings.hidePin") : t("settings.showPin")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("settings.newPin")}</label>
              <div className="relative">
                <Input
                  type={showNewPin ? "text" : "password"}
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={t("settings.enterNewPin")}
                  className="h-12 bg-card rounded-xl pe-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin((v) => !v)}
                  aria-label={showNewPin ? t("settings.hidePin") : t("settings.showPin")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t("settings.confirmPinCode")}</label>
              <div className="relative">
                <Input
                  type={showConfirmPin ? "text" : "password"}
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder={t("settings.enterNewPin")}
                  className="h-12 bg-card rounded-xl pe-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin((v) => !v)}
                  aria-label={showConfirmPin ? t("settings.hidePin") : t("settings.showPin")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={submitPin}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm mt-2"
            >
              {t("settings.submitPin")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SettingsPage;
