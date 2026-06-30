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
  Smartphone,
  CreditCard,
  RefreshCw,
  PackageCheck,
  MapPin,
  ArrowLeftRight,
  UserPlus,
  ClipboardList,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ActivityIcon from "@/components/ActivityIcon";

import SematiVerification from "@/components/SematiVerification";
import { useState } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ListChecks, LayoutList, X as XIcon } from "lucide-react";

const activities = [
  { icon: Sparkles, label: "SIM Activation", path: "/new-activation" },
  { icon: PackageCheck, label: "Fulfilment", path: "/phase-2" },
];



const memberOnboarding = [
  { icon: UserPlus, label: "Channel Onboarding", path: "/", badge: 0 },
  { icon: ClipboardList, label: "Onboarding Requests", path: "/", badge: 3 },
];

const Home = () => {
  const navigate = useNavigate();
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [flowChoiceOpen, setFlowChoiceOpen] = useState(false);

  const handleActivityClick = (path: string) => {
    setPendingPath(path);
    setVerifyOpen(true);
  };

  const goWithMode = (mode: "classic" | "staged") => {
    try {
      sessionStorage.setItem("activationMode", mode);
    } catch {}
    const path = pendingPath;
    setFlowChoiceOpen(false);
    setPendingPath(null);
    if (path) navigate(path);
  };

  return (
    <div className="mobile-container pb-24 bg-background">
      {/* Header */}
      <header className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold text-foreground text-[15px]">Hello, Hamza 👋</p>
            <p className="text-xs text-muted-foreground">123456789</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm relative">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-[8px] font-bold text-primary-foreground">
              V
            </div>
            <ArrowLeftRight className="w-3 h-3 text-foreground absolute -right-0.5 -bottom-0.5 bg-card rounded-full p-0.5 box-content" strokeWidth={2.5} />
          </button>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm">
            <QrCode className="w-4 h-4 text-foreground" />
          </button>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm relative">
            <Bell className="w-4 h-4 text-foreground" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="px-4 pb-4">
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
      <div className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/50" style={{borderWidth:"0.5px"}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Customer Activities</h3>
            <button className="w-8 h-8 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {activities.map((activity) => (
              <ActivityIcon
                key={activity.label}
                icon={activity.icon}
                label={activity.label}
                color="teal"
                onClick={() =>
                  activity.label === "Prepaid" || activity.label === "SIM Activation"
                    ? handleActivityClick(activity.path)
                    : navigate(activity.path)
                }
              />
            ))}
          </div>

        </div>
      </div>

      {/*
        NOTE: Hidden per request — keep these widgets in source for future use.
        To restore, uncomment the Working Shift, Tickets, and Member Onboarding sections below.

      // Working Shift
      <div className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/50" style={{borderWidth:"0.5px"}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">My Working Shift</h3>
            <button className="flex items-center gap-1 text-primary text-sm font-medium">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">10:00 AM - 6:00 PM</p>
              <p className="text-xs text-muted-foreground">Today's Schedule</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 text-xs font-medium">
              Not Started
            </span>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Store Name</p>
                <p className="text-xs text-muted-foreground">City Centre, Muscat</p>
              </div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-700 text-white dark:bg-zinc-200 dark:text-zinc-900 text-xs font-medium">
              View map
            </button>
          </div>
          <div className="flex gap-2 mb-3">
            <span className="flex-1 text-center px-2 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium">
              ✓ Check-in: HH:MM
            </span>
            <span className="flex-1 text-center px-2 py-1.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 text-xs font-medium">
              ✓ Check-out: HH:MM
            </span>
          </div>
          <button className="w-full py-3 rounded-full bg-muted text-muted-foreground font-medium text-sm">
            Check in
          </button>
        </div>
      </div>

      // Tickets
      <div className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/50" style={{borderWidth:"0.5px"}}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Tickets</h3>
            <button className="flex items-center gap-1 text-primary text-sm font-medium">
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { count: 100, label: "Progress", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
              { count: 50, label: "Closed", color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
              { count: 20, label: "Resolved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
            ].map((s) => (
              <div key={s.label} className="bg-muted/40 rounded-xl py-3 flex flex-col items-center gap-1.5">
                <p className="text-xl font-bold text-foreground">{s.count}</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.color}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-full bg-primary/10 text-primary font-medium text-sm flex items-center justify-center gap-1">
            + New Ticket
          </button>
        </div>
      </div>

      // Member Onboarding
      <div className="px-4 mb-4">
        <div className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/50" style={{borderWidth:"0.5px"}}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Member Onboarding</h3>
          </div>
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {memberOnboarding.map((item) => (
              <div key={item.label} className="relative">
                {item.badge > 0 && (
                  <span className="absolute -top-1 right-2 z-10 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <ActivityIcon
                  icon={item.icon}
                  label={item.label}
                  color="amber"
                  onClick={() => navigate(item.path)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      */}

      <BottomNav />
      <SematiVerification
        open={verifyOpen}
        audience="dealer"
        onClose={() => {
          setVerifyOpen(false);
          setPendingPath(null);
        }}
        onVerified={() => {
          setVerifyOpen(false);
          // Only the Prepaid flow has the two-option choice; everything else
          // navigates directly.
          if (pendingPath === "/prepaid-search") {
            setFlowChoiceOpen(true);
          } else {
            if (pendingPath) navigate(pendingPath);
            setPendingPath(null);
          }
        }}
      />

      <Drawer open={flowChoiceOpen} onOpenChange={(o) => { if (!o) { setFlowChoiceOpen(false); setPendingPath(null); } }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => { setFlowChoiceOpen(false); setPendingPath(null); }}
            aria-label="Close"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">Choose Activation Flow</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              Select how you want to complete this activation
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-3">
            <button
              onClick={() => goWithMode("classic")}
              className="w-full text-left flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/60 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <LayoutList className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">STC Flow</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Details → Review & pay → Complete.
                </p>
              </div>
            </button>
            <button
              onClick={() => goWithMode("staged")}
              className="w-full text-left flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/60 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ListChecks className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">Option 2 -- Multiple steps</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  SIM & KIT → Details → Review & pay.
                </p>
              </div>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Home;
