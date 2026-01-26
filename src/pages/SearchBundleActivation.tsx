import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SearchBundleActivation = () => {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState("");

  const handleContinue = () => {
    if (mobileNumber) {
      navigate("/bundle-plans");
    }
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col">
      <AppHeader title="Bundle Activation/Renewal" showBack />

      <div className="flex-1 px-4 pt-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Mobile Number
          </label>
          <Input
            type="tel"
            placeholder="Enter the mobile number"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="h-12 rounded-xl bg-card border-border"
          />
        </div>
      </div>

      <div className="p-4">
        <Button
          onClick={handleContinue}
          disabled={!mobileNumber}
          className="w-full h-12 rounded-xl text-base font-medium"
          variant="outline"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default SearchBundleActivation;
