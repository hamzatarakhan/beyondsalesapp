import { Hash, Smartphone, Mail, Share2, LogOut } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { useBrand, Brand } from "@/contexts/BrandContext";
import { cn } from "@/lib/utils";

// Prototype-only static profile — no employee backend to source this from yet.
const EMPLOYEE = {
  initials: "EN",
  name: "Employee Name",
  hierarchy: "Hierarchy Type",
  code: "Code",
  phone: "Phone Number",
  email: "Email",
};

const BrandBadge = ({ brand, className }: { brand: Brand; className?: string }) => (
  <div className={cn("bg-primary rounded-xl flex flex-col items-center justify-center text-primary-foreground", className)}>
    {brand === "virgin" ? (
      <>
        <span className="italic font-serif leading-none">Virgin</span>
        <span className="text-[9px] tracking-wide leading-none mt-0.5">mobile</span>
      </>
    ) : (
      <span className="text-xs font-semibold lowercase">friendi</span>
    )}
  </div>
);

const Profile = () => {
  const { brand } = useBrand();
  const qrData = encodeURIComponent(`EMPLOYEE:${EMPLOYEE.code}`);

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader
        title="Profile"
        showBack
        rightElement={
          <button
            type="button"
            aria-label="Log out"
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        }
      />

      <div className="px-4 space-y-4">
        <section className="bg-card rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                {EMPLOYEE.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{EMPLOYEE.name}</p>
                <p className="text-xs text-muted-foreground">{EMPLOYEE.hierarchy}</p>
              </div>
            </div>
            <BrandBadge brand={brand} className="w-14 h-11 text-sm shrink-0" />
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1">{EMPLOYEE.code}</span>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1">{EMPLOYEE.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1">{EMPLOYEE.email}</span>
              <button
                type="button"
                aria-label="Share"
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
              >
                <Share2 className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <h2 className="text-base font-semibold text-foreground">Scan QR Code</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-5">Place QR code inside the frame to scan</p>

          <div className="relative w-56 h-56">
            <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md" />

            <div className="absolute inset-4 flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`}
                alt="Profile QR code"
                className="w-full h-full"
              />
              <div className="absolute w-11 h-11 rounded-lg bg-card p-1 flex items-center justify-center">
                <BrandBadge brand={brand} className="w-full h-full rounded-md text-[8px]" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
