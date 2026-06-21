import { Settings } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const SettingsPage = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Settings" showBack />
      <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <Settings className="w-9 h-9 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Settings coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          Preference options will be available here soon.
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default SettingsPage;
