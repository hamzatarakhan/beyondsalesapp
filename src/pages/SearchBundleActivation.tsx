import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Button } from "@/components/ui/button";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { AlertCircle } from "lucide-react";

// Mock list of numbers that have bundles (in real app, this would come from API)
const numbersWithBundles = ["578632498", "512345678", "599887766"];

const SearchBundleActivation = () => {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleContinue = async () => {
    if (!mobileNumber) return;

    setError(null);
    setIsChecking(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Check if number has bundles (mock validation)
    const hasBundles = numbersWithBundles.includes(mobileNumber);

    setIsChecking(false);

    if (hasBundles) {
      navigate("/bundle-plans");
    } else {
      setError("This number doesn't have any available bundles. Please try another number.");
    }
  };

  // numbersWithBundles stores the 9-digit local part with no leading 0, so mobileNumber
  // keeps that same shape — PhoneNumberInput's "full local number" contract is adapted
  // here rather than changing the mock data's format.
  const handlePhoneChange = (v: string) => {
    setMobileNumber(v.replace(/^0/, ""));
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col">
      <AppHeader title="Bundle Activation/Renewal" showBack />

      <div className="flex-1 px-4 pt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Mobile Number
          </label>
          <PhoneNumberInput
            value={mobileNumber ? "0" + mobileNumber : ""}
            onChange={handlePhoneChange}
            error={!!error}
          />
          
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-xl mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive font-medium">No bundles found</p>
                <p className="text-sm text-muted-foreground mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <Button
          onClick={handleContinue}
          disabled={!mobileNumber || isChecking}
          className="w-full h-12 rounded-xl text-base font-medium"
          variant="outline"
        >
          Continue
        </Button>
      </div>

      <BrandLoadingOverlay open={isChecking} />
    </div>
  );
};

export default SearchBundleActivation;
