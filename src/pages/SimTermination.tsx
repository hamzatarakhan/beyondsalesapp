import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, Clock, CheckCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SimIcon from "@/components/SimIcon";
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

const SimTermination = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [signatureAdded, setSignatureAdded] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Billing data (in real app, this would come from API)
  const totalOutstandingAmount = 170;
  const hasOutstandingBalance = totalOutstandingAmount > 0;

  const isFormComplete = reason && termsAccepted;

  const handleSubmit = () => {
    setShowSuccessDialog(true);
  };

  const handleGoHome = () => {
    setShowSuccessDialog(false);
    navigate("/");
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      <AppHeader title="SIM Termination" showBack />
      
      <div className="flex-1 px-4 pb-24 space-y-5">
        {/* SIM Summary Card */}
        <div className="app-card flex items-center gap-3">
          <SimIcon />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">MSISDN</span>
              <span className="type-badge">Postpaid</span>
            </div>
            <p className="font-semibold text-foreground">078 888 4698</p>
          </div>
          <span className="status-active">Active</span>
        </div>

        {/* Billing Information */}
        <div>
          <h2 className="section-title">Billing Information</h2>
          <div className="app-card">
            <div className="billing-row">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="value-positive">50 OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-muted-foreground">Unbilled Amount</span>
              <span className="value-warning">120 OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-muted-foreground">Billed Amount</span>
              <span className="value-negative">100 OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-foreground font-medium">Total Outstanding Amount</span>
              <span className="font-semibold text-foreground">{totalOutstandingAmount} OMR</span>
            </div>
          </div>
        </div>

        {/* Outstanding Balance Notice */}
        {hasOutstandingBalance && (
          <div className="app-card bg-warning/5 border border-warning/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-warning text-sm">Awaiting Payment Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have an outstanding balance of {totalOutstandingAmount} OMR. This request will be placed in "Awaiting Payment" status and the SIM will not be terminated until all dues are cleared.
              </p>
            </div>
          </div>
        )}

        {/* Termination Reason */}
        <div>
          <h2 className="section-title">Termination Reason</h2>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full bg-card border-border h-12">
              <SelectValue placeholder="Select the reason" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="switching-provider">Switching to another provider</SelectItem>
              <SelectItem value="no-longer-needed">No longer needed</SelectItem>
              <SelectItem value="poor-service">Poor service quality</SelectItem>
              <SelectItem value="relocating">Relocating abroad</SelectItem>
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
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${hasOutstandingBalance ? 'bg-warning/10' : 'bg-success/10'}`}>
              {hasOutstandingBalance ? (
                <Clock className="w-8 h-8 text-warning" />
              ) : (
                <CheckCircle className="w-8 h-8 text-success" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {hasOutstandingBalance ? "Request Submitted" : "SIM Terminated Successfully"}
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              {hasOutstandingBalance
                ? `Your termination request has been submitted. The SIM will be terminated once the outstanding balance of ${totalOutstandingAmount} OMR is paid.`
                : "Your SIM termination request has been processed successfully."}
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

export default SimTermination;
