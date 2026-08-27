import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import SematiVerification from "@/components/SematiVerification";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";
import { ID_TYPE_ORDER, ID_TYPE_RULES, ID_TYPE_VERIFICATION_METHODS } from "@/pages/NewActivation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  IdCard,
  UserCheck,
  Phone,
  AlertCircle,
  Check,
  XCircle,
  X,
} from "lucide-react";

// ---------- Local UI primitives (mirrors ChangePostpaidPlan.tsx's page-local helpers) ----------
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
interface DemoOwnerRecord {
  msisdn: string;
  lineType: "mobile" | "data";
  currentIdType: string;
  currentIdNumber: string;
  currentNationality: string;
  currentAddress: string;
  /** The one new-ID value treated as belonging to the same person as currentIdNumber —
   * typing anything else and submitting simulates the "don't belong to the same person"
   * failure the ticket names explicitly. */
  linkedNewIdNumber: string;
}

const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];

const DEMO_OWNER_RECORDS: DemoOwnerRecord[] = [
  { msisdn: "0505556677", lineType: "mobile", currentIdType: "saudi-id", currentIdNumber: "1122334455", currentNationality: "sa", currentAddress: "Riyadh", linkedNewIdNumber: "1122334456" },
  { msisdn: "0505556688", lineType: "data", currentIdType: "iqama-id", currentIdNumber: "2233445566", currentNationality: "eg", currentAddress: "Jeddah", linkedNewIdNumber: "2233445567" },
];

