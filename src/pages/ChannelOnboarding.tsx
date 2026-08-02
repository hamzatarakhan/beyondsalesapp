import AppHeader from "@/components/AppHeader";
import { UserPlus } from "lucide-react";

const ChannelOnboarding = () => (
  <div className="mobile-container min-h-screen bg-background">
    <AppHeader title="Channel Onboarding" showBack />
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <UserPlus className="w-14 h-14 text-primary mb-4" strokeWidth={1.5} />
      <p className="font-semibold text-foreground">Channel Onboarding is coming soon</p>
      <p className="text-sm text-muted-foreground mt-1">We're still building this. Check back later.</p>
    </div>
  </div>
);

export default ChannelOnboarding;
