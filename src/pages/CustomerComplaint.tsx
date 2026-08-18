import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import { VerifiedBanner } from "@/pages/NewActivation";
import {
  Phone,
  ClipboardList,
  AlertCircle,
  Check,
  XCircle,
  Plus,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
} from "lucide-react";

// ---------- Local UI primitives (mirrors CreditTransfer.tsx) ----------
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
interface DemoComplaintCustomer {
  msisdn: string;
  name: string;
  lineType: "prepaid" | "postpaid" | "vnet";
  /** Complaints already raised today — checked against DAILY_TICKET_LIMIT. */
  ticketsToday: number;
}

// All line types are supported here (unlike Bill Payment etc., which restrict to
// postpaid) — a complaint can be raised for any prepaid, postpaid, or Vnet line.
const DEMO_COMPLAINT_CUSTOMERS: DemoComplaintCustomer[] = [
  { msisdn: "0501111133", name: "Faisal Al-Harbi", lineType: "prepaid", ticketsToday: 2 },
  { msisdn: "0502222211", name: "Ahmed Mohammed", lineType: "postpaid", ticketsToday: 0 },
  { msisdn: "0502222233444", name: "Sara Al-Otaibi", lineType: "vnet", ticketsToday: 1 },
  { msisdn: "0501111199", name: "Khalid Al-Dossary", lineType: "prepaid", ticketsToday: 10 },
];

const DAILY_TICKET_LIMIT = 10;

// VM-KSA complaint taxonomy — reused for Friendi too until a separate FM list is
// provided. Level 2 options are a reasonable draft per category; swap freely once the
// client shares the real subcategory breakdown.
const COMPLAINT_CATEGORIES: Record<string, string[]> = {
  Services: ["General Service Issue", "Service Activation Delay", "Service Cancellation Request", "Service Quality"],
  Recharge: ["Recharge Not Reflected", "Recharge Failed", "Wrong Recharge Amount", "Recharge Refund"],
  Billing: ["Invoice Dispute", "Overcharge", "Duplicate Charge", "Refund Request"],
  Network: ["No Coverage", "Call Drops", "Slow Data Speed", "Signal Issue"],
  Offers: ["Offer Not Applied", "Offer Not Received", "Misleading Offer", "Offer Expired Early"],
  Balance: ["Balance Deducted Incorrectly", "Balance Not Updated", "Balance Expiry Issue"],
  USSD: ["USSD Not Working", "USSD Wrong Response", "USSD Timeout"],
  SMS: ["SMS Not Received", "SMS Delayed", "SMS Charged Incorrectly"],
  "Transfer Ownership": ["Transfer Request Delay", "Transfer Rejected", "Documents Issue"],
  "Internet Setting": ["APN Not Working", "Internet Not Working", "Slow Internet Speed"],
  "MNP Service": ["Porting Delay", "Porting Rejected", "Porting Status Inquiry"],
  eSIM: ["eSIM Activation Failed", "eSIM QR Not Working", "eSIM Compatibility Issue"],
};
const CATEGORY_LEVEL1 = Object.keys(COMPLAINT_CATEGORIES);

const MAX_ATTACHMENTS = 3;
interface Attachment {
  id: string;
  name: string;
  kind: "file" | "image";
}

