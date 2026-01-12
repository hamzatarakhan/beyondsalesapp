import { useState } from "react";
import { Plus, Check, User, Smartphone, Wifi, Clock } from "lucide-react";
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
import { toast } from "sonner";

const services = [
  { id: 1, icon: Smartphone, name: "078 888 4698", type: "Postpaid", status: "Active" },
  { id: 2, icon: Smartphone, name: "078 555 1234", type: "Prepaid", status: "Active" },
  { id: 3, icon: Wifi, name: "Home Broadband", type: "Postpaid", status: "Active" },
];

const CustomerTermination = () => {
  const [reason, setReason] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [signatureAdded, setSignatureAdded] = useState(false);

  // Billing data (in real app, this would come from API)
  const totalOutstandingAmount = 270;
  const hasOutstandingBalance = totalOutstandingAmount > 0;

  const isFormComplete = reason && termsAccepted;

  const handleSubmit = () => {
    if (hasOutstandingBalance) {
      toast.info("Request moved to Awaiting Payment", {
        description: `Your termination request has been submitted. The customer account will be terminated once the outstanding balance of ${totalOutstandingAmount} OMR is paid.`,
      });
    } else {
      toast.success("Customer Termination submitted successfully!", {
        description: "Your request has been processed.",
      });
    }
  };

  return (
    <div className="mobile-container flex flex-col min-h-screen">
      <AppHeader title="Customer Termination" showBack />
      
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
          <span className="status-active">Active</span>
        </div>

        {/* Active Services */}
        <div>
          <h2 className="section-title">Active Services</h2>
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
            All listed services will be terminated.
          </p>
        </div>

        {/* Billing Information */}
        <div>
          <h2 className="section-title">Billing Information</h2>
          <div className="app-card">
            <div className="billing-row">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="value-positive">80 OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-muted-foreground">Unbilled Amount</span>
              <span className="value-warning">150 OMR</span>
            </div>
            <div className="billing-row">
              <span className="text-muted-foreground">Billed Amount</span>
              <span className="value-negative">120 OMR</span>
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
                You have an outstanding balance of {totalOutstandingAmount} OMR. This request will be placed in "Awaiting Payment" status and the customer account will not be terminated until all dues are cleared.
              </p>
            </div>
          </div>
        )}

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
    </div>
  );
};

export default CustomerTermination;
