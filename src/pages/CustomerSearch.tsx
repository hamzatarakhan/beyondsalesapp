import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PrototypeTestBox from "@/components/PrototypeTestBox";
import BrandLoadingOverlay from "@/components/BrandLoadingOverlay";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import virginMobileLogo from "@/assets/virgin-mobile-logo.svg";
import friendiMobileLogo from "@/assets/friendi-mobile-logo.svg";
import { IdCard, User, AlertCircle, Smartphone } from "lucide-react";

// ---------- Local UI primitives (mirrors CustomerComplaint.tsx / BillPayment.tsx) ----------
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
  icon: typeof User;
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
type SubscriptionType = "prepaid" | "postpaid" | "data";
type SubBrand = "virgin" | "friendi";

interface DemoSubscription {
  type: SubscriptionType;
  brand: SubBrand;
  msisdn: string;
  iccid: string;
  email: string;
  activationDate: string;
}

interface DemoSearchCustomer {
  idNumber: string;
  name: string;
  /** Code from NATIONALITY_CODES. */
  nationality: string;
  subscriptions: DemoSubscription[];
}

// ---------- Demo data ----------
const DEMO_CUSTOMERS: DemoSearchCustomer[] = [
  {
    idNumber: "2111111116",
    name: "Tamer Mohammed Vadhi Tofahh",
    nationality: "jo",
    subscriptions: [
      { type: "prepaid", brand: "virgin", msisdn: "0597398903", iccid: "8996605100094116741", email: "bilal.randhawa@gmail.com", activationDate: "2026-08-16" },
    ],
  },
  // One customer with lines across both brands and all three subscription types — the
  // carousel case (2+ cards, peek-next-card visible).
  {
    idNumber: "1324567896",
    name: "Ahmed Al-Otaibi",
    nationality: "sa",
    subscriptions: [
      { type: "postpaid", brand: "virgin", msisdn: "0502222211", iccid: "8996605100094118820", email: "ahmed.otaibi@example.com", activationDate: "2026-03-02" },
      { type: "prepaid", brand: "friendi", msisdn: "0561234567", iccid: "8996605100094119115", email: "ahmed.otaibi@example.com", activationDate: "2026-05-19" },
      { type: "data", brand: "virgin", msisdn: "0509876543", iccid: "8996605100094117603", email: "ahmed.otaibi@example.com", activationDate: "2026-07-01" },
    ],
  },
  {
    idNumber: "2298765432",
    name: "Priya Sharma",
    nationality: "in",
    subscriptions: [
      { type: "prepaid", brand: "friendi", msisdn: "0567891234", iccid: "8996605100094120456", email: "priya.sharma@example.com", activationDate: "2026-06-11" },
    ],
  },
];

const BRAND_LOGO: Record<SubBrand, string> = { virgin: virginMobileLogo, friendi: friendiMobileLogo };

const SubscriptionCardContent = ({
  sub,
  typeLabel,
  t,
}: {
  sub: DemoSubscription;
  typeLabel: Record<SubscriptionType, string>;
  t: (key: string) => string;
}) => (
  <>
    <div className="flex items-center justify-between mb-2">
      <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", TYPE_STYLE[sub.type])}>
        {typeLabel[sub.type]}
      </span>
      <img src={BRAND_LOGO[sub.brand]} alt="" className="h-6 w-auto shrink-0" />
    </div>
    <SummaryRow label={t("customerSearch.msisdn")} value={sub.msisdn} />
    <SummaryRow label={t("customerSearch.iccid")} value={sub.iccid} />
    <SummaryRow label={t("customerSearch.email")} value={sub.email} />
    <SummaryRow
      label={t("customerSearch.activationDate")}
      value={<span className="text-emerald-600 dark:text-emerald-400">{sub.activationDate}</span>}
    />
  </>
);

const TYPE_STYLE: Record<SubscriptionType, string> = {
  prepaid: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  postpaid: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  data: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

const CustomerSearch = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRtl } = useLanguage();
  // Same "peek next card" carousel PlanSelector.tsx uses — embla instead of plain CSS
  // scroll-snap so it responds to mouse drag too, not just touch/trackpad gestures.
  const [emblaRef] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", loop: false, direction: isRtl ? "rtl" : "ltr" });

  const TYPE_LABEL: Record<SubscriptionType, string> = {
    prepaid: t("customerSearch.typePrepaid"),
    postpaid: t("customerSearch.typePostpaid"),
    data: t("customerSearch.typeData"),
  };

  // ---------- Lookup ----------
  const [idNumber, setIdNumber] = useState("");
  const [checking, setChecking] = useState(false);
  const [customer, setCustomer] = useState<DemoSearchCustomer | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Saudi National ID starts with 1, Iqama ID starts with 2 — same rule BillPayment.tsx
  // uses for its Civil ID lookup.
  const idNumberValid = /^[12]\d{9}$/.test(idNumber);

  const handleSearch = () => {
    if (!idNumberValid) return;
    setCustomer(null);
    setLookupError(null);
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      const found = DEMO_CUSTOMERS.find((c) => c.idNumber === idNumber);
      if (!found) {
        setLookupError(t("customerSearch.lookupErrorNotFound"));
        return;
      }
      setCustomer(found);
    }, 800);
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-10">
      <AppHeader title={t("customerSearch.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        <Field label={t("customerSearch.idNumber")}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={idNumber}
                onChange={(e) => { setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setCustomer(null); setLookupError(null); }}
                placeholder={t("customerSearch.idNumberPlaceholder")}
                inputMode="numeric"
                className="h-12 bg-card rounded-xl pe-10"
              />
              <IdCard className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <Button type="button" className="h-12 w-20 rounded-xl shrink-0" disabled={!idNumberValid || checking} onClick={handleSearch}>
              {t("customerSearch.search")}
            </Button>
          </div>
          {idNumber.length > 0 && !idNumberValid && (
            <p className="text-[11px] text-destructive mt-1.5">{t("customerSearch.idNumberInvalidHint")}</p>
          )}
        </Field>

        <PrototypeTestBox
          heading={t("customerSearch.testNumbersHeading")}
          description={t("customerSearch.testNumbersDescription")}
          items={[
            { value: "2111111116", note: t("customerSearch.testNoteSingleLine") },
            { value: "1324567896", note: t("customerSearch.testNoteMultiLine") },
            { value: "2298765432", note: t("customerSearch.testNoteFriendiLine") },
            { value: "1999999999", note: t("customerSearch.testNoteNotFound") },
          ]}
          onSelect={(v) => { setIdNumber(v); setCustomer(null); setLookupError(null); }}
        />

        {customer && (
          <>
            <CardSection title={t("customerSearch.information")} icon={User}>
              <SummaryRow label={t("customerSearch.name")} value={customer.name} />
              <SummaryRow label={t("customerSearch.nationality")} value={t(`activation.identity.nationalities.${customer.nationality}`)} />
            </CardSection>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground px-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-primary" />
                {t("customerSearch.subscriptions")}
              </p>
              {customer.subscriptions.length === 1 ? (
                // A single line has nothing to peek at — render it as a plain full-width
                // card instead of a one-slide carousel.
                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/60">
                  <SubscriptionCardContent sub={customer.subscriptions[0]} typeLabel={TYPE_LABEL} t={t} />
                </div>
              ) : (
                // Horizontal carousel with a peek of the next card — same embla setup as
                // PlanSelector.tsx, so it drags with the mouse as well as touch/trackpad.
                <div className="-mx-4">
                  <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex touch-pan-y gap-3 ps-4">
                      {customer.subscriptions.map((sub, i) => (
                        <div key={i} className="shrink-0 grow-0 basis-[85%] bg-card rounded-2xl p-4 shadow-sm border border-border/60">
                          <SubscriptionCardContent sub={sub} typeLabel={TYPE_LABEL} t={t} />
                        </div>
                      ))}
                      {/* Trailing spacer so the last card's peek-gutter matches the leading ps-4. */}
                      <div className="shrink-0 w-4" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lookup error — same popup pattern used app-wide for a "not found" lookup result. */}
      <Dialog open={!!lookupError} onOpenChange={(o) => { if (!o) setLookupError(null); }}>
        <DialogContent className="max-w-[320px] rounded-3xl border-0 p-6 text-center [&>button]:hidden">
          <div className="mx-auto mb-2 relative w-16 h-16 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-destructive" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
              <polygon points="50,6 91,28 91,72 50,94 9,72 9,28" />
            </svg>
            <AlertCircle className="w-7 h-7 text-destructive relative" strokeWidth={2} />
          </div>
          <h4 className="font-semibold text-destructive mb-1 text-lg">{t("customerSearch.notFoundTitle")}</h4>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lookupError}</p>
          <button
            onClick={() => setLookupError(null)}
            className="w-full py-3 rounded-full bg-destructive text-white font-semibold text-sm"
          >
            {t("customerSearch.gotIt")}
          </button>
        </DialogContent>
      </Dialog>

      <BrandLoadingOverlay open={checking} />
    </div>
  );
};

export default CustomerSearch;
