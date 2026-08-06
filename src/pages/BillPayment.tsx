import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import FlowStepper from "@/components/FlowStepper";
import PayOption from "@/components/activation/PayOption";
import SimCard from "@/components/activation/SimCard";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import RiyalSymbol from "@/components/RiyalSymbol";
import { DEALER_WALLET_BALANCE, VerifiedBanner } from "@/pages/NewActivation";
import {
  Phone,
  IdCard,
  Receipt,
  ReceiptText,
  Wallet,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Check,
  XCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";

// ---------- Local UI primitives (mirrors CreditLimitAdjustment.tsx / SubscriptionMigration.tsx) ----------
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
  icon: typeof Receipt;
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

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-3">
    <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
    <p className="text-[13px] text-destructive leading-snug">{message}</p>
  </div>
);

// Nothing owed is a good outcome, not a failure — kept visually distinct from ErrorBanner
// (emerald/checkmark instead of red/alert) so it doesn't read as something having gone wrong.
const NoBillsBanner = ({ message }: { message: string }) => (
  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/20 px-4 py-3 flex items-start gap-3">
    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
    <p className="text-[13px] text-emerald-700 dark:text-emerald-300 leading-snug">{message}</p>
  </div>
);

// ---------- Domain types ----------
type LookupMethod = "msisdn" | "civil-id";
type AccountType = "switch-postpaid" | "vnet";
/** SD = soft disconnect, HD = hard disconnect — both still owe their outstanding bills. */
type AccountStatus = "active" | "sd" | "hd" | "terminated";

interface Bill {
  number: string;
  cycle: string;
  status: "Unpaid" | "Overdue" | "Partially Paid";
  /** Total payable for this bill, VAT included. */
  amount: number;
  currentBalance: number;
  unbilled: number;
  outOfBundle: number;
}

interface BillAccount {
  msisdn: string;
  type: AccountType;
  status: AccountStatus;
  civilId: string;
  holder: string;
  /** Vnet lines aren't voice-reachable — their OTP goes to this associated contact number. */
  contactNumber?: string;
  /** Newest bill first. The newest bill's amount is the total due; it rolls up earlier cycles. */
  bills: Bill[];
}

// ---------- Demo data ----------
const makeBill = (over: Partial<Bill> & Pick<Bill, "number" | "cycle" | "amount">): Bill => ({
  status: "Unpaid",
  currentBalance: 0,
  unbilled: 0,
  outOfBundle: 0,
  ...over,
});

const DEMO_ACCOUNTS: BillAccount[] = [
  // Single Switch Postpaid line, one open bill.
  {
    msisdn: "0502222211",
    type: "switch-postpaid",
    status: "active",
    civilId: "1324567896",
    holder: "Ahmed Mohammed",
    bills: [
      makeBill({ number: "BL-2026-07-4412", cycle: "1st July – 31st July, 2026", amount: 345, currentBalance: 300, unbilled: 25, outOfBundle: 20 }),
    ],
  },
  // Switch Postpaid with two open cycles — the newest bill rolls up the older one.
  {
    msisdn: "0502222222",
    type: "switch-postpaid",
    status: "active",
    civilId: "1876543210",
    holder: "Sara Al-Otaibi",
    bills: [
      makeBill({ number: "BL-2026-07-5590", cycle: "1st July – 31st July, 2026", status: "Overdue", amount: 780, currentBalance: 690, unbilled: 45, outOfBundle: 45 }),
      makeBill({ number: "BL-2026-06-5218", cycle: "1st June – 30th June, 2026", status: "Overdue", amount: 420, currentBalance: 390, unbilled: 0, outOfBundle: 30 }),
    ],
  },
  // Vnet line — 13-digit number, OTP goes to the associated contact number.
  {
    msisdn: "0502222233444",
    type: "vnet",
    status: "active",
    civilId: "1876543210",
    holder: "Sara Al-Otaibi",
    contactNumber: "0502222222",
    bills: [
      makeBill({ number: "BL-2026-07-7731", cycle: "1st July – 31st July, 2026", amount: 512.5, currentBalance: 460, unbilled: 32.5, outOfBundle: 20 }),
    ],
  },
  // Terminated line — can only be settled through the Civil ID flow.
  {
    msisdn: "0502222244",
    type: "switch-postpaid",
    status: "terminated",
    civilId: "1876543210",
    holder: "Sara Al-Otaibi",
    bills: [
      makeBill({ number: "BL-2026-05-3007", cycle: "1st May – 31st May, 2026", status: "Overdue", amount: 260, currentBalance: 260, unbilled: 0, outOfBundle: 0 }),
    ],
  },
  // Hard-disconnected line, still owes — also reachable only via Civil ID.
  {
    msisdn: "0502222255",
    type: "switch-postpaid",
    status: "hd",
    civilId: "1876543210",
    holder: "Sara Al-Otaibi",
    bills: [
      makeBill({ number: "BL-2026-06-9120", cycle: "1st June – 30th June, 2026", status: "Overdue", amount: 190, currentBalance: 190, unbilled: 0, outOfBundle: 0 }),
    ],
  },
  // Settled line — nothing outstanding.
  {
    msisdn: "0502222266",
    type: "switch-postpaid",
    status: "active",
    civilId: "2345678901",
    holder: "Omar Al-Ghamdi",
    bills: [],
  },
];

