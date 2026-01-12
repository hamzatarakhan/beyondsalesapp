import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanLine, Play } from "lucide-react";
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

const SearchCustomerForOwnership = () => {
  const navigate = useNavigate();
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      <AppHeader title="Search Customer" showBack />
      
      <div className="flex-1 px-4 pb-24">
        {/* ID Type */}
        <div className="mb-4">
          <label className="section-title block">ID type</label>
          <Select value={idType} onValueChange={setIdType}>
            <SelectTrigger className="w-full bg-card border-border h-12">
              <SelectValue placeholder="Select the ID type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="national-id">National ID</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="resident-card">Resident Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ID Number */}
        <div className="mb-6">
          <label className="section-title block">ID number</label>
          <Input
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="Enter the ID number"
            className="h-12 bg-card border-border"
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground">Or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Scan Card */}
        <div className="dashed-upload">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <ScanLine className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Tap to open camera scan
          </p>
          <button className="flex items-center gap-1 text-primary font-medium text-sm">
            Scan
            <Play className="w-4 h-4 fill-primary" />
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <div className="max-w-[390px] mx-auto">
          <Button
            onClick={() => navigate("/change-of-ownership")}
            className="w-full h-12 text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchCustomerForOwnership;
