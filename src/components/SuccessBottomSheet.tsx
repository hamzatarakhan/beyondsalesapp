import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Check, X } from "lucide-react";

export interface SuccessBottomSheetProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  orderId: string;
  mobileNumber: string;
  verificationMethod: string;
  contactPhone: string;
  email: string;
}

const ROWS = [
  { label: "Selected Plan", key: "planName" },
  { label: "Order ID", key: "orderId" },
  { label: "Mobile Number", key: "mobileNumber" },
  { label: "Verification Method", key: "verificationMethod" },
  { label: "Contact Phone", key: "contactPhone" },
  { label: "Email", key: "email" },
] as const;

export function SuccessBottomSheet({
  open,
  onClose,
  planName,
  orderId,
  mobileNumber,
  verificationMethod,
  contactPhone,
  email,
}: SuccessBottomSheetProps) {
  const data: Record<(typeof ROWS)[number]["key"], string> = {
    planName,
    orderId,
    mobileNumber,
    verificationMethod,
    contactPhone,
    email,
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
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

        <div className="flex flex-col items-center mb-5">
          <div className="rounded-full bg-success/15 p-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30">
              <Check className="w-8 h-8 text-success-foreground" strokeWidth={3} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Your Prepaid activation request has been submitted successfully
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          {ROWS.map((row, idx) => (
            <div
              key={row.key}
              className="flex items-center justify-between px-4 py-3 border-b border-border/60 last:border-0"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="text-sm font-semibold text-foreground text-right">
                {data[row.key]}
              </span>
            </div>
          ))}
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
