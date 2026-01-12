import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, User, Smartphone, Wifi, CheckCircle, ArrowRight } from "lucide-react";
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

const services = [
  { id: 1, icon: Smartphone, name: "078 888 4698", type: "Postpaid", status: "Active" },
  { id: 2, icon: Smartphone, name: "078 555 1234", type: "Prepaid", status: "Active" },
  { id: 3, icon: Wifi, name: "Home Broadband", type: "Postpaid", status: "Active" },
];

const ChangeOfOwnership = () => {
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [signatureAdded, setSignatureAdded] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
      <AppHeader title="Change of Ownership" showBack />
      
      <div className="flex-1 px-4 pb-24 space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">✓</span>
          </div>
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">✓</span>
          </div>
          <div className="flex-1 h-1 bg-primary rounded-full" />
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">3</span>
          </div>
        </div>

        {/* Section Header */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">Review & Submit</h2>
          <p className="text-sm text-muted-foreground">Review the ownership transfer details before submitting</p>
        </div>

        {/* Ownership Transfer Summary */}
        <div>
          <div className="app-card">
            {/* Current Owner */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Current Owner</p>
                <p className="font-semibold text-foreground">Ahmed Mohammed</p>
                <p className="text-sm text-muted-foreground">ID: 987654321</p>
              </div>
              <span className="status-active">Active</span>
            </div>

            {/* Arrow Indicator */}
            <div className="flex justify-center py-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-primary rotate-90" />
              </div>
            </div>

            {/* New Owner */}
            <div className="flex items-center gap-3 pt-0">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">New Owner</p>
                <p className="font-semibold text-foreground">Sara Ali Hassan</p>
                <p className="text-sm text-muted-foreground">ID: 123456789</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                Pending
              </span>
            </div>
          </div>
        </div>

        {/* Services to Transfer */}
        <div>
          <h2 className="section-title">Services to Be Transferred</h2>
          <div className="app-card space-y-0">
            {services.map((service, index) => (
              <div 
                key={service.id}
                className={`flex items-center gap-3 py-3 ${index !== services.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <service.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.type}</p>
                </div>
                <span className="status-active text-xs">{service.status}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 px-1">
            These services will be transferred to the new owner.
          </p>
        </div>

        {/* Transfer Reason */}
        <div>
          <h2 className="section-title">Transfer Reason</h2>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="w-full bg-card border-border h-12">
              <SelectValue placeholder="Select the reason" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="customer-request">Customer request</SelectItem>
              <SelectItem value="legal-transfer">Legal transfer</SelectItem>
              <SelectItem value="business-transfer">Business transfer</SelectItem>
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
              Ownership Transfer Submitted
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              Your ownership transfer request has been submitted successfully. The new owner will be notified to complete the process.
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

export default ChangeOfOwnership;
