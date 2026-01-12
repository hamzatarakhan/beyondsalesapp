import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, User, CheckCircle, Info } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Range lookups based on category
const rangeLookups: Record<string, { value: string; label: string; creditLimit: number }[]> = {
  "bank-statement": [
    { value: "balance-1000-5000", label: "Balance 1,000 - 5,000 OMR", creditLimit: 100 },
    { value: "balance-5000-10000", label: "Balance 5,000 - 10,000 OMR", creditLimit: 200 },
    { value: "balance-10000-plus", label: "Balance 10,000+ OMR", creditLimit: 300 },
  ],
  "salary-slip": [
    { value: "salary-100-500", label: "Salary 100 - 500 OMR", creditLimit: 50 },
    { value: "salary-500-1000", label: "Salary 500 - 1,000 OMR", creditLimit: 100 },
    { value: "salary-1000-2000", label: "Salary 1,000 - 2,000 OMR", creditLimit: 150 },
    { value: "salary-2000-plus", label: "Salary 2,000+ OMR", creditLimit: 250 },
  ],
  "credit-card": [
    { value: "limit-500-2000", label: "Credit Limit 500 - 2,000 OMR", creditLimit: 75 },
    { value: "limit-2000-5000", label: "Credit Limit 2,000 - 5,000 OMR", creditLimit: 150 },
    { value: "limit-5000-plus", label: "Credit Limit 5,000+ OMR", creditLimit: 250 },
  ],
};

const CreditLimitAdjustment = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [selectedRange, setSelectedRange] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [signatureAdded, setSignatureAdded] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Current credit data (mock)
  const currentCreditLimit = 500;

  // Get available ranges based on selected category
  const availableRanges = category ? rangeLookups[category] || [] : [];

  // Get credit limit based on selected range
  const selectedRangeData = availableRanges.find(r => r.value === selectedRange);
  const newCreditLimit = selectedRangeData?.creditLimit || 0;

  const isFormComplete = category && selectedRange && termsAccepted;

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSelectedRange(""); // Reset range when category changes
  };

  const handleSubmit = () => {
    setShowSuccessDialog(true);
  };

  const handleGoHome = () => {
    setShowSuccessDialog(false);
    navigate("/");
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      <AppHeader title="Credit Limit Adjustment" showBack />
      
      <div className="flex-1 px-4 pb-24 space-y-5">
        {/* Customer Summary Card */}
        <div className="app-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Ahmed Mohammed</p>
            <p className="text-sm text-muted-foreground">Customer ID: 987654321</p>
          </div>
          <span className="type-badge">Postpaid</span>
        </div>

        {/* Current Credit Limit - Simple Display */}
        <div className="app-card">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Credit Limit</span>
            <span className="font-semibold text-foreground text-lg">{currentCreditLimit} OMR</span>
          </div>
        </div>

        {/* Category Dropdown */}
        <div>
          <h2 className="section-title">Category</h2>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full bg-card border-border h-12">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="bank-statement">Bank Statement</SelectItem>
              <SelectItem value="salary-slip">Salary Slip</SelectItem>
              <SelectItem value="credit-card">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Range Dropdown - Shows based on category selection */}
        {category && (
          <div>
            <h2 className="section-title">Select Range</h2>
            <Select value={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger className="w-full bg-card border-border h-12">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availableRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Hint Message - Shows when range is selected */}
        {selectedRange && newCreditLimit > 0 && (
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
            <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground">
              This range will give you a credit limit of <span className="font-semibold text-primary">{newCreditLimit} OMR</span> for usage.
            </p>
          </div>
        )}

        {/* Documents */}
        <div>
          <h2 className="section-title">Documents</h2>
          <div 
            className="dashed-upload cursor-pointer"
            onClick={() => setDocumentsUploaded(!documentsUploaded)}
          >
            {documentsUploaded ? (
              <>
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm text-success font-medium">Document uploaded</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-primary border-dashed flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Upload your files here</p>
              </>
            )}
          </div>
        </div>

        {/* Signature */}
        <div>
          <h2 className="section-title">Signature</h2>
          <div 
            className="dashed-upload cursor-pointer"
            onClick={() => setSignatureAdded(!signatureAdded)}
          >
            {signatureAdded ? (
              <>
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <p className="text-sm text-success font-medium">Signature added</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full border-2 border-primary border-dashed flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">No signature found here</p>
              </>
            )}
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="app-card flex items-center gap-3">
          <Checkbox
            id="terms"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
            Terms and Conditions
          </label>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background">
        <div className="max-w-[390px] mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!isFormComplete}
            className="w-full h-12 text-base font-semibold disabled:opacity-50"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-[340px] rounded-2xl">
          <DialogHeader className="text-center items-center pt-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <DialogTitle className="text-xl">
              Credit Limit Updated
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              The credit limit has been successfully adjusted from {currentCreditLimit} OMR to {newCreditLimit} OMR.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={handleGoHome} className="w-full h-12">
              Go to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditLimitAdjustment;
