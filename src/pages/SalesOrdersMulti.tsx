import AppHeader from "@/components/AppHeader";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";

// Placeholder — the Multiple Locations business (what a multi-location sales order
// actually looks like) hasn't been supplied yet. Swap this in for the real flow once it
// is; the entry point (Home's "Multiple Locations" option) already routes here.
const SalesOrdersMulti = () => {
  const { t } = useTranslation();
  return (
    <div className="mobile-container min-h-screen bg-background">
      <AppHeader title={t("home.multipleLocations")} showBack />
      <div className="flex flex-col items-center text-center px-8 py-20 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">{t("salesOrders.multiLocationComingSoon")}</p>
      </div>
    </div>
  );
};

export default SalesOrdersMulti;
