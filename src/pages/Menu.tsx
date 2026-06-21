import { LayoutGrid } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";

const Menu = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Menu" showBack />
      <EmptyState
        icon={LayoutGrid}
        title="No menu items yet"
        description="This section is currently empty. Check back later for updates."
      />
      <BottomNav />
    </div>
  );
};

export default Menu;
