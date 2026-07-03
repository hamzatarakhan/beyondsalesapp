import { Construction, Moon, Sun } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Settings" showBack />

      <div className="px-4 mt-4 space-y-3">
        {/* Dark mode toggle — hidden for now, re-enable when ready */}
      </div>

      <EmptyState
        icon={Construction}
        title="Coming Soon"
        description="More settings preferences are on the way. Check back in a future update."
      />
      <BottomNav />
    </div>
  );
};

export default SettingsPage;
