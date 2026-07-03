import { Home, LayoutGrid, Settings, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: LayoutGrid, label: t("nav.menu"), path: "/menu" },
    { icon: Settings, label: t("nav.settings"), path: "/settings" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-6 px-7 py-2 rounded-full bg-background/70 backdrop-blur-xl border border-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-[#E2E8F0] text-muted-foreground hover:text-foreground hover:bg-[#d1d9e6]"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
