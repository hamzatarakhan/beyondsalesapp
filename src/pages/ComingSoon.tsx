import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NavState {
  feature?: string;
}

const ComingSoon = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const feature = (location.state as NavState | null)?.feature;

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      <header className="relative z-10 px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label={t("comingSoon.backAria")}
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground rtl:rotate-180" />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center -mt-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <Rocket className="w-9 h-9 text-primary" />
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-1.5">
          {feature ?? t("comingSoon.title")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {t("comingSoon.message")}
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
