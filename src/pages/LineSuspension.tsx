import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import SematiVerification from "@/components/SematiVerification";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { withErrorCode } from "@/lib/errorCode";
import { VerifiedBanner } from "@/pages/NewActivation";
import { AlertCircle, Check, Info, Phone, XCircle } from "lucide-react";

type Mode = "suspend" | "restore";
type Kind = "mobile" | "data" | "postpaid";

interface DemoLine {
  msisdn: string;
  kind: Kind;
  suspended: boolean;
  /** When the latest suspension started — kept after restore for the 30-day rule. */
  suspensionStart?: number;
}

// Confirmed by the client: the suspension period is fixed at 10 days; nobody chooses it.
const VALIDITY_DAYS = 10;
// Confirmed by the client: no new suspension within 30 days of the last suspension's start date.
const REPEAT_AFTER_DAYS = 30;
const DAY = 86400000;

const formatDate = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// ponytail: a successful suspend/restore mutates this list so the next search shows the new
// status; it resets on page reload. The real status comes from the BE.
const DEMO_LINES: DemoLine[] = [
  { msisdn: "0501120001", kind: "mobile", suspended: false },
  { msisdn: "0501120002", kind: "data", suspended: false },
  { msisdn: "0501120003", kind: "mobile", suspended: true, suspensionStart: Date.now() - 6 * DAY },
  { msisdn: "0501120004", kind: "postpaid", suspended: false },
  // restored, but suspended 15 days ago — too soon for a new suspension
  { msisdn: "0501120005", kind: "mobile", suspended: false, suspensionStart: Date.now() - 15 * DAY },
];

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2 border-b border-border/40 last:border-0">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold text-foreground text-end">{value}</span>
  </div>
);