/** Prepaid lines exist in the demo only so the flow can reject them with the right message. */
const DEMO_PREPAID_MSISDNS = ["0501111133", "0501111155"];

const MIN_PAY = 10;
/** Ceiling for a single-account payment. Multi-account rows cap at their own bill amount instead. */
const MSISDN_MAX_PAY = 2500;

const money = (n: number) => n.toFixed(2).replace(/\.00$/, "");

/** Newest bill carries the full outstanding balance, so it alone is the amount due. */
const totalDueOf = (a: BillAccount) => (a.bills.length > 0 ? a.bills[0].amount : 0);

const BillPayment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
    "switch-postpaid": t("billPayment.accountTypeSwitchPostpaid"),
    vnet: t("billPayment.accountTypeVnet"),
  };

  const STATUS_LABEL: Record<AccountStatus, string> = {
    active: t("billPayment.statusActive"),
    sd: t("billPayment.statusSoftDisconnected"),
    hd: t("billPayment.statusHardDisconnected"),
    terminated: t("billPayment.statusTerminated"),
  };

  const STATUS_STYLE: Record<AccountStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    sd: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    hd: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    terminated: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };

  const BILL_STATUS_LABEL: Record<Bill["status"], string> = {
    Unpaid: t("billPayment.billStatusUnpaid"),
    Overdue: t("billPayment.billStatusOverdue"),
    "Partially Paid": t("billPayment.billStatusPartiallyPaid"),
  };

  const BILL_STATUS_STYLE: Record<Bill["status"], string> = {
    Unpaid: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    Overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    "Partially Paid": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  };

  // ---------- Flow state ----------
  const [step, setStep] = useState(0);

  // Step 0 — Lookup
  const [method, setMethod] = useState<LookupMethod>("msisdn");
  const [msisdn, setMsisdn] = useState("0502222211");
  const [civilId, setCivilId] = useState("1876543210");
  const [checking, setChecking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  // Separate from lookupError: "nothing owed" is a good outcome, not a failed lookup.
  const [noBillsMessage, setNoBillsMessage] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BillAccount[] | null>(null);

  // Step 1 — Bills. Amounts are kept as strings so the dealer can clear/retype freely.
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expandedBill, setExpandedBill] = useState<string | null>(null);
  // Account cards are only collapsible once there are more than 2 — otherwise always expanded.
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  // Step 2 — Checkout
  const [payMethod, setPayMethod] = useState<"wallet" | "pos">("wallet");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(30);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");

  // ---------- Input validity ----------
  // Switch Postpaid numbers are 10 digits, Vnet numbers are 13.
  const msisdnValid = /^\d{10}$/.test(msisdn) || /^\d{13}$/.test(msisdn);
  // Civil ID is 10 digits: Saudi National IDs start with 1, Iqama IDs with 2.
  const civilIdValid = /^[12]\d{9}$/.test(civilId);
  const inputValid = method === "msisdn" ? msisdnValid : civilIdValid;

  const resetLookup = () => {
    setAccounts(null);
    setLookupError(null);
    setNoBillsMessage(null);
    setAmounts({});
    setSelected({});
    setExpandedBill(null);
    setExpandedAccounts(new Set());
  };

  // Account cards start expanded when there are 2 or fewer; beyond that they default closed
  // so a long list of accounts isn't an overwhelming wall of bills on first load.
  const initExpandedAccounts = (found: BillAccount[]) => {
    setExpandedAccounts(found.length <= 2 ? new Set(found.map((a) => a.msisdn)) : new Set());
  };

  // ---------- Lookup ----------
  const handleSearch = () => {
    if (!inputValid) return;
    setChecking(true);
    resetLookup();
    setTimeout(() => {
      setChecking(false);

      if (method === "msisdn") {
        if (DEMO_PREPAID_MSISDNS.includes(msisdn)) {
          setLookupError(t("billPayment.errorPrepaidIneligible"));
          return;
        }
        const found = DEMO_ACCOUNTS.find((a) => a.msisdn === msisdn);
        if (!found) {
          setLookupError(t("billPayment.errorNumberNotFound"));
          return;
        }
        // A terminated line can't be looked up directly — its balance is settled against the Civil ID.
        if (found.status === "terminated") {
          setLookupError(t("billPayment.errorTerminated"));
          return;
        }
        if (found.bills.length === 0) {
          setNoBillsMessage(t("billPayment.noBillsForNumber"));
          return;
        }
        setAccounts([found]);
        setAmounts({ [found.msisdn]: money(totalDueOf(found)) });
        setSelected({ [found.msisdn]: true });
        initExpandedAccounts([found]);
        return;
      }

      // Civil ID — pull every postpaid account on the ID, including SD/HD/terminated ones.
      const found = DEMO_ACCOUNTS.filter((a) => a.civilId === civilId && a.bills.length > 0);
      if (found.length === 0) {
        const idExists = DEMO_ACCOUNTS.some((a) => a.civilId === civilId);
        if (idExists) {
          setNoBillsMessage(t("billPayment.noBillsForId"));
        } else {
          setLookupError(t("billPayment.errorNoPostpaidForId"));
        }
        return;
      }
      setAccounts(found);
      setAmounts(Object.fromEntries(found.map((a) => [a.msisdn, money(totalDueOf(a))])));
      // Pre-select everything so a dealer settling the whole ID can just continue.
      setSelected(Object.fromEntries(found.map((a) => [a.msisdn, true])));
      initExpandedAccounts(found);
    }, 800);
  };

  // ---------- Derived ----------
  const isMulti = (accounts?.length ?? 0) > 1;
  const primary = accounts?.[0];

  /** Single account (either entry path) uses the flat 2500 ceiling; multi-account rows cap per bill. */
  const maxFor = (a: BillAccount) => (isMulti ? totalDueOf(a) : MSISDN_MAX_PAY);

  const amountErrorFor = (a: BillAccount): string | null => {
    const raw = amounts[a.msisdn] ?? "";
    if (raw.trim() === "") return t("billPayment.amountErrorEmpty");
    const n = Number(raw);
    if (!Number.isFinite(n)) return t("billPayment.amountErrorInvalid");
    if (n < MIN_PAY) return t("billPayment.amountErrorMin", { min: MIN_PAY });
    const max = maxFor(a);
    if (n > max) return t("billPayment.amountErrorMax", { max: money(max) });
    return null;
  };

  const payingAccounts = useMemo(
    () => (accounts ?? []).filter((a) => selected[a.msisdn]),
    [accounts, selected],
  );

  const totalToPay = payingAccounts.reduce((sum, a) => sum + (Number(amounts[a.msisdn]) || 0), 0);

  const canContinueBills =
    payingAccounts.length > 0 && payingAccounts.every((a) => amountErrorFor(a) === null);

  const walletShort = payMethod === "wallet" && totalToPay > DEALER_WALLET_BALANCE;
  const canPay = otpVerified && !walletShort;

  /** Where the OTP lands: Vnet uses its associated contact, Civil ID uses the registered number. */
  const otpTarget =
    method === "civil-id"
      ? t("billPayment.otpTargetCivilId")
      : primary?.type === "vnet"
      ? t("billPayment.otpTargetContact", { number: primary.contactNumber })
      : primary?.msisdn ?? "";

  // ---------- OTP ----------
  useEffect(() => {
    if (!otpOpen) return;
    setOtpDigits(["", "", "", "", "", ""]);
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
      (document.getElementById(`bill-otp-${i + 1}`) as HTMLInputElement | null)?.focus();
    }
  };

  const resendOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError(false);
    setOtpSecondsLeft(30);
    (document.getElementById("bill-otp-0") as HTMLInputElement | null)?.focus();
  };

  // ---------- Payment ----------
  const resolvePayment = () => {
    setConfirmOpen(false);
    const ok = Math.random() < 0.85;
    if (ok) {
      setOrderId(`BP-${Math.floor(100000 + Math.random() * 900000)}`);
      setSuccessOpen(true);
    } else {
      setFailureOpen(true);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMethod("msisdn");
    setMsisdn("0502222211");
    setCivilId("1876543210");
    resetLookup();
    setPayMethod("wallet");
    setOtpVerified(false);
  };

  const handleBack = () => {
    if (step === 0) {
      navigate("/");
      return;
    }
    setStep((s) => s - 1);
  };

  const toggleAccountExpanded = (msisdn: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(msisdn)) next.delete(msisdn); else next.add(msisdn);
      return next;
    });
  };

  // ---------- Renderers ----------
  const renderBill = (bill: Bill) => {
    const open = expandedBill === bill.number;
    return (
      <div key={bill.number} className="rounded-xl border border-border/60 bg-background/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{bill.number}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{bill.cycle}</p>
          </div>
          <div className="text-end shrink-0">
            <p className="text-sm font-bold text-foreground">
              <RiyalSymbol /> {money(bill.amount)}
            </p>
            <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", BILL_STATUS_STYLE[bill.status])}>
              {BILL_STATUS_LABEL[bill.status]}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpandedBill(open ? null : bill.number)}
          className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary"
        >
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />}
          {t("billPayment.billBreakdown")}
        </button>
        {open && (
          <div className="mt-2 pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-1 duration-200">
            <SummaryRow label={t("billPayment.currentBalance")} value={<><RiyalSymbol /> {money(bill.currentBalance)}</>} />
            <SummaryRow label={t("billPayment.unbilledAmount")} value={<><RiyalSymbol /> {money(bill.unbilled)}</>} />
            <SummaryRow label={t("billPayment.outOfBundleUsage")} value={<><RiyalSymbol /> {money(bill.outOfBundle)}</>} />
            <SummaryRow label={t("billPayment.totalVatIncl")} value={<><RiyalSymbol /> {money(bill.amount)}</>} />
          </div>
        )}
      </div>
    );
  };

  const renderAmountInput = (a: BillAccount) => {
    const err = amountErrorFor(a);
    const raw = amounts[a.msisdn] ?? "";
    const due = totalDueOf(a);
    const n = Number(raw);
    const diff = Number.isFinite(n) && raw.trim() !== "" ? n - due : 0;
    return (
      <div className="space-y-1.5">
        <Field label={t("billPayment.amountToPay")}>
          <div className="relative">
            <Input
              value={raw}
              onChange={(e) => {
                // Digits with at most one decimal point — no minus signs or stray characters.
                const cleaned = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                setAmounts((prev) => ({ ...prev, [a.msisdn]: cleaned }));
              }}
              inputMode="decimal"
              className={cn("h-12 bg-card rounded-xl ps-10", err && "border-destructive focus-visible:ring-destructive")}
            />
            <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              <RiyalSymbol />
            </span>
          </div>
        </Field>
        {err ? (
          <p className="text-[11px] text-destructive">{err}</p>
        ) : diff < 0 ? (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">
            {t("billPayment.partialPaymentNote", { amount: money(-diff) })}
          </p>
        ) : diff > 0 ? (
          <p className="text-[11px] text-sky-600 dark:text-sky-400">
            {t("billPayment.abovePaymentNote", { amount: money(diff) })}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            {t("billPayment.fullAmountNote", { min: MIN_PAY, max: money(maxFor(a)) })}
          </p>
        )}
      </div>
    );
  };

  // Hidden per UX decision: a 2-stage stepper adds chrome without adding real progress info.
  // Kept in source in case we want it back — just uncomment the FlowStepper line below.
  const steps = [
    { label: "Bills", Icon: Receipt },
    { label: "Checkout", Icon: Wallet },
  ];

  return (
    <div className="mobile-container min-h-screen bg-background pb-32">
      <AppHeader title={t("billPayment.title")} showBack onBackClick={handleBack} />
      {/* <FlowStepper current={step} steps={steps} /> */}

      <div className="px-4 space-y-4">
        {/* ── Step 0: Lookup ── */}
        {step === 0 && (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("billPayment.searchBillsBy")}</h3>
              {/* Same selector card as SIM Activation's SIM Type toggle. */}
              <div className="grid grid-cols-2 gap-3">
                <SimCard active={method === "msisdn"} label={t("billPayment.msisdn")} icon={Phone} onClick={() => { setMethod("msisdn"); resetLookup(); }} />
                <SimCard active={method === "civil-id"} label={t("billPayment.civilId")} icon={IdCard} onClick={() => { setMethod("civil-id"); resetLookup(); }} />
              </div>
            </section>

            {method === "msisdn" ? (
              <Field label={t("billPayment.msisdn")}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={msisdn}
                      onChange={(e) => { setMsisdn(e.target.value.replace(/\D/g, "").slice(0, 13)); resetLookup(); }}
                      placeholder={t("billPayment.msisdnPlaceholder")}
                      inputMode="numeric"
                      className="h-12 bg-card rounded-xl pe-10"
                    />
                    <Phone className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  {/* Fixed width so swapping the label for the loader doesn't resize the button. */}
                  <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!msisdnValid || checking} onClick={handleSearch}>
                    {t("billPayment.search")}
                  </Button>
                </div>
                {msisdn.length > 0 && !msisdnValid ? (
                  <p className="text-[11px] text-destructive mt-1.5">
                    {t("billPayment.msisdnInvalidHint")}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {t("billPayment.msisdnValidHint")}
                  </p>
                )}
              </Field>
            ) : (
              <Field label={t("billPayment.civilId")}>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={civilId}
                      onChange={(e) => { setCivilId(e.target.value.replace(/\D/g, "").slice(0, 10)); resetLookup(); }}
                      placeholder={t("billPayment.civilIdPlaceholder")}
                      inputMode="numeric"
                      className="h-12 bg-card rounded-xl pe-10"
                    />
                    <IdCard className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!civilIdValid || checking} onClick={handleSearch}>
                    {t("billPayment.search")}
                  </Button>
                </div>
                {civilId.length > 0 && !civilIdValid ? (
                  <p className="text-[11px] text-destructive mt-1.5">
                    {t("billPayment.civilIdInvalidHint")}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {t("billPayment.civilIdValidHint")}
                  </p>
                )}
              </Field>
            )}

            <PrototypeTestBox
              heading={method === "msisdn" ? t("billPayment.testNumbersHeading") : t("billPayment.testIdsHeading")}
              description={t("billPayment.testDescription")}
              items={
                method === "msisdn"
                  ? [
                      { value: "0502222211", note: t("billPayment.testNoteOneOpenBill") },
                      { value: "0502222222", note: t("billPayment.testNoteTwoOpenBills") },
                      { value: "0502222233444", note: t("billPayment.testNoteVnet") },
                      { value: "0502222244", note: t("billPayment.testNoteTerminated") },
                      { value: "0502222266", note: t("billPayment.testNoteNoOutstanding") },
                      { value: "0501111133", note: t("billPayment.testNotePrepaidIneligible") },
                      { value: "0500000099", note: t("billPayment.testNoteNotFound") },
                    ]
                  : [
                      { value: "1324567896", note: t("billPayment.testNoteSaudiSingle") },
                      { value: "1876543210", note: t("billPayment.testNoteSaudiFour") },
                      { value: "2345678901", note: t("billPayment.testNoteIqamaNoOutstanding") },
                      { value: "1000000009", note: t("billPayment.testNoteNoPostpaidFound") },
                    ]
              }
              onSelect={(v) => {
                if (method === "msisdn") setMsisdn(v); else setCivilId(v);
                resetLookup();
              }}
            />

            {lookupError && <ErrorBanner message={lookupError} />}
            {noBillsMessage && <NoBillsBanner message={noBillsMessage} />}

            {/* Results land inline, right under the search — no page hop to review bills. */}
            {isMulti && accounts && (
              <p className="text-xs text-muted-foreground px-1">
                {t("billPayment.accountsRegisteredToId", { count: accounts.length })}
              </p>
            )}

            {/* Beyond 2 accounts, cards collapse to just their header by default; the expand/
                collapse arrow is always shown (both MSISDN and Civil ID lookups) so a dealer can
                tuck any card away, not only when there happen to be more than 2. */}
            {(accounts ?? []).map((a) => {
              const isOn = !!selected[a.msisdn];
              const isExpanded = expandedAccounts.has(a.msisdn);
              return (
                <section key={a.msisdn} className={cn(
                  "bg-card rounded-2xl p-4 shadow-sm space-y-3 transition-colors",
                  isMulti && (isOn ? "!border !border-primary/20" : "border border-border/60"),
                )}>
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => toggleAccountExpanded(a.msisdn)}
                  >
                    {isMulti && (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isOn}
                        aria-label={t("billPayment.payForAria", { msisdn: a.msisdn })}
                        onClick={(e) => { e.stopPropagation(); setSelected((prev) => ({ ...prev, [a.msisdn]: !prev[a.msisdn] })); }}
                        className={cn(
                          "w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors",
                          isOn ? "bg-primary border-primary" : "border-primary/40",
                        )}
                      >
                        {isOn && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{a.msisdn}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[a.status])}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ACCOUNT_TYPE_LABEL[a.type]} · {a.holder}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-[10px] text-muted-foreground">{t("billPayment.totalDue")}</p>
                      <p className="text-base font-bold text-primary">
                        <RiyalSymbol /> {money(totalDueOf(a))}
                      </p>
                    </div>
                    <div className="shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 rtl:rotate-180" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <div className="space-y-2">{a.bills.map(renderBill)}</div>

                      {a.bills.length > 1 && (
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          {t("billPayment.latestBillRollup", { amount: money(totalDueOf(a)) })}
                        </p>
                      )}

                      {(!isMulti || isOn) && renderAmountInput(a)}
                    </>
                  )}
                </section>
              );
            })}
          </>
        )}

        {/* ── Step 1: Checkout ── */}
        {step === 1 && accounts && (
          <>
            <CardSection title={t("billPayment.paymentSummary")} icon={ReceiptText}>
              {/* Wrapped so SummaryRow's `last:border-0` scopes to these rows only — otherwise
                  the Total div right after it is the true last child, and the last row's own
                  bottom border stacks with Total's top border into a visible double line. */}
              <div>
                {payingAccounts.map((a) => (
                  <SummaryRow
                    key={a.msisdn}
                    label={`${a.msisdn} · ${ACCOUNT_TYPE_LABEL[a.type]}`}
                    value={<><RiyalSymbol /> {money(Number(amounts[a.msisdn]) || 0)}</>}
                  />
                ))}
              </div>
              {/* A "Total" row would just repeat the single line above it — only show it
                  when it's actually summing more than one account. */}
              {payingAccounts.length > 1 && (
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                  <span className="text-sm font-semibold text-foreground">{t("billPayment.total")}</span>
                  <span className="text-base font-bold text-primary">
                    <RiyalSymbol /> {money(totalToPay)}
                  </span>
                </div>
              )}
            </CardSection>

            <CardSection title={t("billPayment.paymentMethod")} icon={CreditCard}>
              <div className="space-y-2">
                <PayOption
                  icon={Wallet}
                  label={t("billPayment.dealerWallet")}
                  description={t("billPayment.dealerWalletDesc", { balance: DEALER_WALLET_BALANCE })}
                  selected={payMethod === "wallet"}
                  onClick={() => setPayMethod("wallet")}
                />
                <PayOption
                  icon={CreditCard}
                  label={t("billPayment.posTerminal")}
                  description={t("billPayment.posTerminalDesc")}
                  selected={payMethod === "pos"}
                  onClick={() => setPayMethod("pos")}
                />
              </div>
              {walletShort && (
                <p className="text-[11px] text-destructive mt-2">
                  {t("billPayment.walletShort", { amount: money(totalToPay - DEALER_WALLET_BALANCE) })}
                </p>
              )}
            </CardSection>

            <CardSection title={t("billPayment.otpVerification")} icon={ShieldCheck}>
              {otpVerified ? (
                <VerifiedBanner label={t("billPayment.otpVerified")} />
              ) : (
                <>
                  <Button variant="outline" className="w-full" onClick={() => setOtpOpen(true)}>{t("billPayment.sendVerifyOtp")}</Button>
                  <p className="text-[11px] text-muted-foreground mt-2">{t("billPayment.codeSentTo", { target: otpTarget })}</p>
                </>
              )}
            </CardSection>
          </>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <div className="max-w-[390px] mx-auto">
          {step === 0 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canContinueBills} onClick={() => setStep(1)}>
              {t("billPayment.continue")}
            </Button>
          )}
          {step === 1 && (
            <Button className="w-full h-12 text-sm font-semibold rounded-full" disabled={!canPay} onClick={() => setConfirmOpen(true)}>
              {t("billPayment.payAmountSar", { amount: money(totalToPay) })}
            </Button>
          )}
        </div>
      </div>

      {/* OTP drawer */}
      <Drawer open={otpOpen} onOpenChange={setOtpOpen}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-lg font-bold text-foreground">{t("billPayment.enterVerificationCode")}</h3>
            <p className="text-sm text-muted-foreground text-center px-4">
              {otpError ? t("billPayment.otpIncorrect") : t("billPayment.otpSentTo", { target: otpTarget })}
            </p>
            <div className="flex gap-2" dir="ltr">
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  id={`bill-otp-${i}`}
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
                  {t("billPayment.didntReceiveCode")}{" "}
                  <button type="button" onClick={resendOtp} className="text-primary font-semibold">{t("billPayment.resend")}</button>
                </>
              ) : (
                <>
                  {t("billPayment.didntReceiveCode")}{" "}
                  <span className="text-foreground font-medium">00:{String(otpSecondsLeft).padStart(2, "0")}</span>
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
              <h3 className="text-lg font-bold text-foreground mb-1">{t("billPayment.confirmPaymentTitle")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("billPayment.confirmPaymentDesc", { amount: money(totalToPay), count: payingAccounts.length })}
              </p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <Button className="w-full h-12 rounded-full font-semibold" onClick={resolvePayment}>{t("billPayment.yesConfirm")}</Button>
              <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => setConfirmOpen(false)}>{t("billPayment.cancel")}</button>
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("billPayment.paymentSuccessful")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("billPayment.paymentSuccessfulDesc", { amount: money(totalToPay), count: payingAccounts.length })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("billPayment.reference")} <span className="font-semibold text-foreground">{orderId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); resetAll(); navigate("/"); }}>
            {t("billPayment.done")}
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
            <h3 className="font-semibold text-foreground text-base mb-1">{t("billPayment.paymentFailedTitle")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("billPayment.paymentFailedDesc")}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setFailureOpen(false); setConfirmOpen(true); }}>
              {t("billPayment.tryAgain")}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-full font-semibold"
              onClick={() => {
                setFailureOpen(false);
                setTicketId(`TKT-${Math.floor(100000 + Math.random() * 900000)}`);
                setTicketOpen(true);
              }}
            >
              <LifeBuoy className="w-4 h-4 me-2" />
              {t("billPayment.raiseTechTicket")}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Tech ticket raised */}
      <Drawer open={ticketOpen} onOpenChange={(o) => !o && (setTicketOpen(false), resetAll(), navigate("/"))}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-sky-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("billPayment.techTicketRaised")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("billPayment.techTicketDesc")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("billPayment.ticket")} <span className="font-semibold text-foreground">{ticketId}</span>
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setTicketOpen(false); resetAll(); navigate("/"); }}>
            {t("billPayment.done")}
          </Button>
        </DrawerContent>
      </Drawer>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default BillPayment;
