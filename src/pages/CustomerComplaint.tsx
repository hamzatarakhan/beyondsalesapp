import { useEffect, useState } from "react";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { cn } from "@/lib/utils";
import { VerifiedBanner } from "@/pages/NewActivation";
import {
  Phone,
  ClipboardList,
  ShieldCheck,
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

  // ---------- Flow state (single page — all sections shown by default, no customer
  // lookup gate) ----------
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);

  // Complaint form
  const [issueNumber, setIssueNumber] = useState("");
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

  // ---------- OTP handlers ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", "", "", ""]);
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
      if (d && i === 5) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "111111") {
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
    if (d && i < 5) {
      const el = document.getElementById(`complaint-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
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
  // No customer lookup gate — every section is visible by default. OTP sits at the end
  // of the form as the final step before submitting, so it's part of canSubmit rather
  // than a separate reveal condition.
  const issueNumberValid = /^\d{10}$/.test(issueNumber) || /^\d{13}$/.test(issueNumber);
  const canSubmit = otpVerified && issueNumberValid && contactNumber.trim().length > 0 && subject.trim().length > 0 && level1 && level2 && description.trim().length > 0;

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
    setOtpVerified(false);
    setIssueNumber("");
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
      <AppHeader title={t("customerComplaint.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        {/* No customer lookup gate — every section below is visible by default. */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground px-1">{t("customerComplaint.contactInformation")}</p>
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
            <Field label={t("customerComplaint.contactNumber")}>
              <PhoneNumberInput value={contactNumber} onChange={setContactNumber} className="bg-background" />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 shrink-0" /> {t("customerComplaint.contactNumberOtpHint")}
              </p>
            </Field>

            <Field label={t("customerComplaint.email")}>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder={t("customerComplaint.emailPlaceholder")}
                className="h-12 bg-background rounded-xl"
              />
            </Field>
          </div>
        </div>

        <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("customerComplaint.complaintDetails")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
                <Field label={t("customerComplaint.issueNumber")}>
                  <Input
                    value={issueNumber}
                    onChange={(e) => setIssueNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
                    placeholder={t("customerComplaint.issueNumberPlaceholder")}
                    inputMode="numeric"
                    className="h-12 bg-background rounded-xl"
                  />
                </Field>

                <Field label={t("customerComplaint.subject")}>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("customerComplaint.subjectPlaceholder")}
                    className="h-12 bg-background rounded-xl"
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
                    <SelectTrigger className="h-12 rounded-xl bg-background">
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
                    <SelectTrigger className="h-12 rounded-xl bg-background">
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
                    className="bg-background rounded-2xl resize-none"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">
                {t("customerComplaint.attachments")} <span className="text-muted-foreground/70 font-normal">({t("customerComplaint.attachmentsOptional")})</span>
              </p>
              <div className="bg-card rounded-2xl p-4 shadow-sm">
                {attachments.length === 0 ? (
                  <button
                    type="button"
                    onClick={addAttachment}
                    className="w-full rounded-2xl border border-dashed border-border bg-background py-8 flex flex-col items-center gap-2"
                  >
                    <span className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </span>
                    <span className="text-sm text-muted-foreground">{t("customerComplaint.uploadHint")}</span>
                  </button>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-background divide-y divide-border/60">
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
            </div>

            {/* OTP Verification — last section, the final step before Submit. */}
            <CardSection title={t("customerComplaint.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("customerComplaint.otpVerified")} />
              ) : (
                <Button variant="outline" className="w-full" disabled={!contactNumber.trim()} onClick={() => setOtpOpen(true)}>{t("customerComplaint.sendVerifyOtp")}</Button>
              )}
            </CardSection>
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canSubmit} onClick={resolveSubmit}>
            {t("customerComplaint.submit")}
          </Button>
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("customerComplaint.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("customerComplaint.otpIncorrect") : t("customerComplaint.otpSentTo", { number: contactNumber || "—" })}
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

      <BrandLoadingOverlay open={submitting} />
    </div>
  );
};

export default CustomerComplaint;
