import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

export interface SuccessBottomSheetProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  children?: ReactNode;
}

export function SuccessBottomSheet({
  open,
  onClose,
  orderId,
  children,
}: SuccessBottomSheetProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2 max-h-[92vh]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />

        <div className="flex items-center justify-between mb-5">
          <div className="w-7" />
          <h3 className="font-semibold text-foreground text-base">Success</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
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
          <p className="text-sm text-muted-foreground text-center">
            Your Prepaid activation request has been submitted successfully
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Order ID: <span className="font-semibold text-foreground">{orderId}</span>
          </p>
        </div>

        <div className="overflow-y-auto space-y-3 mb-4 -mx-1 px-1">
          {children}
        </div>

        <button
          onClick={onClose}
          className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
        >
          Go to Home
        </button>
      </DrawerContent>
    </Drawer>
  );
}
