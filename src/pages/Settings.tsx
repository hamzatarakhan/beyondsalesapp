import { Construction } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";

const SettingsPage = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Settings" showBack />
      <EmptyState
        icon={Construction}
        title="Coming Soon"
        description="Settings preferences are on the way. Check back in a future update."
      />
      <BottomNav />
    </div>
  );
};

export default SettingsPage;
