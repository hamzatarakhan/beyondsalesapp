import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Eye, Boxes, Coins, Smartphone, CreditCard, Router as RouterIcon, X as XIcon } from "lucide-react";
import { PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/purchaseOrdersStore";

const PRODUCT_ICON: Record<ProductId, typeof Smartphone> = { esim: Smartphone, psim: CreditCard, router: RouterIcon };
const PRODUCT_TONE: Record<ProductId, string> = {
  esim: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  psim: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  router: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
};

// Demo only — every product shows the same generic stock figures and serial list.
const DEMO_PCS = 10;
const DEMO_KSA = 135;
const DEMO_SERIALS = Array.from({ length: 5 }, () => "#15448862233");

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viewingProduct, setViewingProduct] = useState<ProductId | null>(null);

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("inventoryDashboard.title")} showBack onBackClick={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        {PURCHASE_ORDER_PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICON[p.id];
          return (
            <div key={p.id} className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", PRODUCT_TONE[p.id])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${p.nameKey}`)}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                    <Boxes className="w-3 h-3" /> {t("purchaseOrders.pcs", { count: DEMO_PCS })}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                    <Coins className="w-3 h-3" /> {t("inventoryDashboard.ksa", { value: DEMO_KSA })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(p.id)}
                aria-label={t("purchaseOrders.viewSerialsAria")}
                className="w-9 h-9 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 flex items-center justify-center shrink-0"
              >
                <Eye className="w-4 h-4 text-primary" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ---------- View Item — serial numbers for the tapped product ---------- */}
      <Drawer open={!!viewingProduct} onOpenChange={(o) => { if (!o) setViewingProduct(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
          <button onClick={() => setViewingProduct(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t("inventoryDashboard.viewItem")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-2.5">
            {DEMO_SERIALS.map((serial, i) => (
              <div key={i} className="rounded-xl bg-muted/50 px-4 py-3.5 text-sm font-bold text-foreground">{serial}</div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default InventoryDashboard;
