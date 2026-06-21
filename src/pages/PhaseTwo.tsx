import AppHeader from "@/components/AppHeader";
import { Construction } from "lucide-react";

const PhaseTwo = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Coming Soon" showBack />
      <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
          <Construction className="w-9 h-9 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Still working on it</h2>
        <p className="text-sm text-muted-foreground max-w-[240px]">
          This feature is in development and will be available in Phase 2.
        </p>
      </div>
    </div>
  );
};

export default PhaseTwo;