const CustomerComplaint = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  // Step 0 — Lookup + OTP
  const [msisdn, setMsisdn] = useState("");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoComplaintCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);

  // Step 1 — Complaint form
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [level1, setLevel1] = useState("");
  const [level2, setLevel2] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const [level2Open, setLevel2Open] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [ticketId, setTicketId] = useState("");

  // ---------- MSISDN lookup — auto-triggers once the number is well-formed, debounced so
  // it doesn't re-check on every keystroke. One fewer tap than a Search button. ----------
  const msisdnValid = /^\d{10}$/.test(msisdn) || /^\d{13}$/.test(msisdn);
  useEffect(() => {
    setCustomer(null);
    setLookupError(null);
    setLimitReached(false);
    setOtpVerified(false);
    if (!msisdnValid) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_COMPLAINT_CUSTOMERS.find((c) => c.msisdn === msisdn);
      if (!found) {
        setLookupError(t("customerComplaint.lookupErrorNotFound"));
        return;
      }
      setCustomer(found);
      setContactNumber(found.msisdn);
      // Daily per-customer cap — checked right after lookup, before sending an OTP,
      // since there's no point verifying a customer who can't submit anyway.
      if (found.ticketsToday >= DAILY_TICKET_LIMIT) {
        setLimitReached(true);
      }
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn]);

  const eligible = !!customer && !lookupError && !limitReached;

  // ---------- OTP handlers ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => {
      setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpOpen]);

  const setOtpDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      if (d && i === 4) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "11111") {
            setOtpError(true);
          } else {
            setOtpError(false);
            setOtpVerified(true);
            setOtpOpen(false);
          }
        }, 300);
      }
      return next;
    });
    if (d && i < 4) {
      const el = document.getElementById(`complaint-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("complaint-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Attachments ----------
  const addAttachment = () => {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    const isImage = attachments.length % 2 === 1;
    setAttachments((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: isImage ? t("customerComplaint.imageTitle") : t("customerComplaint.fileTitle"), kind: isImage ? "image" : "file" },
    ]);
  };

  // ---------- Gates ----------
  const canContinueStep0 = eligible && otpVerified;
  const canSubmit = contactNumber.trim().length > 0 && subject.trim().length > 0 && level1 && level2 && description.trim().length > 0;

  const resolveSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const ok = Math.random() < 0.85;
      if (ok) {
        setTicketId(`CMP-${Math.floor(100000 + Math.random() * 900000)}`);
        setSuccessOpen(true);
      } else {
        setFailureOpen(true);
      }
    }, 900);
  };

  const resetAll = () => {
    setStep(0);
    setMsisdn("");
    setCustomer(null);
    setLookupError(null);
    setLimitReached(false);
    setOtpVerified(false);
    setContactNumber("");
    setEmail("");
    setSubject("");
    setLevel1("");
    setLevel2("");
    setDescription("");
    setAttachments([]);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("customerComplaint.title")} showBack onBackClick={() => (step === 0 ? navigate("/") : setStep((s) => s - 1))} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup + OTP ── */}
        {step === 0 && (
          <>
            <Field label={t("customerComplaint.msisdn")}>
              <Input
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value.replace(/\D/g, "").slice(0, 13))}
                placeholder={t("customerComplaint.msisdnPlaceholder")}
                inputMode="numeric"
                className="h-12 bg-card rounded-xl"
              />
            </Field>

            <PrototypeTestBox
              heading={t("customerComplaint.testNumbersHeading")}
              description={t("customerComplaint.testNumbersDescription")}
              items={[
                { value: "0501111133", note: t("customerComplaint.testNotePrepaid") },
                { value: "0502222211", note: t("customerComplaint.testNotePostpaid") },
                { value: "0502222233444", note: t("customerComplaint.testNoteVnet") },
                { value: "0501111199", note: t("customerComplaint.testNoteLimitReached") },
                { value: "0500000099", note: t("customerComplaint.testNoteNotFound") },
              ]}
              onSelect={setMsisdn}
            />

            {lookupError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">{lookupError}</p>
              </div>
            )}

            {customer && limitReached && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-[13px] text-destructive leading-snug">
                  {t("customerComplaint.limitReached", { limit: DAILY_TICKET_LIMIT })}
                </p>
              </div>
            )}

            {customer && !limitReached && (
              <>
                <CardSection title={t("customerComplaint.customerDetails")} icon={ClipboardList}>
                  <SummaryRow label={t("customerComplaint.customerName")} value={customer.name} />
                  <SummaryRow label={t("customerComplaint.msisdn")} value={customer.msisdn} />
                  <SummaryRow label={t("customerComplaint.lineType")} value={t(`customerComplaint.lineType_${customer.lineType}`)} />
                </CardSection>

                <CardSection title={t("customerComplaint.otpVerification")} icon={Phone}>
                  {otpVerified ? (
                    <VerifiedBanner label={t("customerComplaint.otpVerified")} />
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">{t("customerComplaint.otpHint")}</p>
                      <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("customerComplaint.sendVerifyOtp")}</Button>
                    </>
                  )}
                </CardSection>
              </>
            )}
          </>
        )}

        {/* ── Step 1: Complaint form ── */}
        {step === 1 && customer && (
          <>
            <CardSection title={t("customerComplaint.customerDetails")} icon={ClipboardList}>
              <SummaryRow label={t("customerComplaint.customerName")} value={customer.name} />
              <SummaryRow label={t("customerComplaint.msisdn")} value={customer.msisdn} />
            </CardSection>

            <Field label={t("customerComplaint.contactNumber")}>
              <Input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                inputMode="numeric"
                className="h-12 bg-card rounded-xl"
              />
            </Field>

            <Field label={t("customerComplaint.email")}>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder={t("customerComplaint.emailPlaceholder")}
                className="h-12 bg-card rounded-xl"
              />
            </Field>

            <Field label={t("customerComplaint.subject")}>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t("customerComplaint.subjectPlaceholder")}
                className="h-12 bg-card rounded-xl"
              />
            </Field>

            <Field label={t("customerComplaint.level1Category")}>
              <Select
                value={level1}
                onValueChange={(v) => {
                  setLevel1(v);
                  setLevel2("");
                  // Auto-open Level 2 right after picking Level 1 — one tap to pick the
                  // subcategory instead of tap-to-open, tap-to-pick. The short delay lets
                  // Level 1's own closing animation finish first.
                  setTimeout(() => setLevel2Open(true), 150);
                }}
              >
                <SelectTrigger className="h-12 rounded-xl bg-card">
                  <SelectValue placeholder={t("customerComplaint.level1Placeholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {CATEGORY_LEVEL1.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("customerComplaint.level2Category")}>
              <Select value={level2} onValueChange={setLevel2} disabled={!level1} open={level2Open} onOpenChange={setLevel2Open}>
                <SelectTrigger className="h-12 rounded-xl bg-card">
                  <SelectValue placeholder={t("customerComplaint.level2Placeholder")} />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {(COMPLAINT_CATEGORIES[level1] ?? []).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("customerComplaint.description")}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t("customerComplaint.descriptionPlaceholder")}
                className="bg-card rounded-2xl resize-none"
              />
            </Field>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                {t("customerComplaint.attachments")} <span className="text-muted-foreground/70">({t("customerComplaint.attachmentsOptional")})</span>
              </label>
              {attachments.length === 0 ? (
                <button
                  type="button"
                  onClick={addAttachment}
                  className="w-full rounded-2xl border border-dashed border-border bg-card py-8 flex flex-col items-center gap-2"
                >
                  <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </span>
                  <span className="text-sm text-muted-foreground">{t("customerComplaint.uploadHint")}</span>
                </button>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card divide-y divide-border/60">
                  {attachments.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                      {doc.kind === "image" ? <ImageIcon className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                      <span className="flex-1 text-sm text-muted-foreground">{doc.name}</span>
                      <button type="button" className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center" aria-label="Preview attachment">
                        <Eye className="w-4 h-4 text-sky-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((d) => d.id !== doc.id))}
                        className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center"
                        aria-label="Delete attachment"
                      >
                        <Trash2 className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  ))}
                  {attachments.length < MAX_ATTACHMENTS && (
                    <button type="button" onClick={addAttachment} className="w-full py-3 text-sm font-medium text-primary flex items-center justify-center gap-1">
                      <Plus className="w-4 h-4" /> {t("customerComplaint.addAnotherFile")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueStep0} onClick={() => setStep(1)}>
              {t("customerComplaint.continue")}
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canSubmit} onClick={resolveSubmit}>
              {t("customerComplaint.submit")}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("customerComplaint.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("customerComplaint.otpIncorrect") : t("customerComplaint.otpSentToCustomer")}
            </p>
            <div className="flex gap-2" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`complaint-otp-${i}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigitAt(i, e.target.value)}
                  className={cn(
                    "w-12 h-12 rounded-full border-2 text-center text-base font-semibold focus:outline-none",
                    otpError ? "border-destructive text-destructive" : "border-border focus:border-primary text-foreground",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {otpError ? (
                <>
                  {t("customerComplaint.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("customerComplaint.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("customerComplaint.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("customerComplaint.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("customerComplaint.resend")}</button>
                </>
              )}
            </p>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("customerComplaint.complaintSubmitted")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("customerComplaint.complaintSubmittedDesc")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("customerComplaint.ticketId")} <span className="font-semibold text-foreground">{ticketId}</span>
            </p>
          </div>
          <Button
            className="w-full h-12 rounded-full font-semibold"
            onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}
          >
            {t("customerComplaint.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("customerComplaint.submitFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("customerComplaint.submitFailedDesc")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); resolveSubmit(); }}>
              {t("customerComplaint.retry")}
            </Button>
            <button
              type="button"
              className="w-full h-11 text-primary font-semibold text-sm"
              onClick={() => setFailureOpen(false)}
            >
              {t("customerComplaint.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checking || submitting} />
    </div>
  );
};

export default CustomerComplaint;