const UpdateCustomerId = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const ID_TYPE_LABELS: Record<string, string> = {
    saudiId: t("updateCustomerId.idType_saudiId"),
    iqamaId: t("updateCustomerId.idType_iqamaId"),
    borderVisa: t("updateCustomerId.idType_borderVisa"),
    gccId: t("updateCustomerId.idType_gccId"),
    visitorVisa: t("updateCustomerId.idType_visitorVisa"),
    umrahVisa: t("updateCustomerId.idType_umrahVisa"),
    hajVisa: t("updateCustomerId.idType_hajVisa"),
    gccPassport: t("updateCustomerId.idType_gccPassport"),
    premiumResidency: t("updateCustomerId.idType_premiumResidency"),
  };
  const NATIONALITY_LABELS: Record<string, string> = {
    sa: t("updateCustomerId.nationalitySaudi"),
    om: t("updateCustomerId.nationalityOmani"),
    ae: t("updateCustomerId.nationalityEmirati"),
    eg: t("updateCustomerId.nationalityEgyptian"),
    in: t("updateCustomerId.nationalityIndian"),
    other: t("updateCustomerId.nationalityOther"),
  };

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  const [msisdn, setMsisdn] = useState("0505556677");
  const [checking, setChecking] = useState(false);
  const [record, setRecord] = useState<DemoOwnerRecord | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [newIdType, setNewIdType] = useState("saudi-id");
  const [newIdNumber, setNewIdNumber] = useState("");
  const [nationality, setNationality] = useState("sa");
  const [address, setAddress] = useState(CITIES[0]);

  const [customerVerifyOpen, setCustomerVerifyOpen] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);

  const [signature, setSignature] = useState<string | null>(null);
  const [sigEditorOpen, setSigEditorOpen] = useState(false);
  const [confirmedIdCheck, setConfirmedIdCheck] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  // Top-right X, shown from stage 2 onward only — nothing to lose yet on stage 1.
  const [cancelOpen, setCancelOpen] = useState(false);
  const [failureReason, setFailureReason] = useState("");
  const [referenceId, setReferenceId] = useState("");

  // ---------- MSISDN auto-lookup ----------
  useEffect(() => {
    setRecord(null);
    setLookupError(null);
    setNewIdNumber("");
    if (!/^\d{10}$/.test(msisdn)) return;
    setChecking(true);
    const timer = setTimeout(() => {
      setChecking(false);
      const found = DEMO_OWNER_RECORDS.find((r) => r.msisdn === msisdn);
      if (!found) {
        setLookupError(t("updateCustomerId.lookupErrorNotFound"));
        return;
      }
      setRecord(found);
      setNewIdType(found.currentIdType);
      setNewIdNumber(found.linkedNewIdNumber);
      setNationality(found.currentNationality);
      setAddress(found.currentAddress);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msisdn]);

  const eligible = !!record && !lookupError;

  const idNumberRule = ID_TYPE_RULES[newIdType];
  const idNumberValid = (() => {
    const v = newIdNumber.trim();
    if (v.length === 0) return false;
    if (!idNumberRule) return true;
    if (idNumberRule.length != null && v.length !== idNumberRule.length) return false;
    if (idNumberRule.startDigits && !idNumberRule.startDigits.includes(v[0])) return false;
    return true;
  })();

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
      const el = document.getElementById(`update-id-otp-${i + 1}`) as HTMLInputElement | null;
      el?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const el = document.getElementById("update-id-otp-0") as HTMLInputElement | null;
    el?.focus();
  };

  // ---------- Gates ----------
  const canContinueNumber = eligible;
  const canContinueDetails = idNumberValid;
  const canSubmit = customerVerified && otpVerified && !!signature && confirmedIdCheck;

  const resolveSubmit = () => {
    setConfirmOpen(false);
    if (newIdNumber.trim() !== record?.linkedNewIdNumber) {
      setFailureReason(t("updateCustomerId.failureReasonMismatch"));
      setFailureOpen(true);
      return;
    }
    const ok = Math.random() < 0.85;
    if (ok) {
      setReferenceId(`UID-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureReason(t("updateCustomerId.failureReasonGeneric"));
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMsisdn("0505556677");
    setRecord(null);
    setLookupError(null);
    setNewIdType("saudi-id");
    setNewIdNumber("");
    setNationality("sa");
    setAddress(CITIES[0]);
    setCustomerVerified(false);
    setOtpVerified(false);
    setSignature(null);
    setConfirmedIdCheck(false);
  };

  const steps = [
    { label: t("updateCustomerId.stepNumber", "Number"), Icon: Phone },
    { label: t("updateCustomerId.stepDetails", "Details"), Icon: IdCard },
    { label: t("updateCustomerId.stepCheckout", "Checkout"), Icon: ClipboardList },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader
        title={t("updateCustomerId.title")}
        showBack
        onBackClick={() => (step === 0 ? navigate("/change-ownership") : setStep((s) => s - 1))}
        rightElement={
          step > 0 ? (
            <button onClick={() => setCancelOpen(true)} aria-label="Cancel" className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center">
              <X className="w-5 h-5 text-foreground" />
            </button>
          ) : undefined
        }
      />
      <FlowStepper current={step} steps={steps} />

      <div className="px-4 space-y-4">
        {/* ── Step 0: Number ── */}
        {step === 0 && (
          <>
            <Field label={t("updateCustomerId.msisdn")}>
              <PhoneNumberInput value={msisdn} onChange={setMsisdn} icon={<Phone className="w-4 h-4" />} />
              {checking && <p className="text-[11px] text-muted-foreground">{t("updateCustomerId.checkingNumber")}</p>}
            </Field>

            <PrototypeTestBox
              heading={t("updateCustomerId.testNumbersHeading")}
              description={t("updateCustomerId.testNumbersDescription")}
              items={[
                { value: "0505556677", note: t("updateCustomerId.testNoteMobile") },
                { value: "0505556688", note: t("updateCustomerId.testNoteData") },
                { value: "0509999999", note: t("updateCustomerId.testNoteNotFound") },
              ]}
              onSelect={setMsisdn}
            />
          </>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && record && (
          <>
            <CardSection title={t("updateCustomerId.currentId")} icon={IdCard}>
              <SummaryRow label={t("updateCustomerId.idType")} value={ID_TYPE_LABELS[ID_TYPE_RULES[record.currentIdType].labelKey]} />
              <SummaryRow label={t("updateCustomerId.idNumber")} value={record.currentIdNumber} />
              <SummaryRow label={t("updateCustomerId.nationality")} value={NATIONALITY_LABELS[record.currentNationality] ?? record.currentNationality} />
              <SummaryRow label={t("updateCustomerId.address")} value={record.currentAddress} />
            </CardSection>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1">{t("updateCustomerId.newIdDetails")}</p>
              <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
                <Field label={t("updateCustomerId.newIdType")}>
                  <Select value={newIdType} onValueChange={(v) => setNewIdType(v)}>
                    <SelectTrigger className="w-full bg-background rounded-xl h-12">
                      <SelectValue placeholder={t("updateCustomerId.idTypePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {ID_TYPE_ORDER.map((key) => (
                        <SelectItem key={key} value={key}>{ID_TYPE_LABELS[ID_TYPE_RULES[key].labelKey]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("updateCustomerId.newIdNumber")}>
                  <Input
                    value={newIdNumber}
                    onChange={(e) => setNewIdNumber(e.target.value)}
                    placeholder={t("updateCustomerId.idNumberPlaceholder")}
                    className={cn("h-12 bg-background rounded-xl", newIdNumber.trim().length > 0 && !idNumberValid && "border-destructive focus-visible:ring-destructive")}
                  />
                  {newIdNumber.trim().length > 0 && !idNumberValid && idNumberRule && (
                    <p className="text-xs text-destructive">
                      {idNumberRule.startDigits
                        ? t("updateCustomerId.idNumberRuleStart", { digits: idNumberRule.startDigits.join(", "), length: idNumberRule.length })
                        : t("updateCustomerId.idNumberRuleLength", { length: idNumberRule.length })}
                    </p>
                  )}
                </Field>
                <Field label={t("updateCustomerId.nationality")}>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="w-full bg-background rounded-xl h-12">
                      <SelectValue placeholder={t("updateCustomerId.nationalityPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {Object.entries(NATIONALITY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("updateCustomerId.address")}>
                  <Select value={address} onValueChange={setAddress}>
                    <SelectTrigger className="w-full bg-background rounded-xl h-12">
                      <SelectValue placeholder={t("updateCustomerId.addressPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Checkout ── */}
        {step === 2 && (
          <>
            <CardSection title={t("updateCustomerId.summary")} icon={ClipboardList}>
              <SummaryRow label={t("updateCustomerId.msisdn")} value={record?.msisdn ?? t("updateCustomerId.dash")} />
              <SummaryRow label={t("updateCustomerId.oldIdType")} value={record ? ID_TYPE_LABELS[ID_TYPE_RULES[record.currentIdType].labelKey] : t("updateCustomerId.dash")} />
              <SummaryRow label={t("updateCustomerId.oldIdNumber")} value={record?.currentIdNumber ?? t("updateCustomerId.dash")} />
              <SummaryRow label={t("updateCustomerId.newIdType")} value={ID_TYPE_LABELS[ID_TYPE_RULES[newIdType].labelKey]} />
              <SummaryRow label={t("updateCustomerId.newIdNumber")} value={newIdNumber} />
              <SummaryRow label={t("updateCustomerId.nationality")} value={NATIONALITY_LABELS[nationality]} />
              <SummaryRow label={t("updateCustomerId.address")} value={address} />
            </CardSection>

            <CardSection title={t("updateCustomerId.idVerification")} icon={UserCheck}>
              {customerVerified ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">{t("updateCustomerId.verified")}</p>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setCustomerVerifyOpen(true)}>
                  {t("updateCustomerId.verifyId")}
                </Button>
              )}
            </CardSection>

            <CardSection title={t("updateCustomerId.otpVerification")} icon={Phone}>
              {otpVerified ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">{t("updateCustomerId.verified")}</p>
                </div>
              ) : (
                <Button variant="outline" className="w-full" disabled={!customerVerified} onClick={() => setOtpOpen(true)}>
                  {t("updateCustomerId.sendVerifyOtp")}
                </Button>
              )}
              {!customerVerified && (
                <p className="text-[11px] text-muted-foreground mt-2">{t("updateCustomerId.completeIdVerificationFirst")}</p>
              )}
            </CardSection>

            <SignatureBox
              title={t("updateCustomerId.customerSignature")}
              required
              value={signature}
              onEdit={() => setSigEditorOpen(true)}
              onClear={() => setSignature(null)}
            />

            <section className="bg-card rounded-2xl p-4 shadow-sm">
              <div className="flex items-start gap-3 select-none">
                <div
                  role="checkbox"
                  aria-checked={confirmedIdCheck}
                  tabIndex={0}
                  onClick={() => setConfirmedIdCheck((v) => !v)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setConfirmedIdCheck((v) => !v); } }}
                  className={cn(
                    "w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer",
                    confirmedIdCheck ? "bg-primary border-primary" : "border-primary",
                  )}
                >
                  {confirmedIdCheck && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <p className="text-sm text-foreground text-start flex-1 leading-snug">
                  {t("updateCustomerId.confirmIdCheckbox")}
                </p>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step < 2 ? (
            <Button
              className="w-full h-12 text-sm font-semibold rounded-full"
              disabled={step === 0 ? !canContinueNumber : !canContinueDetails}
              onClick={() => setStep((s) => s + 1)}
            >
              {t("updateCustomerId.continue")}
            </Button>
          ) : (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>
              {t("updateCustomerId.submit")}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("updateCustomerId.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("updateCustomerId.otpIncorrect") : t("updateCustomerId.otpSentViaSms")}
            </p>
            <div className="flex gap-3" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`update-id-otp-${i}`}
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
                  {t("updateCustomerId.resendCodeQuestion")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("updateCustomerId.resend")}</button>
                </>
              ) : otpSecondsLeft > 0 ? (
                <>
                  {t("updateCustomerId.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              ) : (
                <>
                  {t("updateCustomerId.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("updateCustomerId.resend")}</button>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Confirm */}
      <Drawer open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-500 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-sky-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">{t("updateCustomerId.confirmTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("updateCustomerId.confirmDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolveSubmit}>{t("updateCustomerId.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("updateCustomerId.cancel")}</button>
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
              <h3 className="text-lg font-bold text-foreground mb-1">{t("updateCustomerId.cancelFlowTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("updateCustomerId.cancelFlowDesc")}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setCancelOpen(false); resetAll(); navigate("/"); }}>{t("updateCustomerId.yesCancelFlow")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setCancelOpen(false)}>{t("updateCustomerId.keepEditing")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("updateCustomerId.updateSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">{t("updateCustomerId.propagationNote")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("updateCustomerId.reference")} <span className="font-semibold text-foreground">{referenceId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}>
            {t("updateCustomerId.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("updateCustomerId.updateFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">{failureReason}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("updateCustomerId.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setFailureOpen(false)}>
              {t("updateCustomerId.cancel")}
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
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("updateCustomerId.lookupErrorTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button
            onClick={() => setLookupError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("updateCustomerId.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      <SematiVerification
        open={customerVerifyOpen}
        audience="customer"
        allowedMethods={ID_TYPE_VERIFICATION_METHODS[newIdType]}
        onClose={() => setCustomerVerifyOpen(false)}
        onVerified={() => { setCustomerVerifyOpen(false); setCustomerVerified(true); }}
      />

      <SignaturePadSheet
        open={sigEditorOpen}
        title={t("updateCustomerId.customerSignature")}
        initial={signature}
        onClose={() => setSigEditorOpen(false)}
        onSave={(dataUrl) => { setSignature(dataUrl); setSigEditorOpen(false); }}
      />
    </div>
  );
};

export default UpdateCustomerId;
