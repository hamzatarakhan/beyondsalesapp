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
        <div className="bg-card rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              {isDark ? (
                <Moon className="w-4 h-4 text-primary" />
              ) : (
                <Sun className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Dark mode</p>
              <p className="text-[11px] text-muted-foreground">
                {isDark ? "On" : "Off"}
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
