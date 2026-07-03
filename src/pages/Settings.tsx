import { Construction, Languages } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

const SettingsPage = () => {
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title={t("settings.title")} showBack />

      <div className="px-4 mt-4 space-y-3">
        {/* Language toggle */}
        <div className="bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Languages className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("settings.language")}</p>
              <p className="text-[11px] text-muted-foreground">
                {lang === "ar" ? "العربية" : "English"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-full p-1">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                lang === "en" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("ar")}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                lang === "ar" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              AR
            </button>
          </div>
        </div>
      </div>

      <EmptyState
        icon={Construction}
        title={t("settings.comingSoon")}
        description={t("settings.comingSoonDesc")}
      />
      <BottomNav />
    </div>
  );
};

export default SettingsPage;
