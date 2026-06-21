import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const SettingsPage = () => {
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
