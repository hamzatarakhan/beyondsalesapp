import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Eye, FileText, Image as ImageIcon } from "lucide-react";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";
import { cn } from "@/lib/utils";
import type { OrderIssue } from "@/data/salesOrdersStore";

// Awaiting Delivery: dealer signs, accepts the terms, then confirms receipt, reports an
// issue (opens New Ticket), or rejects the order. Shared by the single- and
// multi-location Push Stock views.
export const DeliveryActions = ({
  onConfirm,
  onReportIssue,
  onReject,
}: {
  onConfirm: () => void;
  onReportIssue: () => void;
  onReject: () => void;
}) => {
  const { t } = useTranslation();
  const [signature, setSignature] = useState<string | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [terms, setTerms] = useState(false);
  const canConfirm = !!signature && terms;

  return (
    <>
      <SignatureBox title={t("salesOrders.delivery.dealerSignature")} value={signature} onEdit={() => setPadOpen(true)} onClear={() => setSignature(null)} />

      <section className="bg-card rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-3 select-none">
          <div
            role="checkbox"
            aria-checked={terms}
            tabIndex={0}
            onClick={() => setTerms(!terms)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTerms(!terms); } }}
            className={cn("w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer", terms ? "bg-primary border-primary" : "border-primary")}
          >
            {terms && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
          <p className="text-xs text-foreground text-start flex-1 leading-snug">
            {t("salesOrders.delivery.agreeTo")} <span className="text-primary font-semibold">{t("salesOrders.delivery.termsAndConditions")}</span>{" "}
            {t("salesOrders.delivery.andAcknowledge")} <span className="text-primary font-semibold">{t("salesOrders.delivery.privacyPolicy")}</span>.
          </p>
        </div>
      </section>

      <div className="space-y-3 pt-1">
        <button type="button" disabled={!canConfirm} onClick={onConfirm} className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50">
          {t("salesOrders.delivery.confirmReceipt")}
        </button>
        <button type="button" onClick={onReportIssue} className="w-full h-12 rounded-full bg-primary/15 text-foreground font-semibold text-sm">
          {t("salesOrders.delivery.reportIssue")}
        </button>
        <button type="button" onClick={onReject} className="w-full text-center text-sm font-semibold text-primary">
          {t("salesOrders.delivery.rejectOrder")}
        </button>
      </div>

      <SignaturePadSheet open={padOpen} title={t("salesOrders.delivery.dealerSignature")} initial={signature} onClose={() => setPadOpen(false)} onSave={(d) => { setSignature(d); setPadOpen(false); }} />
    </>
  );
};

// Issue Reported: read-only ticket details raised from Awaiting Delivery.
export const IssueDetails = ({ issue }: { issue: OrderIssue }) => {
  const { t } = useTranslation();
  const rows: [string, string][] = [
    [t("salesOrders.delivery.ticketId"), issue.ticketId],
    [t("salesOrders.delivery.ticketCategory"), issue.category],
    [t("salesOrders.delivery.subCategory"), issue.subCategory],
    [t("salesOrders.delivery.date"), issue.date],
    [t("salesOrders.delivery.priority"), issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)],
  ];
  return (
    <>
      <section className="bg-card rounded-2xl p-4 shadow-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
            <span className="text-[11px] text-muted-foreground">{label}</span>
            <span className="text-xs font-semibold text-foreground text-end">{value}</span>
          </div>
        ))}
      </section>

      {issue.documents.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-2">{t("salesOrders.delivery.documents")}</p>
          <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
            {issue.documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                {d.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                <span className="flex-1 text-sm text-muted-foreground">{d.name}</span>
                <Eye className="w-4 h-4 text-sky-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground mb-2">{t("salesOrders.delivery.description")}</p>
        <div className="rounded-2xl bg-muted/70 p-4 text-sm text-foreground min-h-[80px]">{issue.description}</div>
      </div>
    </>
  );
};
