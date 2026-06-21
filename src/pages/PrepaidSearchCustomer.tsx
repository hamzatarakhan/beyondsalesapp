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

const PrepaidSearchCustomer = () => {
  const navigate = useNavigate();
  const [idType, setIdType] = useState("");
  const [nationality, setNationality] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState(false);

  const canContinue = idType && nationality;

  const handleContinue = () => {
    if (!idNumber.trim()) {
      setError(true);
      return;
    }
    setError(false);
    navigate("/prepaid-activation");
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-[hsl(210,20%,96%)]">
      <AppHeader title="Search Customer" showBack />

      <div className="flex-1 px-4 pb-28">
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            ID Type <span className="text-primary">*</span>
          </label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger className="w-full bg-card border-0 rounded-xl h-12 shadow-sm">
              <SelectValue placeholder="Select ID type" />
            </SelectTrigger>
            <SelectContent className="bg-card">
              <SelectItem value="national-id">National ID</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="resident-card">Resident Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            Nationality <span className="text-primary">*</span>
          </label>
          <Select value={nationality} onValueChange={setNationality}>
            <SelectTrigger className="w-full bg-card border-0 rounded-xl h-12 shadow-sm">
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
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            ID Number <span className="text-primary">*</span>
          </label>
          <Input
            value={idNumber}
            onChange={(e) => {
              setIdNumber(e.target.value);
              if (error && e.target.value.trim()) setError(false);
            }}
            placeholder="Enter the ID Number"
            className={cn(
              "h-12 bg-card rounded-xl shadow-sm",
              error ? "border-primary" : "border-0"
            )}
          />
          {error && (
            <p className="text-xs text-primary mt-1.5">Please fill the ID number .</p>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[hsl(210,20%,96%)]">
        <div className="max-w-[390px] mx-auto">
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full h-12 rounded-full text-base font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrepaidSearchCustomer;