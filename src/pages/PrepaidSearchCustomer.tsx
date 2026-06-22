import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AlertCircle, RotateCcw, UserPlus, History } from "lucide-react";
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

// Mock data: which IDs resolve to which state
const EXISTING_CUSTOMERS: Record<string, any> = {
  "1234567890": {
    fullName: "Mohammed Al-Saud",
    idType: "national-id",
    idNumber: "1234567890",
    nationality: "sa",
    dob: "1990-05-12",
    phone: "0501234567",
    email: "mohammed@example.com",
    address: "Riyadh, Saudi Arabia",
    // Previously captured activation details for this customer.
    // Used by ExistingCustomerFound + PrepaidActivation prefill so the
    // dealer can resume with the same data shown on the activation form.
    previousActivation: {
      simType: "psim",
      kit: "1234567890",
      numberSource: "new",
      phone: "0785599574",
      isPrimary: true,
      planType: "1m",
      selectedPlan: 0,
      planTitle: "Starter Plan",
      planPrice: 30,
      planValidity: "Valid 30 days",
      pay: "card",
    },
  },
};
const NOT_FOUND_IDS = new Set(["0000000000"]);

const formatValidators: Record<string, { test: (v: string) => boolean; hint: string }> = {
  "national-id": {
    test: (v) => /^\d{10}$/.test(v),
    hint: "National ID must be exactly 10 digits.",
  },
  passport: {
    test: (v) => /^[A-Z0-9]{6,12}$/i.test(v),
    hint: "Passport must be 6–12 letters or digits.",
  },
  "resident-card": {
    test: (v) => /^\d{10}$/.test(v),
    hint: "Resident Card must be exactly 10 digits.",
  },
};

type FieldErrors = {
  idType?: string;
  nationality?: string;
  idNumber?: string; // "required" | "format" message
};

const PrepaidSearchCustomer = () => {
  const navigate = useNavigate();
  const [idType, setIdType] = useState("national-id");
  const [nationality, setNationality] = useState("sa");
  const [idNumber, setIdNumber] = useState("1234567890");
  const [errors, setErrors] = useState<FieldErrors>({});
  // Distinct from the empty-field error: result of a backend lookup
  const [lookupError, setLookupError] = useState<null | "not-found" | "invalid">(null);
  const [draftPrompt, setDraftPrompt] = useState<
    | null
    | {
        idType: string;
        nationality: string;
        idNumber: string;
        savedAt: number;
      }
  >(null);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!idType) e.idType = "Please select an ID type.";
    if (!nationality) e.nationality = "Please select a nationality.";
    if (!idNumber.trim()) {
      e.idNumber = "Please fill the ID number.";
    } else {
      const v = formatValidators[idType];
      if (v && !v.test(idNumber.trim())) e.idNumber = v.hint;
    }
    return e;
  };

  const handleContinue = () => {
    const e = validate();
    setErrors(e);
    setLookupError(null);
    if (Object.keys(e).length) return;

    const value = idNumber.trim();
    if (NOT_FOUND_IDS.has(value)) {
      setLookupError("not-found");
      return;
    }
    const existing = EXISTING_CUSTOMERS[value];
    if (existing) {
      navigate("/prepaid-existing-customer", {
        state: { customer: existing },
      });
      return;
    }
    // New customer flow — check whether this ID already has a previously
    // cancelled draft on file before sending them into a fresh activation.
    const existingDraft = getActivationDraft(value);
    if (existingDraft) {
      setDraftPrompt({
        idType,
        nationality,
        idNumber: value,
        savedAt: existingDraft.savedAt,
      });
      return;
    }
    navigate("/prepaid-activation", {
      state: { prefill: { idType, nationality, idNumber: value } },
    });
  };

  const resetAll = () => {
    setIdType("");
    setNationality("");
    setIdNumber("");
    setErrors({});
    setLookupError(null);
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-background">
      <AppHeader title="Search Customer" showBack />

      <div className="flex-1 px-4 pb-28">
        <Field
          label="ID Type"
          required
          error={errors.idType}
        >
          <Select
            value={idType}
            onValueChange={(v) => {
              setIdType(v);
              if (v === "national-id") setNationality("sa");
              if (errors.idType) setErrors((p) => ({ ...p, idType: undefined }));
              if (errors.idNumber) setErrors((p) => ({ ...p, idNumber: undefined }));
              setLookupError(null);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full bg-card rounded-xl h-12 shadow-sm",
                errors.idType ? "border border-destructive" : "border-0"
              )}
            >
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="national-id">National ID</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="resident-card">Resident Card</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Nationality"
          required
          error={errors.nationality}
        >
          <Select
            value={nationality}
            onValueChange={(v) => {
              setNationality(v);
              if (errors.nationality)
                setErrors((p) => ({ ...p, nationality: undefined }));
              setLookupError(null);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full bg-card rounded-xl h-12 shadow-sm",
                errors.nationality ? "border border-destructive" : "border-0"
              )}
            >
              <SelectValue placeholder="Select nationality" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="sa">Saudi</SelectItem>
              <SelectItem value="om">Omani</SelectItem>
              <SelectItem value="ae">Emirati</SelectItem>
              <SelectItem value="eg">Egyptian</SelectItem>
              <SelectItem value="in">Indian</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="ID Number"
          required
          error={errors.idNumber}
        >
          <Input
            value={idNumber}
            onChange={(e) => {
              setIdNumber(e.target.value);
              if (errors.idNumber)
                setErrors((p) => ({ ...p, idNumber: undefined }));
              setLookupError(null);
            }}
            placeholder="Enter the ID Number"
            className={cn(
              "h-12 bg-card rounded-xl shadow-sm",
              errors.idNumber ? "border border-destructive" : "border-0"
            )}
          />
        </Field>

        {/* Lookup error — distinct from empty-field error */}
        {lookupError && (
          <div className="mt-3 rounded-xl bg-destructive/10 border border-destructive/30 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-destructive">
                  {lookupError === "not-found"
                    ? "No record found"
                    : "Invalid ID"}
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {lookupError === "not-found"
                    ? "We couldn't find any customer with that ID. Re-enter the number or start a fresh search."
                    : "The ID you entered is not valid. Please check and try again."}
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setIdNumber("");
                      setLookupError(null);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-destructive px-3 py-1.5 rounded-full bg-card border border-destructive/40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-enter
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-full bg-card border border-primary/40"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Start fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <div className="max-w-[390px] mx-auto">
          <Button
            onClick={handleContinue}
            className="w-full h-12 rounded-full text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>

      <Dialog open={!!draftPrompt} onOpenChange={(o) => !o && setDraftPrompt(null)}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mb-2">
              <History className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>Resume previous activation?</DialogTitle>
            <DialogDescription>
              This customer already started an activation that wasn't
              completed
              {draftPrompt ? ` (${formatDraftAge(draftPrompt.savedAt)})` : ""}.
              Would you like to continue from the saved data or start a new
              activation?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={() => {
                if (!draftPrompt) return;
                const p = draftPrompt;
                setDraftPrompt(null);
                navigate("/prepaid-activation", {
                  state: {
                    prefill: {
                      idType: p.idType,
                      nationality: p.nationality,
                      idNumber: p.idNumber,
                    },
                    resumeDraft: true,
                  },
                });
              }}
              className="w-full h-11 rounded-full"
            >
              Continue from saved data
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!draftPrompt) return;
                const p = draftPrompt;
                clearActivationDraft(p.idNumber);
                setDraftPrompt(null);
                navigate("/prepaid-activation", {
                  state: {
                    prefill: {
                      idType: p.idType,
                      nationality: p.nationality,
                      idNumber: p.idNumber,
                    },
                  },
                });
              }}
              className="w-full h-11 rounded-full border-primary text-primary"
            >
              Start new activation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-foreground mb-2">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
  </div>
);

export default PrepaidSearchCustomer;