import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  User,
  IdCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  History,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  clearActivationDraft,
  getActivationDraft,
  formatDraftAge,
} from "@/lib/activationDrafts";

const ExistingCustomerFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = (location.state as any)?.customer;

  const draft = useMemo(
    () => (customer ? getActivationDraft(customer.idNumber) : null),
    [customer]
  );
  const [confirmStartNew, setConfirmStartNew] = useState(false);

  if (!customer) {
    return (
      <div className="mobile-container flex flex-col min-h-screen bg-[hsl(210,20%,96%)]">
        <AppHeader title="Existing Customer" showBack />
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-sm text-muted-foreground text-center">
            No customer data available. Please search again.
          </p>
        </div>
      </div>
    );
  }

  const rows = [
    { icon: User, label: "Full Name", value: customer.fullName },
    { icon: IdCard, label: "ID Number", value: customer.idNumber },
    { icon: Globe, label: "Nationality", value: customer.nationality?.toUpperCase() },
    { icon: Calendar, label: "Date of Birth", value: customer.dob },
    { icon: Phone, label: "Phone", value: customer.phone },
    { icon: Mail, label: "Email", value: customer.email },
    { icon: MapPin, label: "Address", value: customer.address },
  ].filter((r) => r.value);

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-[hsl(210,20%,96%)]">
      <AppHeader title="Existing Customer" showBack />

      <div className="flex-1 px-4 pb-32">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Customer record found
            </p>
            <p className="text-[11px] text-emerald-700/80">
              This customer already exists on file. Review their details below.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <r.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{r.label}</p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {r.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {draft && (
        <div className="px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 mb-4">
            <History className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Unfinished activation found
              </p>
              <p className="text-[11px] text-amber-800/80">
                This customer started an activation that wasn't completed
                ({formatDraftAge(draft.savedAt)}). You can pick up where
                they left off, or start a new activation.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[hsl(210,20%,96%)] space-y-2">
        <div className="max-w-[390px] mx-auto space-y-2">
          {draft && (
            <Button
              onClick={() =>
                navigate("/prepaid-activation", {
                  state: {
                    prefill: customer,
                    fromExisting: true,
                    resumeDraft: true,
                  },
                })
              }
              className="w-full h-12 rounded-full text-base font-semibold"
            >
              Continue from saved data
            </Button>
          )}
          <Button
            variant={draft ? "outline" : "default"}
            onClick={() =>
              navigate("/prepaid-activation", {
                state: { prefill: customer, fromExisting: true },
              })
            }
            className={
              draft
                ? "w-full h-12 rounded-full text-base font-semibold border-primary text-primary"
                : "w-full h-12 rounded-full text-base font-semibold"
            }
          >
            Continue with existing data
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (draft) {
                setConfirmStartNew(true);
                return;
              }
              navigate("/prepaid-activation", {
                state: {
                  prefill: {
                    idType: customer.idType,
                    nationality: customer.nationality,
                    idNumber: customer.idNumber,
                  },
                },
              });
            }}
            className="w-full h-12 rounded-full text-base font-semibold border-primary text-primary"
          >
            Start new activation
          </Button>
        </div>
      </div>

      <Dialog open={confirmStartNew} onOpenChange={setConfirmStartNew}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Discard saved activation?</DialogTitle>
            <DialogDescription>
              Starting a new activation will permanently delete the
              previously saved data for this customer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmStartNew(false)}
              className="flex-1 h-11 rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                clearActivationDraft(customer.idNumber);
                setConfirmStartNew(false);
                navigate("/prepaid-activation", {
                  state: {
                    prefill: {
                      idType: customer.idType,
                      nationality: customer.nationality,
                      idNumber: customer.idNumber,
                    },
                  },
                });
              }}
              className="flex-1 h-11 rounded-full"
            >
              Discard & start new
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExistingCustomerFound;