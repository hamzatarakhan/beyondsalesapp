import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { IdCard, Users, ChevronRight } from "lucide-react";

const ChangeOwnershipChooser = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const options = [
    {
      id: "update-id",
      icon: IdCard,
      title: t("changeOwnershipChooser.updateIdTitle"),
      desc: t("changeOwnershipChooser.updateIdDesc"),
      path: "/change-ownership/update-id",
    },
    {
      id: "change-owner",
      icon: Users,
      title: t("changeOwnershipChooser.changeOwnerTitle"),
      desc: t("changeOwnershipChooser.changeOwnerDesc"),
      path: "/change-ownership/change-owner",
    },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background">
      <AppHeader title={t("changeOwnershipChooser.title")} showBack onBackClick={() => navigate("/")} />
      <div className="px-4 space-y-3">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => navigate(o.path)}
            className="w-full bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3 text-start"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <o.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{o.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChangeOwnershipChooser;
