import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  QrCode, 
  MoreHorizontal,
  XCircle,
  UserX,
  Users,
  Wallet,
  Package,
  BarChart3,
  History,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ActivityIcon from "@/components/ActivityIcon";
import EWalletBalancePreview from "@/components/EWalletBalancePreview";
import heroBanner from "@/assets/hero-banner.jpg";

const activities = [
  { icon: XCircle, label: "SIM Termination", path: "/search-subscription" },
  { icon: UserX, label: "Customer Termination", path: "/search-customer" },
  { icon: Users, label: "Change Ownership", path: "/search-customer-ownership" },
  { icon: Wallet, label: "Credit Limit", path: "/search-customer-credit" },
  { icon: Package, label: "Bundle Activation", path: "/search-bundle" },
];

const eWalletActivities = [
  { icon: BarChart3, label: "Analytics", path: "/ewallet?view=analytics" },
  { icon: History, label: "Transactions", path: "/ewallet?view=transactions" },
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container pb-24">
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold text-lg">
            H
          </div>
          <div>
            <p className="font-semibold text-foreground">Hello, Hamza</p>
            <p className="text-sm text-muted-foreground">123456789</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm">
            <QrCode className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm relative">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="px-4 py-4">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 h-[140px]">
          <div className="absolute inset-0 p-5 flex flex-col justify-center z-10">
            <h2 className="text-xl font-bold text-primary-foreground mb-1">
              Unlock Your Potential
            </h2>
            <p className="text-sm text-primary-foreground/90 leading-snug">
              Drive Sales, Expand Reach,<br />
              Achieve Success
            </p>
          </div>
          <img 
            src={heroBanner} 
            alt="Sales professional" 
            className="absolute right-0 top-0 h-full w-1/2 object-cover object-left opacity-90"
          />
          {/* Carousel dots */}
          <div className="absolute bottom-3 left-5 flex gap-1.5">
            <span className="w-5 h-1.5 rounded-full bg-primary-foreground" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
          </div>
        </div>
      </div>

      {/* Customer Activities */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground text-lg">Customer Activities</h3>
          <button className="w-8 h-8 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {activities.map((activity) => (
            <ActivityIcon
              key={activity.path}
              icon={activity.icon}
              label={activity.label}
              onClick={() => navigate(activity.path)}
            />
          ))}
        </div>
      </div>

      {/* E-Wallet Section */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">E-Wallet</h3>
          </div>
          <button className="w-8 h-8 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Balance Preview Widget */}
        <div className="mb-4">
          <EWalletBalancePreview />
        </div>

        {/* E-Wallet Activity Icons */}
        <div className="grid grid-cols-4 gap-y-5 gap-x-2">
          {eWalletActivities.map((activity) => (
            <ActivityIcon
              key={activity.path}
              icon={activity.icon}
              label={activity.label}
              onClick={() => navigate(activity.path)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Home;