const Card = ({ title, icon: Icon, children }: { title: string; icon: typeof Phone; children: React.ReactNode }) => (
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

const LineSuspension = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>("suspend");
  const [msisdn, setMsisdn] = useState("0501120001");
  const [checking, setChecking] = useState(false);
  const [line, setLine] = useState<DemoLine | null>(null);
  const [lookupError, setLookupError] = useState<{ title: string; message: string } | null>(null);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verified, setVerified] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  const [understood, setUnderstood] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  const suspending = mode === "suspend";

  // Verification belongs to one line and one action — any change to either starts it over.
  const clearLine = () => {
    setLine(null);
    setLookupError(null);
    setVerified(false);
    setOtpVerified(false);
    setUnderstood(false);
  };

  const changeMode = (m: Mode) => {
    setMode(m);
    clearLine();
  };

  const changeMsisdn = (v: string) => {
    setMsisdn(v);
    clearLine();
  };

  const handleSearch = () => {
    if (!/^\d{10}$/.test(msisdn)) return;
    clearLine();
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = DEMO_LINES.find((l) => l.msisdn === msisdn);
      if (!found) return setLookupError({ title: t("lineSuspension.notFoundTitle"), message: t("lineSuspension.notFound") });
      if (found.kind === "postpaid") return setLookupError({ title: t("lineSuspension.notEligibleTitle"), message: t("lineSuspension.notEligible") });
      if (suspending && found.suspended) {
        return setLookupError({ title: t("lineSuspension.alreadySuspendedTitle"), message: t("lineSuspension.alreadySuspended", { date: formatDate(found.suspensionStart! + VALIDITY_DAYS * DAY) }) });
      }
      const nextAllowed = (found.suspensionStart ?? 0) + REPEAT_AFTER_DAYS * DAY;
      if (suspending && Date.now() < nextAllowed) {
        return setLookupError({ title: t("lineSuspension.tooSoonTitle"), message: t("lineSuspension.tooSoon", { start: formatDate(found.suspensionStart!), date: formatDate(nextAllowed) }) });
      }
      if (!suspending && !found.suspended) return setLookupError({ title: t("lineSuspension.notSuspendedTitle"), message: t("lineSuspension.notSuspended") });
      setLine(found);
    }, 800);
  };

  // ---------- OTP (same pattern as SIM Termination; "1111" simulates a wrong code) ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    const interval = setInterval(() => setOtpSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(interval);
  }, [otpOpen]);

  const setOtpDigitAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      if (d && i === 3) {
        const code = next.join("");
        setTimeout(() => {
          if (code === "1111") setOtpError(true);
          else {
            setOtpError(false);
            setOtpVerified(true);
            setOtpOpen(false);
          }
        }, 300);
      }
      return next;
    });
    if (d && i < 3) (document.getElementById(`line-suspension-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    (document.getElementById("line-suspension-otp-0") as HTMLInputElement | null)?.focus();
  };

  const canConfirm = !!line && verified && otpVerified && (!suspending || understood);

  const resolve = () => {
    setFailureOpen(false);
    if (!line || Math.random() >= 0.85) {
      setFailureOpen(true);
      return;
    }
    line.suspended = suspending;
    if (suspending) line.suspensionStart = Date.now();
    setOrderId(`${suspending ? "LS" : "LR"}-${Math.floor(100000 + Math.random() * 900000)}`);
    setSuccessOpen(true);
  };

  const kindLabel = (k: Kind) => t(`lineSuspension.kind.${k}`);

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("lineSuspension.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        {/* Suspend / Restore — the app's underline tabs (same as Orders History / Broadcast) */}
        <Tabs value={mode} onValueChange={(v) => changeMode(v as Mode)}>
          <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto border-b border-border rounded-none">
            {(["suspend", "restore"] as Mode[]).map((m) => (
              <TabsTrigger
                key={m}
                value={m}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2.5 text-sm font-medium text-muted-foreground data-[state=active]:text-primary"
              >
                {t(`lineSuspension.mode.${m}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("lineSuspension.msisdn")}</label>
          <div className="flex gap-2">
            <PhoneNumberInput value={msisdn} onChange={changeMsisdn} icon={<Phone className="w-4 h-4" />} className="flex-1" />
            <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!/^\d{10}$/.test(msisdn) || checking} onClick={handleSearch}>
              {t("lineSuspension.search")}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("lineSuspension.prepaidOnly")}</p>
        </div>

        <PrototypeTestBox
          heading={t("lineSuspension.testHeading")}
          description={t("lineSuspension.testDescription")}
          items={[
            { value: "0501120001", note: t("lineSuspension.testActiveMobile") },
            { value: "0501120002", note: t("lineSuspension.testActiveData") },
            { value: "0501120003", note: t("lineSuspension.testSuspended") },
            { value: "0501120004", note: t("lineSuspension.testPostpaid") },
            { value: "0501120005", note: t("lineSuspension.testTooSoon") },
            { value: "0501119999", note: t("lineSuspension.testNotFound") },
          ]}
          onSelect={changeMsisdn}
        />

        {line && (
          <>
            <Card title={t("lineSuspension.lineDetails")} icon={Phone}>
              <Row label={t("lineSuspension.msisdn")} value={line.msisdn} />
              <Row label={t("lineSuspension.lineType")} value={kindLabel(line.kind)} />
              <Row label={t("lineSuspension.status")} value={line.suspended ? t("lineSuspension.statusSuspended") : t("lineSuspension.statusActive")} />
              {line.suspended && <Row label={t("lineSuspension.suspendedOn")} value={formatDate(line.suspensionStart!)} />}
              {line.suspended && <Row label={t("lineSuspension.validUntil")} value={formatDate(line.suspensionStart! + VALIDITY_DAYS * DAY)} />}
            </Card>

            {suspending && (
              <Card title={t("lineSuspension.howItWorks")} icon={Info}>
                <ul className="text-xs text-foreground space-y-2 list-disc ps-4 leading-relaxed">
                  <li>{t("lineSuspension.rule1")}</li>
                  <li>{t("lineSuspension.rule2")}</li>
                  <li>{t("lineSuspension.rule3", { days: VALIDITY_DAYS })}</li>
                  <li>{t("lineSuspension.rule4")}</li>
                  <li>{t("lineSuspension.rule5", { days: REPEAT_AFTER_DAYS })}</li>
                </ul>
              </Card>
            )}

            <Card title={t("lineSuspension.customerVerification")} icon={Phone}>
              {verified ? (
                <VerifiedBanner label={t("lineSuspension.customerVerified")} />
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setVerifyOpen(true)}>{t("lineSuspension.verifyCustomer")}</Button>
              )}
            </Card>

            <Card title={t("lineSuspension.otp")} icon={Phone}>
              {otpVerified ? (
                <VerifiedBanner label={t("lineSuspension.otpVerified")} />
              ) : (
                <>
                  <Button variant="outline" className="w-full disabled:opacity-50" disabled={!verified} onClick={() => setOtpOpen(true)}>{t("lineSuspension.sendOtp")}</Button>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {verified ? t("lineSuspension.codeSentTo", { number: msisdn }) : t("lineSuspension.completeVerificationFirst")}
                  </p>
                </>
              )}
            </Card>

            {suspending && (
              <section className="bg-card rounded-2xl p-4 shadow-sm">
                <div
                  role="checkbox"
                  aria-checked={understood}
                  tabIndex={0}
                  onClick={() => setUnderstood((v) => !v)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setUnderstood((v) => !v); } }}
                  className="flex items-start gap-3 select-none cursor-pointer"
                >
                  <div className={cn("w-4 h-4 mt-0.5 rounded border-2 shrink-0 flex items-center justify-center", understood ? "bg-primary border-primary" : "border-primary")}>
                    {understood && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <p className="text-sm text-foreground text-start flex-1 leading-snug">{t("lineSuspension.understood", { days: VALIDITY_DAYS })}</p>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Sticky bottom — enabled once the line is found and every check is done */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="sm:max-w-[390px] mx-auto">
          <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canConfirm} onClick={resolve}>
            {t(`lineSuspension.confirm.${mode}`)}
          </Button>
        </div>
      </div>

      {/* Lookup / eligibility error */}
      <Dialog open={!!lookupError} onOpenChange={(o) => { if (!o) setLookupError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{lookupError?.title}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError?.message}</p>
          {/* Wrapped in a div: DialogContent's [&>button]:hidden would hide a direct-child button. */}
          <div>
            <button onClick={() => setLookupError(null)} className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm">
              {t("lineSuspension.gotIt")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer verification (Nafath) */}
      <SematiVerification
        open={verifyOpen}
        audience="customer"
        allowedMethods={["nafath"]}
        onClose={() => setVerifyOpen(false)}
        onVerified={() => { setVerifyOpen(false); setVerified(true); }}
      />

      {/* OTP */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("activation.otpSheet.title")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("activation.otpSheet.errorSubtitle") : t("lineSuspension.otpSentTo", { number: msisdn })}
            </p>
            <div className="flex gap-2" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`line-suspension-otp-${i}`}
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
              {otpError || otpSecondsLeft === 0 ? (
                <>
                  {t("activation.otpSheet.resendLabel")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("activation.otpSheet.resend")}</button>
                </>
              ) : (
                <>
                  {t("activation.otpSheet.noCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
                </>
              )}
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); navigate("/"); } }}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t(`lineSuspension.successTitle.${mode}`)}</h3>
            <p className="text-sm text-muted-foreground text-center">{t(`lineSuspension.successMsg.${mode}`, { number: msisdn, days: VALIDITY_DAYS })}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("lineSuspension.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); navigate("/"); }}>
            {t("lineSuspension.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t(`lineSuspension.failedTitle.${mode}`)}</h3>
            <p className="text-sm text-muted-foreground text-center">{withErrorCode(t("lineSuspension.failedDesc"), t)}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={resolve}>
              {t("lineSuspension.tryAgain")}
            </Button>
            <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setFailureOpen(false)}>
              {t("lineSuspension.cancel")}
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default LineSuspension;
