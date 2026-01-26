import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Download,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  mockTransactions,
  activityTypeLabels,
  statusLabels,
  type Transaction,
} from "@/data/mockWalletData";
import { toast } from "@/hooks/use-toast";

const EWalletTransactionDetails = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const transaction = mockTransactions.find((t) => t.id === transactionId);

  if (!transaction) {
    return (
      <div className="mobile-container min-h-screen flex flex-col">
        <AppHeader title="Transaction Details" showBack />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Transaction not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-success bg-success/10";
      case "pending":
        return "text-warning bg-warning/10";
      case "failed":
        return "text-destructive bg-destructive/10";
    }
  };

  const shareLink = `https://ewallet.example.com/txn/${transaction.referenceId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The shareable link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleExport = (type: "pdf" | "excel") => {
    toast({
      title: `Exporting as ${type.toUpperCase()}`,
      description: "Your transaction details will be downloaded shortly.",
    });
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col pb-20">
      <AppHeader title="Transaction Details" showBack />

      {/* Transaction Status Header */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl p-6 text-center">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              transaction.transactionType === "credit" ? "bg-success/10" : "bg-destructive/10"
            )}
          >
            {transaction.transactionType === "credit" ? (
              <ArrowDownLeft className="w-8 h-8 text-success" />
            ) : (
              <ArrowUpRight className="w-8 h-8 text-destructive" />
            )}
          </div>
          <p
            className={cn(
              "text-3xl font-bold",
              transaction.transactionType === "credit" ? "text-success" : "text-destructive"
            )}
          >
            {transaction.transactionType === "credit" ? "+" : "-"}{transaction.amount} {transaction.currency}
          </p>
          <span className={cn("text-sm px-3 py-1 rounded-full mt-2 inline-block", getStatusColor(transaction.status))}>
            {statusLabels[transaction.status]}
          </span>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl divide-y divide-border">
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Transaction Type</span>
            <span className="font-medium text-foreground capitalize">{transaction.transactionType}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Activity</span>
            <span className="font-medium text-foreground">{activityTypeLabels[transaction.activityType]}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Description</span>
            <span className="font-medium text-foreground">{transaction.description}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="font-medium text-foreground">{format(transaction.date, "MMM d, yyyy • h:mm a")}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Member</span>
            <span className="font-medium text-foreground">{transaction.memberName}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Reference ID</span>
            <span className="font-medium text-foreground text-sm">{transaction.referenceId}</span>
          </div>
        </div>
      </div>

      {/* Balance Impact */}
      <div className="px-4 mb-6">
        <h3 className="font-semibold text-foreground mb-3">Balance Impact</h3>
        <div className="bg-card rounded-2xl divide-y divide-border">
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Amount</span>
            <span
              className={cn(
                "font-bold",
                transaction.transactionType === "credit" ? "text-success" : "text-destructive"
              )}
            >
              {transaction.transactionType === "credit" ? "+" : "-"}{transaction.amount} {transaction.currency}
            </span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Balance Before</span>
            <span className="font-medium text-foreground">{transaction.balanceBefore} {transaction.currency}</span>
          </div>
          <div className="p-4 flex justify-between items-center">
            <span className="text-muted-foreground">Balance After</span>
            <span className="font-medium text-foreground">{transaction.balanceAfter} {transaction.currency}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-[390px] mx-auto flex gap-3">
          {/* Share Dialog */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 h-12 rounded-xl">
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[350px] rounded-2xl bg-card">
              <DialogHeader>
                <DialogTitle>Share Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Generate a secure, view-only link to share this transaction.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="h-11 rounded-xl bg-muted text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Link2 className="w-4 h-4" />
                  <span>This link is view-only and secure</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Export Dropdown */}
          <div className="flex-1 flex gap-2">
            <Button
              variant="default"
              className="flex-1 h-12 rounded-xl"
              onClick={() => handleExport("pdf")}
            >
              <Download className="w-5 h-5 mr-2" />
              PDF
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-12 rounded-xl"
              onClick={() => handleExport("excel")}
            >
              <Download className="w-5 h-5 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EWalletTransactionDetails;
