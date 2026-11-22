import { useEffect, useState } from "react";
import { Home, LayoutGrid, Settings, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Like Facebook: the bar slides away while the page scrolls down (more screen to read) and glides
  // back on scrolling up, at the top, or shortly after scrolling stops. Pages scroll in different
  // containers (Home scrolls its own container, others the app canvas), so every scroll is caught
  // in the capture phase and judged by how far that element moved.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const lastTop = new WeakMap<object, number>();
    let idle: number | undefined;
    const onScroll = (e: Event) => {
      const t = e.target;
      const el = t instanceof Element ? t : document.scrollingElement;
      if (!el) return;
      const y = el.scrollTop;
      const dy = y - (lastTop.get(el) ?? y);
      lastTop.set(el, y);
      if (y <= 8 || dy < -4) setHidden(false);
      else if (dy > 4) setHidden(true);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.clearTimeout(idle);
    };
  }, []);

  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/" },
    { icon: LayoutGrid, label: t("nav.menu"), path: "/menu" },
    { icon: Settings, label: t("nav.settings"), path: "/settings" },
    { icon: User, label: t("nav.profile"), path: "/profile" },
  ];

  return (
    <div
      className={`fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none transition-[transform,opacity,visibility] duration-300 ease-out ${
        hidden ? "translate-y-2 opacity-0 invisible" : "translate-y-0 opacity-100 visible"
      }`}
    >
      <nav className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full bg-background/70 dark:bg-white/10 backdrop-blur-xl border border-border/40 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center justify-center w-14 h-14 rounded-full transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-foreground/5 hover:bg-foreground/10 dark:bg-foreground/10 dark:hover:bg-foreground/15 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
