import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ID_TYPE_ORDER, ID_TYPE_RULES, type IdTypeRule } from "@/pages/NewActivation";
import {
  ClipboardList,
  Phone,
  Camera,
  Plus,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  AlertCircle,
  Check,
  XCircle,
  X,
} from "lucide-react";

// ---------- Local UI primitives (mirrors PrepaidChangeBundle.tsx's page-local helpers) ----------
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
  </div>
);

const CardSection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ClipboardList;
  children: React.ReactNode;
}) => (
  <section className="bg-card rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
    </div>
    {children}
  </section>
);

// ---------- Demo data ----------
interface DemoPortInRequest {
  /** The number the dealer looks up — the customer's existing line on this carrier. */
  msisdn: string;
  /** The number being ported in from the old carrier — not the same MSISDN. */
  requestedNumber: string;
  simType: "psim" | "esim";
  status: "pending" | "completed" | "rejected";
  requestDate: string;
}

const DEMO_PORT_IN_REQUESTS: DemoPortInRequest[] = [
  { msisdn: "0501112222", requestedNumber: "0539981234", simType: "psim", status: "pending", requestDate: "18 Aug 2026" },
  { msisdn: "0501112233", requestedNumber: "0549982345", simType: "esim", status: "pending", requestDate: "20 Aug 2026" },
  { msisdn: "0501112244", requestedNumber: "0559983456", simType: "psim", status: "completed", requestDate: "10 Aug 2026" },
  { msisdn: "0501112255", requestedNumber: "0569984567", simType: "psim", status: "rejected", requestDate: "12 Aug 2026" },
];

// ---------- Fake attachment picker (mirrors CustomerComplaint.tsx's addAttachment pattern —
// prototype only, no real file/camera access) ----------
interface Attachment {
  id: string;
  name: string;
  kind: "file" | "image";
}

// Demo ID number — the leading digit adapts to the selected ID Type's start-digit rule,
// same helper as SimReplacement.tsx / SimTermination.tsx.
const DEMO_ID_SUFFIX = "029384756";
const demoIdFor = (rule: IdTypeRule | undefined) => (rule?.startDigits?.[0] ?? "1") + DEMO_ID_SUFFIX;

