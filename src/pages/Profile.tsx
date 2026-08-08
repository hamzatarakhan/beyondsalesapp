import { useState } from "react";
import { Hash, Smartphone, Mail, Share2, LogOut, Network, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useBrand, Brand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import virginBadge from "@/assets/virgin-mobile-badge.svg";
import friendiBadge from "@/assets/friendi-mobile-badge.svg";

const BrandBadge = ({ brand, className }: { brand: Brand; className?: string }) =>
  brand === "virgin" ? (
    <img src={virginBadge} alt="Virgin Mobile" className={cn("object-contain", className)} />
  ) : (
    <div className={cn("bg-card rounded-xl flex items-center justify-center p-1.5", className)}>
      <img src={friendiBadge} alt="friendi" className="w-full h-full object-contain" />
    </div>
  );

const Profile = () => {
  const { brand } = useBrand();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();

  // Prototype-only static profile — no employee backend to source this from yet.
  const EMPLOYEE = {
    initials: "EN",
    name: t("profile.employeePlaceholder.name"),
    hierarchy: t("profile.employeePlaceholder.hierarchy"),
    code: t("profile.employeePlaceholder.code"),
    phone: t("profile.hierarchy.phoneNumber"),
    email: t("profile.hierarchy.email"),
  };

  const qrData = encodeURIComponent(`EMPLOYEE:${EMPLOYEE.code}`);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setLogoutOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mobile-container pb-24 min-h-screen bg-background">
      <AppHeader
        title={t("profile.title")}
        showBack
        rightElement={
          <button
            type="button"
            aria-label={t("profile.logOutAria")}
            onClick={() => setLogoutOpen(true)}
            className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center"
          >
            <LogOut className="w-5 h-5 text-foreground rtl:-scale-x-100" />
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
            <BrandBadge brand={brand} className="w-14 h-11 shrink-0" />
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
                aria-label={t("profile.shareAria")}
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
              >
                <Share2 className="w-4 h-4 text-primary" />
              </button>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => navigate("/profile/hierarchy")}
          className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center gap-3 text-start"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t("profile.myHierarchy")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("profile.myHierarchySub")}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
        </button>

        <section className="bg-card rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <h2 className="text-base font-semibold text-foreground">{t("profile.scanQrCode")}</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-5">{t("profile.scanQrCodeSub")}</p>

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
                <BrandBadge brand={brand} className="w-full h-full rounded-md" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <BottomNav />

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 gap-2 text-center [&>button]:hidden">
          <div className="mx-auto relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none" stroke="#0284c7" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <span className="text-2xl font-bold text-[#0284c7] relative">!</span>
          </div>
          <DialogTitle className="font-semibold text-[#0284c7] text-lg">{t("profile.logOut")}</DialogTitle>
          <p className="text-sm text-muted-foreground mb-3">{t("profile.logOutConfirm")}</p>
          {/* Wrapped in a div — DialogContent's [&>button]:hidden (meant only for Radix's
              auto-injected close button) would otherwise also hide these direct-child buttons. */}
          <div className="flex gap-3">
            <button
              onClick={() => setLogoutOpen(false)}
              className="flex-1 py-3 rounded-full bg-primary/10 text-foreground font-semibold text-sm"
            >
              {t("profile.cancel")}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
            >
              {t("profile.logoutAction")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
