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

const SearchSubscription = () => {
  const navigate = useNavigate();
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [msisdn, setMsisdn] = useState("");

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      <AppHeader title="Search Subscription" showBack />
      
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
        <div className="mb-4">
          <label className="section-title block">ID number</label>
          <Input
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="Enter the ID number"
            className="h-12 bg-card border-border"
          />
        </div>

        {/* MSISDN */}
        <div className="mb-6">
          <label className="section-title block">MSISDN</label>
          <Input
            value={msisdn}
            onChange={(e) => setMsisdn(e.target.value)}
            placeholder="Enter the MSISDN number"
            className="h-12 bg-card border-border"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <div className="max-w-[390px] mx-auto">
          <Button
            onClick={() => navigate("/sim-termination")}
            className="w-full h-12 text-base font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchSubscription;
