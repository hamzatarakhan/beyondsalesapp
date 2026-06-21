import AppHeader from "@/components/AppHeader";
import { Construction } from "lucide-react";
import EmptyState from "@/components/EmptyState";

const PhaseTwo = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Coming Soon" showBack />
      <EmptyState
        icon={Construction}
        title="Still working on it"
        description="This feature is in development and will be available in Phase 2."
      />
    </div>
  );
};

export default PhaseTwo;
