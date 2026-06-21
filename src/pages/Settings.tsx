import { Moon, Sun, Palette } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Settings" showBack />

      <div className="px-4 pt-4 space-y-4">
        {/* Dark mode toggle hidden for now — theme logic preserved in ThemeContext */}
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
