import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, X as XIcon } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

// The Purchase Orders flow's own confirm-prompt shape — a blue hexagon (not the app-wide
// red hexagon reserved for error popups), used identically for Submit/Approve/Reject/
// Cancel prompts across CreateOrder/ViewOrder, so it's a real shared component rather
// than the usual per-page duplication.
interface ConfirmMessageDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel: string;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  children?: ReactNode;
}

const ConfirmMessageDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
  confirmDisabled,
  children,
}: ConfirmMessageDrawerProps) => {
  const { t } = useTranslation();
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <button onClick={() => onOpenChange(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
          <XIcon className="w-4 h-4 text-foreground" />
        </button>
        <DrawerHeader className="text-center pt-8 pb-0">
          <DrawerTitle className="text-lg font-bold">{t("purchaseOrders.confirmMessage")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col items-center gap-1 pt-4 px-5 text-center">
          <div className="relative w-14 h-14 flex items-center justify-center mb-2">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-sky-500" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-6 h-6 text-sky-500 relative" strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-sky-600">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="px-5 pb-8 pt-4 space-y-4">
          {children}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={confirmDisabled}
              onClick={onConfirm}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
            >
              {confirmLabel}
            </button>
            <button type="button" onClick={onCancel ?? (() => onOpenChange(false))} className="w-full h-11 text-primary font-semibold text-sm">
              {cancelLabel}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ConfirmMessageDrawer;