const CancelPortInRequest = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---------- Flow state (2 stages — Verify / Capture SIM — no visible stepper, same as
  // SimReplacement.tsx) ----------
  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState("saudi-id");
  const [idNumber, setIdNumber] = useState(demoIdFor(ID_TYPE_RULES["saudi-id"]));
  const [msisdn, setMsisdn] = useState("0501112222");
  const [checking, setChecking] = useState(false);
  const [request, setRequest] = useState<DemoPortInRequest | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // At least one SIM capture is mandatory — no separate "SIM photo" vs "attachments"
  // buckets, just one list the dealer adds to.
  const [documents, setDocuments] = useState<Attachment[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [referenceId, setReferenceId] = useState("");
  // Top-right X, shown from stage 2 onward only — nothing to lose yet on stage 1.
  const [cancelOpen, setCancelOpen] = useState(false);

  // ID Number must match the selected ID Type's rule (start digit + exact length) — format
  // check only, same as SimTermination.tsx; not cross-checked against a customer record.
  const idNumberRule = ID_TYPE_RULES[idType];
  const idNumberValid = (() => {
    const v = idNumber.trim();
    if (!v) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();

  // ---------- MSISDN auto-lookup (mirrors Prepaid Change Bundle / Subscription Migration) ----------
  useEffect(() => {
    setRequest(null);
    setLookupError(null);
    setDocuments([]);
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_PORT_IN_REQUESTS.find((r) => r.msisdn === msisdn);
      if (!found) {
        setLookupError(t("cancelPortIn.lookupErrorNotFound"));
        return;
      }
      if (found.simType === "esim") {
        setLookupError(t("cancelPortIn.lookupErrorEsim"));
        return;
      }
      if (found.status === "completed") {
        setLookupError(t("cancelPortIn.lookupErrorCompleted"));
        return;
      }
      if (found.status === "rejected") {
        setLookupError(t("cancelPortIn.lookupErrorRejected"));
        return;
      }
      setRequest(found);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn]);

  const eligible = !!request && !lookupError && idNumberValid;

  // ---------- SIM capture ----------
  const addDocument = () => {
    const isImage = documents.length % 2 === 0;
    setDocuments((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: isImage ? t("cancelPortIn.imageTitle") : t("cancelPortIn.fileTitle"), kind: isImage ? "image" : "file" },
    ]);
  };

  // ---------- Gates ----------
  const canSubmit = eligible && documents.length > 0;

  const resolveCancel = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setReferenceId(`CPI-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureReason(t("cancelPortIn.failureReasonGeneric"));
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setIdType("saudi-id");
    setIdNumber(demoIdFor(ID_TYPE_RULES["saudi-id"]));
    setMsisdn("0501112222");
    setRequest(null);
    setLookupError(null);
    setDocuments([]);
  };

  // Hidden per UX decision: a 2-stage stepper adds chrome without adding real progress info.
  // Kept in source in case we want it back — just uncomment the FlowStepper line below.
  const steps = [
    { label: "Verify", Icon: ClipboardList },
    { label: "Capture SIM", Icon: Camera },
  ];

  const renderAttachmentRow = (doc: Attachment, onRemove: () => void) => (
    <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
      {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
      <span className="flex-1 text-sm text-muted-foreground">{doc.name}</span>
      <button type="button" className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label="Preview attachment">
        <Eye className="w-4 h-4 text-sky-500" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center"
        aria-label="Delete attachment"
      >
        <Trash2 className="w-4 h-4 text-primary" />
      </button>
    </div>
  );

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("cancelPortIn.title")}
        showBack
        onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))}
        rightElement={
          step > 0 ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      {/* <FlowStepper current={step} steps={steps} /> */}

      <div className="px-4 space-y-4">
        {/* ── Stage 1: Verify ── */}
        {step === 0 && (
          <>
            <Field label={t("activation.identity.idType")}>
              <Select value={idType} onValueChange={(v) => { setIdType(v); setIdNumber(demoIdFor(ID_TYPE_RULES[v])); }}>
                <SelectTrigger className="h-12 bg-card rounded-xl">
                  <SelectValue placeholder={t("activation.identity.idType")} />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPE_ORDER.map((key) => (
                    <SelectItem key={key} value={key}>{t(`activation.identity.idTypes.${ID_TYPE_RULES[key].labelKey}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t(`activation.identity.idFieldLabels.${idNumberRule?.fieldLabelKey ?? "idNumber"}`)}>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                inputMode="numeric"
                className={cn("h-12 bg-card rounded-xl", idNumber.trim().length > 0 && !idNumberValid && "border-destructive focus-visible:ring-destructive")}
              />
              {idNumber.trim().length > 0 && !idNumberValid && idNumberRule && (
                <p className="text-[11px] text-destructive">
                  {idNumberRule.startDigits
                    ? t("activation.identity.idNumberErrors.startAndLength", { digits: idNumberRule.startDigits.join(", "), length: idNumberRule.length })
                    : t("activation.identity.idNumberErrors.lengthOnly", { length: idNumberRule.length })}
                </p>
              )}
            </Field>

            <Field label={t("cancelPortIn.msisdn")}>
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} icon={<Phone className="w-4 h-4" />} />
              {checking && <p className="text-[11px] text-muted-foreground">{t("cancelPortIn.checkingNumber")}</p>}
            </Field>

            <PrototypeTestBox
              heading={t("cancelPortIn.testNumbersHeading")}
              description={t("cancelPortIn.testNumbersDescription")}
              items={[
                { value: "0501112222", note: t("cancelPortIn.testNotePending"), group: t("cancelPortIn.testGroupValid") },
                { value: "0501112233", note: t("cancelPortIn.testNoteEsim"), group: t("cancelPortIn.testGroupErrors") },
                { value: "0501112244", note: t("cancelPortIn.testNoteCompleted"), group: t("cancelPortIn.testGroupErrors") },
                { value: "0501112255", note: t("cancelPortIn.testNoteRejected"), group: t("cancelPortIn.testGroupErrors") },
                { value: "0509999999", note: t("cancelPortIn.testNoteNotFound"), group: t("cancelPortIn.testGroupErrors") },
              ]}
              onSelect={setMsisdn}
            />
          </>
        )}

        {/* ── Stage 2: Capture SIM ── */}
        {step === 1 && (
          <>
            <CardSection title={t("cancelPortIn.portInRequest")} icon={ClipboardList}>
              <SummaryRow label={t("cancelPortIn.msisdn")} value={request?.msisdn ?? t("cancelPortIn.dash")} />
              <SummaryRow label={t("cancelPortIn.requestedNumber")} value={request?.requestedNumber ?? t("cancelPortIn.dash")} />
              <SummaryRow label={t("cancelPortIn.requestDate")} value={request?.requestDate ?? t("cancelPortIn.dash")} />
              <SummaryRow label={t("cancelPortIn.status")} value={t("cancelPortIn.statusPending")} />
            </CardSection>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("cancelPortIn.captureSimPicture")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-sm">
                {documents.length === 0 ? (
                  <button
                    type="button"
                    onClick={addDocument}
                    className="w-full rounded-2xl border border-dashed border-border bg-background py-8 flex flex-col items-center gap-2"
                  >
                    <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </span>
                    <span className="text-sm text-muted-foreground">{t("cancelPortIn.simPictureHint")}</span>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-background divide-y divide-border/60">
                    {documents.map((doc) => renderAttachmentRow(doc, () => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))))}
                    <button type="button" onClick={addDocument} className="w-full py-3 text-sm font-medium text-primary flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" /> {t("cancelPortIn.addAnotherFile")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 ? (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!eligible} onClick={() => setStep(1)}>
              {t("cancelPortIn.continue")}
            </Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
              {t("cancelPortIn.submit")}
            </Button>
          )}
        </div>
      </div>

      {/* Confirm cancellation */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("cancelPortIn.confirmTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("cancelPortIn.confirmDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveCancel}>{t("cancelPortIn.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("cancelPortIn.cancel")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Cancel flow (top-right X) */}
      <Drawer open={cancelOpen} onOpenChange={setCancelOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("cancelPortIn.cancelFlowTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("cancelPortIn.cancelFlowDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setCancelOpen(false); resetAll(); navigate("/"); }}>{t("cancelPortIn.yesCancelFlow")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setCancelOpen(false)}>{t("cancelPortIn.keepEditing")}</button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => !o && (setSuccessOpen(false), resetAll(), navigate("/"))}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1 text-center">
              {t("cancelPortIn.cancelSuccessful", { msisdn: request?.msisdn ?? "" })}
            </h3>
            <p className="text-xs text-muted-foreground mt-2">
              {t("cancelPortIn.reference")} <span className="font-semibold text-foreground">{referenceId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}>
            {t("cancelPortIn.done")}
          </Button>
        </DrawerContent>
      </Drawer>

      {/* Failure */}
      <Drawer open={failureOpen} onOpenChange={setFailureOpen}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-destructive/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("cancelPortIn.cancelFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{failureReason}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("cancelPortIn.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setFailureOpen(false)}>
              {t("cancelPortIn.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Lookup error — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => { if (!o) setLookupError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("cancelPortIn.lookupErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          {/* Wrapped in a div — DialogContent's [&>button]:hidden (meant only for Radix's
              auto-injected close button) would otherwise also hide this direct-child button. */}
          <div>
            <button
              onClick={() => setLookupError(null)}
              className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
            >
              {t("cancelPortIn.gotIt")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CancelPortInRequest;
