import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, User, CheckCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CreditLimitAdjustment = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [signatureAdded, setSignatureAdded] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newCreditLimit, setNewCreditLimit] = useState("");

  // Current credit data (mock)
  const currentCreditLimit = 500;
  const currentOutstandingAmount = 270;
  const availableCredit = currentCreditLimit - currentOutstandingAmount;

  const isFormComplete = reason && termsAccepted && newCreditLimit;

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

        {/* Current Credit Information */}
        <div>
          <h2 className="section-title">Current Credit Details</h2>
          <div className="app-card">
            <div className="billing-row">
              <span className="text-muted-foreground">Current Credit Limit</span>
              <span className="font-semibold text-foreground">{currentCreditLimit} OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-muted-foreground">Outstanding Amount</span>
              <span className="value-warning">{currentOutstandingAmount} OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-muted-foreground">Available Credit</span>
              <span className="value-positive">{availableCredit} OMR</span>
            </div>
          </div>
        </div>

        {/* New Credit Limit */}
        <div>
          <h2 className="section-title">New Credit Limit</h2>
          <Input
            type="number"
            value={newCreditLimit}
            onChange={(e) => setNewCreditLimit(e.target.value)}
            placeholder="Enter new credit limit"
            className="h-12 bg-card border-border"
          />
          <p className="text-xs text-muted-foreground mt-2 px-1">
            This will replace the current credit limit.
          </p>
        </div>

        {/* Adjustment Reason */}
        <div>
          <h2 className="section-title">Adjustment Reason</h2>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full bg-card border-border h-12">
              <SelectValue placeholder="Select the reason" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="customer-request">Customer request</SelectItem>
              <SelectItem value="payment-history">Payment history</SelectItem>
              <SelectItem value="risk-review">Risk review</SelectItem>
              <SelectItem value="temporary-adjustment">Temporary adjustment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
