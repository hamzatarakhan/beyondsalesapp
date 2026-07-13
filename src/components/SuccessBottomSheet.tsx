import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface SuccessBottomSheetProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  showMessage?: boolean;
  children?: ReactNode;
}

export function SuccessBottomSheet({
  open,
  onClose,
  orderId,
  showMessage = true,
  children,
}: SuccessBottomSheetProps) {
  const { t } = useTranslation();
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2 max-h-[92vh]">
        

        <div className="flex items-center justify-between mb-5">
          <div className="w-7" />
          <h3 className="font-semibold text-foreground text-base">{t("activation.success.title")}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label={t("activation.success.close")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-4">
          <div className="rounded-full bg-success/15 p-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30">
              <Check className="w-8 h-8 text-success-foreground" strokeWidth={3} />
            </div>
          </div>
          {showMessage && (
            <p className="text-sm text-muted-foreground text-center">
              {t("activation.success.message")}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {t("activation.success.orderId")} <span className="font-semibold text-foreground">{orderId}</span>
          </p>
        </div>

        <div className="overflow-y-auto space-y-3 mb-4 -mx-1 px-1">
          {children}
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
        >
          {t("activation.success.goHome")}
        </button>
      </DrawerContent>
    </Drawer>
  );
}
