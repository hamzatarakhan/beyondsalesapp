import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import SimCard from "@/components/activation/SimCard";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Package, Phone, ScanLine, Activity, AlertCircle } from "lucide-react";

// ---------- Local UI primitives (mirrors CustomerSearch.tsx / BillPayment.tsx) ----------
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
  icon: typeof Activity;
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

// ---------- Domain types ----------
type LookupMethod = "kit" | "msisdn" | "imsi";
type SimStatus = "active" | "not-active" | "defected";

interface DemoSimRecord {
  kit: string;
  /** Local form with leading 0 (matches PhoneNumberInput's value shape). */
  msisdn: string;
  imsi: string;
  status: SimStatus;
}

// ---------- Demo data — same three identifiers all resolve to the same record, so any of
// the three lookup methods can be tried against any status. ----------
const DEMO_SIM_RECORDS: DemoSimRecord[] = [
  { kit: "1234567890", msisdn: "0501110001", imsi: "420011234567890", status: "active" },
  { kit: "2345678901", msisdn: "0501110002", imsi: "420011234567891", status: "not-active" },
  { kit: "3456789012", msisdn: "0501110003", imsi: "420011234567892", status: "defected" },
];

const STATUS_STYLE: Record<SimStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "not-active": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  defected: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};

const SimStatusCheck = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const STATUS_LABEL: Record<SimStatus, string> = {
    active: t("simStatusCheck.statusActive"),
    "not-active": t("simStatusCheck.statusNotActive"),
    defected: t("simStatusCheck.statusDefected"),
  };

  // ---------- Lookup ----------
  const [method, setMethod] = useState<LookupMethod>("kit");
  const [kit, setKit] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [imsi, setImsi] = useState("");
  const [checking, setChecking] = useState(false);
  const [record, setRecord] = useState<DemoSimRecord | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const kitValid = /^\d{10}$/.test(kit);
  const msisdnValid = /^0\d{9}$/.test(msisdn);
  const imsiValid = /^\d{15}$/.test(imsi);
  const inputValid = method === "kit" ? kitValid : method === "msisdn" ? msisdnValid : imsiValid;

  const resetLookup = () => {
    setRecord(null);
    setLookupError(null);
  };

  const switchMethod = (m: LookupMethod) => {
    setMethod(m);
    resetLookup();
  };

  const handleSearch = () => {
    if (!inputValid) return;
    resetLookup();
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found =
        method === "kit"
          ? DEMO_SIM_RECORDS.find((r) => r.kit === kit)
          : method === "msisdn"
          ? DEMO_SIM_RECORDS.find((r) => r.msisdn === msisdn)
          : DEMO_SIM_RECORDS.find((r) => r.imsi === imsi);
      if (!found) {
        setLookupError(t("simStatusCheck.lookupErrorInvalid"));
        return;
      }
      setRecord(found);
    }, 800);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-10">
      <AppHeader title={t("simStatusCheck.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("simStatusCheck.checkBy")}</label>
          <div className="grid grid-cols-3 gap-2">
            <SimCard active={method === "kit"} label={t("simStatusCheck.kitCode")} icon={Package} onClick={() => switchMethod("kit")} />
            <SimCard active={method === "msisdn"} label={t("simStatusCheck.msisdn")} icon={Phone} onClick={() => switchMethod("msisdn")} />
            <SimCard active={method === "imsi"} label={t("simStatusCheck.imsiCode")} icon={ScanLine} onClick={() => switchMethod("imsi")} />
          </div>
        </div>

        {method === "kit" && (
          <Field label={t("simStatusCheck.kitCode")}>
            <div className="flex gap-2">
              <Input
                value={kit}
                onChange={(e) => { setKit(e.target.value.replace(/\D/g, "").slice(0, 10)); resetLookup(); }}
                placeholder={t("simStatusCheck.kitCodePlaceholder")}
                inputMode="numeric"
                className="h-12 bg-card rounded-xl flex-1"
              />
              <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!kitValid || checking} onClick={handleSearch}>
                {t("simStatusCheck.search")}
              </Button>
            </div>
            {kit.length > 0 && !kitValid && (
              <p className="text-[11px] text-destructive mt-1.5">{t("simStatusCheck.kitCodeInvalidHint")}</p>
            )}
          </Field>
        )}

        {method === "msisdn" && (
          <Field label={t("simStatusCheck.msisdn")}>
            <div className="flex gap-2">
              <PhoneNumberInput value={msisdn} onChange={(v) => { setMsisdn(v); resetLookup(); }} icon={<Phone className="w-4 h-4" />} className="flex-1" />
              <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!msisdnValid || checking} onClick={handleSearch}>
                {t("simStatusCheck.search")}
              </Button>
            </div>
          </Field>
        )}

        {method === "imsi" && (
          <Field label={t("simStatusCheck.imsiCode")}>
            <div className="flex gap-2">
              <Input
                value={imsi}
                onChange={(e) => { setImsi(e.target.value.replace(/\D/g, "").slice(0, 15)); resetLookup(); }}
                placeholder={t("simStatusCheck.imsiCodePlaceholder")}
                inputMode="numeric"
                className="h-12 bg-card rounded-xl flex-1"
              />
              <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!imsiValid || checking} onClick={handleSearch}>
                {t("simStatusCheck.search")}
              </Button>
            </div>
            {imsi.length > 0 && !imsiValid && (
              <p className="text-[11px] text-destructive mt-1.5">{t("simStatusCheck.imsiCodeInvalidHint")}</p>
            )}
          </Field>
        )}

        <PrototypeTestBox
          heading={t("simStatusCheck.testValuesHeading")}
          description={t("simStatusCheck.testValuesDescription")}
          items={
            method === "kit"
              ? [
                  { value: "1234567890", note: t("simStatusCheck.testNoteActive") },
                  { value: "2345678901", note: t("simStatusCheck.testNoteNotActive") },
                  { value: "3456789012", note: t("simStatusCheck.testNoteDefected") },
                  { value: "9999999999", note: t("simStatusCheck.testNoteInvalid") },
                ]
              : method === "msisdn"
              ? [
                  { value: "0501110001", note: t("simStatusCheck.testNoteActive") },
                  { value: "0501110002", note: t("simStatusCheck.testNoteNotActive") },
                  { value: "0501110003", note: t("simStatusCheck.testNoteDefected") },
                  { value: "0509999999", note: t("simStatusCheck.testNoteInvalid") },
                ]
              : [
                  { value: "420011234567890", note: t("simStatusCheck.testNoteActive") },
                  { value: "420011234567891", note: t("simStatusCheck.testNoteNotActive") },
                  { value: "420011234567892", note: t("simStatusCheck.testNoteDefected") },
                  { value: "420019999999999", note: t("simStatusCheck.testNoteInvalid") },
                ]
          }
          onSelect={(v) => {
            if (method === "kit") setKit(v);
            else if (method === "msisdn") setMsisdn(v);
            else setImsi(v);
            resetLookup();
          }}
        />

        {record && (
          <CardSection title={t("simStatusCheck.simStatusDetails")} icon={Activity}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-muted-foreground">{t("simStatusCheck.status")}</span>
              <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", STATUS_STYLE[record.status])}>
                {STATUS_LABEL[record.status]}
              </span>
            </div>
            <SummaryRow label={t("simStatusCheck.kitCode")} value={record.kit} />
            <SummaryRow label={t("simStatusCheck.msisdn")} value={record.msisdn} />
            <SummaryRow label={t("simStatusCheck.imsiCode")} value={record.imsi} />
          </CardSection>
        )}
      </div>

      {/* Invalid / not found — same popup pattern used app-wide for a lookup failure. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => { if (!o) setLookupError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("simStatusCheck.invalidTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button
            onClick={() => setLookupError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("simStatusCheck.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default SimStatusCheck;
