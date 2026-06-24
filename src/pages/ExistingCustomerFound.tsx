import { useLocation, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { SarIcon } from "@/components/SarIcon";
import {
  CheckCircle2,
  User,
  IdCard,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Smartphone,
  Sparkles,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react";

const ExistingCustomerFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = (location.state as any)?.customer;

  if (!customer) {
    return (
      <div className="mobile-container flex flex-col min-h-screen bg-background">
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

  const prev = customer.previousActivation;
  const payLabel: Record<string, string> = {
    card: "Card",
    cash: "Cash",
    apple: "Apple Pay",
  };
  const activationRows = prev
    ? [
        {
          icon: Smartphone,
          label: "SIM Type",
          value: prev.simType === "esim" ? "E-SIM" : "P-SIM",
        },
        {
          icon: prev.numberSource === "mnp" ? ArrowRightLeft : Sparkles,
          label: prev.numberSource === "mnp" ? "Port number (MNP)" : "New number",
          value: prev.numberSource === "mnp" ? prev.portNumber : prev.phone,
        },
        {
          icon: Sparkles,
          label: "Plan",
          value: prev.planTitle ? (
            <span className="inline-flex items-center gap-1">
              {prev.planTitle} • {prev.planPrice} <SarIcon className="opacity-70" /> / {prev.planValidity}
            </span>
          ) : undefined,
        },
        {
          icon: CreditCard,
          label: "Payment method",
          value: payLabel[prev.pay] ?? prev.pay,
        },
      ].filter((r) => r.value)
    : [];

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-background">
      <AppHeader title="Existing Customer" showBack />

      <div className="flex-1 px-4 pb-32">
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-2xl p-3 flex items-center gap-2 mb-4">
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

        {activationRows.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-foreground mt-5 mb-2">
              Previous activation details
            </h3>
            <div className="bg-card rounded-2xl shadow-sm divide-y divide-border">
              {activationRows.map((r) => (
                <div key={r.label} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <r.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground">
                      {r.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {r.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Selecting "Continue with existing data" will prefill these values
              into the activation form.
            </p>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background space-y-2">
        <div className="max-w-[390px] mx-auto space-y-2">
          <Button
            onClick={() =>
              navigate("/prepaid-activation", {
                state: {
                  prefill: { ...customer, ...(customer.previousActivation ?? {}) },
                  fromExisting: true,
                },
              })
            }
            className="w-full h-12 rounded-full text-base font-semibold"
          >
            Continue with existing data
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              navigate("/prepaid-activation", {
                state: {
                  prefill: {
                    idType: customer.idType,
                    nationality: customer.nationality,
                    idNumber: customer.idNumber,
                  },
                },
              })
            }
            className="w-full h-12 rounded-full text-base font-semibold border-primary text-primary"
          >
            Start new activation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExistingCustomerFound;