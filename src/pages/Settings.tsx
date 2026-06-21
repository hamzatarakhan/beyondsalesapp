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
        <div>
          <h3 className="section-title flex items-center gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </h3>
          <div className="app-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {isDark ? (
                  <Moon className="w-5 h-5 text-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Dark mode</p>
                <p className="text-xs text-muted-foreground">
                  {isDark ? "Dark theme enabled" : "Light theme enabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
