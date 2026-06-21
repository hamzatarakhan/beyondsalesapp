import { Construction } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

const SettingsPage = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Settings" showBack />

      <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Coming Soon
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Settings preferences are on the way. Check back in a future update.
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
