import { User } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";

const Profile = () => {
  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader title="Profile" showBack />
      <EmptyState
        icon={User}
        title="Profile not set up"
        description="Your profile details will appear here once available."
      />
      <BottomNav />
    </div>
  );
};

export default Profile;
