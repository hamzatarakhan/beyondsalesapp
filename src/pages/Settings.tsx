import { useState } from "react";
import { Construction, ChevronRight, Check, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();
  const [langSheetOpen, setLangSheetOpen] = useState(false);

  const languages: { code: "en" | "ar"; label: string }[] = [
    { code: "en", label: t("settings.english") },
    { code: "ar", label: t("settings.arabic") },
  ];

  const selectLang = (code: "en" | "ar") => {
    setLang(code);
    setLangSheetOpen(false);
  };

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title={t("settings.title")} showBack />

      <div className="px-4 mt-4 space-y-3">
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
      </div>

      <EmptyState
        icon={Construction}
        title={t("settings.comingSoon")}
        description={t("settings.comingSoonDesc")}
      />
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
    </div>
  );
};

export default SettingsPage;
