import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  QrCode,
  Network,
  ClipboardCheck,
  UserPlus,
  ClipboardList,
  Target,
  BarChart3,
  GraduationCap,
  Calendar,
  Headphones,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { X as XIcon } from "lucide-react";
import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";

interface ServiceItem {
  icon: LucideIcon;
  label: string;
  path?: string;
}

const SECTIONS: { title: string; items: ServiceItem[] }[] = [
  {
    title: "Stock Management",
    items: [
      { icon: Network, label: "My Hierarchy" },
      { icon: ClipboardCheck, label: "Check In" },
    ],
  },
  {
    title: "Channel Member Onboarding",
    items: [
      { icon: UserPlus, label: "Channel Onboarding", path: "/channel-onboarding" },
      { icon: ClipboardList, label: "Onboarding Requests", path: "/onboarding-requests" },
    ],
  },
  {
    title: "KPI Dashboard",
    items: [
      { icon: Target, label: "Sales KPI's" },
      { icon: BarChart3, label: "Performance at Glance" },
    ],
  },
  {
    title: "Other widgets",
    items: [
      { icon: GraduationCap, label: "Training Hub" },
      { icon: Calendar, label: "My Shifts" },
      { icon: Headphones, label: "Tickets" },
    ],
  },
];

const Menu = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [qrSheetOpen, setQrSheetOpen] = useState(false);

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <header dir="ltr" className="sticky top-0 z-10 bg-background px-4 py-4 grid grid-cols-[2.5rem_1fr_auto] items-center gap-2">
        <button
          onClick={() => navigate("/")}
          aria-label="Back"
          className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-center text-lg font-semibold text-foreground truncate">Services</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrSheetOpen(true)}
            aria-label="Show QR code"
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
          >
            <QrCode className="w-[18px] h-[18px] text-foreground" strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/notifications")}
            aria-label="Notifications"
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm relative"
          >
            <Bell className="w-[18px] h-[18px] text-foreground" strokeWidth={2.5} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </header>

      <div className="px-4 space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="bg-card rounded-2xl p-4 shadow-[var(--card-shadow)] border border-border/60">
            <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
            <div className="divide-y divide-border/60">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.path ? () => navigate(item.path!) : undefined}
                  className="w-full flex items-center gap-3 py-3 text-start"
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm text-foreground">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />

      <Drawer open={qrSheetOpen} onOpenChange={setQrSheetOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh]">
          <button
            onClick={() => setQrSheetOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10"
          >
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">QR Code</DrawerTitle>
          </DrawerHeader>
          <div className="px-8 pb-6 flex items-center justify-center">
            <div className="bg-white p-4 rounded-2xl">
              <QRCode value={t("home.dealerId")} size={200} />
            </div>
          </div>
          <div className="px-4 pb-8">
            <button
              onClick={() => setQrSheetOpen(false)}
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              Done
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Menu;
