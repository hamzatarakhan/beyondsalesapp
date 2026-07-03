import { useState } from "react";
import { Gift, Signal, Globe, Phone, MessageSquare, Star, ChevronRight, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useTranslation } from "react-i18next";

export interface PlanCardData {
  title: string;
  internet: string;
  mins: string;
  sms: string;
  social: string;
  price: number;
  discount?: string | null;
  validityLabel?: string;
  validity?: string[];
  priceSuffix?: string;
  features?: string[];
  categories?: string[];
  tags?: string[];
  bonuses?: string[];
}

interface Props {
  plan: PlanCardData;
  selected: boolean;
  active?: boolean;
  selectLabel?: string;
  selectedLabel?: string;
  minsLabel?: string;
  layout?: "flex" | "postpaid";
  onSelect: () => void;
  onMoreDetails?: () => void;
}

const FeatureRow = ({
  icon: Icon,
  label,
  chip,
}: {
  icon: typeof Signal;
  label: React.ReactNode;
  chip?: React.ReactNode;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={2} />
    <p className="flex-1 text-[13px] text-foreground leading-snug">{label}</p>
    {chip}
  </div>
);

// ── App icons ──────────────────────────────────────────────────────────────
const AppIcons: { label: string; icon: React.ReactNode }[] = [
  {
    label: "WhatsApp",
    icon: (
      <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.978-1.413A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.95 7.95 0 01-4.077-1.12l-.292-.174-3.025.859.86-3.025-.174-.292A7.95 7.95 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
      </span>
    ),
  },
  {
    label: "YouTube",
    icon: (
      <span className="w-9 h-9 rounded-full bg-[#FF0000] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </span>
    ),
  },
  {
    label: "Instagram",
    icon: (
      <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)"}}>
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
      </span>
    ),
  },
  {
    label: "TikTok",
    icon: (
      <span className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg>
      </span>
    ),
  },
  {
    label: "X (Twitter)",
    icon: (
      <span className="w-9 h-9 rounded-full bg-black flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zM17.083 19.77h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
      </span>
    ),
  },
  {
    label: "Facebook",
    icon: (
      <span className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
      </span>
    ),
  },
  {
    label: "Snapchat",
    icon: (
      <span className="w-9 h-9 rounded-full bg-[#FFFC00] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.271 5.1l-.03.427c-.01.142.114.256.26.27.12.014.277.034.44.062.45.078.75.24.855.454.153.32.083.64-.198.892-.249.225-.463.336-.72.4l-.15.038c-.216.058-.384.11-.466.198-.162.18-.052.554.161 1.11.58 1.525 1.924 3.606 4.486 4.013.232.036.337.268.194.444-.68.833-1.956 1.352-3.72 1.543-.154.02-.243.174-.215.355.11.67.166 1.05.093 1.24-.066.173-.305.237-.478.237h-.047c-.183 0-.446-.06-.767-.157-.58-.177-1.25-.426-2.016-.426-.39 0-.764.054-1.118.16-1.157.35-1.96 1.31-3.97 1.31-.011 0-.021 0-.032-.001h-.032c-2.01 0-2.808-.96-3.966-1.31a4.06 4.06 0 00-1.117-.16c-.766 0-1.437.25-2.016.426-.32.097-.584.157-.768.157h-.047c-.173 0-.413-.064-.478-.237-.073-.19-.017-.57.093-1.24.028-.18-.06-.334-.215-.356-1.764-.19-3.04-.71-3.72-1.542-.143-.177-.038-.408.194-.444 2.562-.407 3.906-2.488 4.486-4.013.213-.556.323-.93.161-1.11-.082-.088-.25-.14-.466-.198l-.15-.038c-.257-.064-.47-.175-.72-.4-.28-.25-.35-.572-.198-.892.104-.213.405-.376.854-.454.165-.028.32-.048.44-.062.147-.014.27-.128.261-.27l-.03-.427c-.132-1.881-.258-3.907.271-5.1C7.86 1.07 11.217.793 12.206.793z"/></svg>
      </span>
    ),
  },
  {
    label: "Telegram",
    icon: (
      <span className="w-9 h-9 rounded-full bg-[#26A5E4] flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
      </span>
    ),
  },
];

// ── Country list (17+) with flag emojis ────────────────────────────────────
const COUNTRIES: { label: string; code: string }[] = [
  { label: "Saudi Arabia", code: "sa" },
  { label: "UAE", code: "ae" },
  { label: "Egypt", code: "eg" },
  { label: "Bahrain", code: "bh" },
  { label: "Kuwait", code: "kw" },
  { label: "Qatar", code: "qa" },
  { label: "Oman", code: "om" },
  { label: "Jordan", code: "jo" },
  { label: "Pakistan", code: "pk" },
  { label: "India", code: "in" },
  { label: "Philippines", code: "ph" },
  { label: "Bangladesh", code: "bd" },
  { label: "Indonesia", code: "id" },
  { label: "Nigeria", code: "ng" },
  { label: "United Kingdom", code: "gb" },
  { label: "United States", code: "us" },
  { label: "Turkey", code: "tr" },
];

const SHOW_INITIALLY = 8;

const PREVIEW_COUNT = 3;

// Mini app icons for chip preview — real SVGs at 14px
const PREVIEW_APPS: { bg: string; path: string }[] = [
  { bg: "#25D366", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.524 3.655 1.435 5.163L2 22l4.978-1.413A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" },
  { bg: "#FF0000", path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { bg: "url(#ig)", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
];

// Country codes for flagcdn.com (ISO 3166-1 alpha-2 lowercase)
const PREVIEW_COUNTRY_CODES = COUNTRIES.slice(0, PREVIEW_COUNT).map(c => c.code);

const SocialChip = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
  <button onClick={onClick} className="active:opacity-70 shrink-0">
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 text-[10px] font-semibold pointer-events-none">
      <span className="flex -space-x-1">
        {PREVIEW_APPS.map((app, i) => (
          <span key={i} className="w-4 h-4 rounded-full border border-white shrink-0 flex items-center justify-center overflow-hidden" style={{ background: app.bg === "url(#ig)" ? "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" : app.bg }}>
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white">
              <path d={app.path} />
            </svg>
          </span>
        ))}
      </span>
      {t("activation.plan.moreCount", { count: AppIcons.length - PREVIEW_COUNT })} <ChevronRight className="w-2.5 h-2.5 rtl:rotate-180" />
    </span>
  </button>
  );
};

const FlagChip = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
  <button onClick={onClick} className="active:opacity-70 shrink-0">
    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 text-[10px] font-semibold pointer-events-none">
      <span className="flex -space-x-0.5">
        {PREVIEW_COUNTRY_CODES.map((code) => (
          <img key={code} src={`https://flagcdn.com/w20/${code}.png`} alt={code} className="w-4 h-3 rounded-[2px] object-cover border border-white" />
        ))}
      </span>
      {t("activation.plan.moreCount", { count: COUNTRIES.length - PREVIEW_COUNT })} <ChevronRight className="w-2.5 h-2.5 rtl:rotate-180" />
    </span>
  </button>
  );
};

// ── Info bottom sheet ──────────────────────────────────────────────────────
const InfoSheet = ({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
    <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[80vh] flex flex-col">
      <div className="relative mb-1 mt-2 flex items-center justify-center shrink-0">
        <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        <button
          onClick={onClose}
          className="absolute end-0 w-8 h-8 rounded-full border border-border flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-[12px] text-muted-foreground mb-4 shrink-0">{description}</p>
      <div className="overflow-y-auto flex-1 min-h-0 space-y-2">
        {children}
      </div>
    </DrawerContent>
  </Drawer>
);

const AppsSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <InfoSheet open={open} onClose={onClose} title={t("activation.plan.supportedApps")} description={t("activation.plan.unlimitedApps")}>
      {AppIcons.map((item) => {
        const key = item.label.toLowerCase().replace(/\s*\(.*\)/, "").replace(/[^a-z]/g, "");
        return (
          <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
            {item.icon}
            <span className="text-sm font-medium text-foreground">{t(`activation.plan.apps.${key}`, item.label)}</span>
          </div>
        );
      })}
    </InfoSheet>
  );
};

const CountriesSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <InfoSheet open={open} onClose={onClose} title={t("activation.plan.availableCountries")} description={t("activation.plan.roamingCountries")}>
      {COUNTRIES.map((c) => (
        <div key={c.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
          <img src={`https://flagcdn.com/w40/${c.code}.png`} alt={c.label} className="w-9 h-6 rounded object-cover border border-border/40" />
          <span className="text-sm font-medium text-foreground">{t(`activation.plan.countries.${c.code}`, c.label)}</span>
        </div>
      ))}
    </InfoSheet>
  );
};

// ── Plan Card ──────────────────────────────────────────────────────────────
const PlanCard = ({
  plan,
  selected,
  active = true,
  selectLabel,
  selectedLabel,
  minsLabel,
  layout = "flex",
  onSelect,
  onMoreDetails,
}: Props) => {
  const { t } = useTranslation();
  const resolvedSelectLabel = selectLabel ?? t("activation.plan.selectPlan");
  const resolvedSelectedLabel = selectedLabel ?? t("activation.plan.selected");
  const resolvedMinsLabel = minsLabel ?? t("activation.plan.flexMins");
  const unlimited = t("activation.plan.unlimited");
  const validityRaw = plan.validityLabel ?? "Valid 30 days";
  const validityKey = plan.validity?.[0];
  const validity = validityKey
    ? t(`activation.plan.validityLabels.${validityKey}`, validityRaw.toLowerCase().replace("valid ", ""))
    : validityRaw.toLowerCase().replace("valid ", "");
  const isDataOnly = !plan.mins || plan.mins === "-";
  const [openSheet, setOpenSheet] = useState<null | "apps" | "countries">(null);

  return (
    <>
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden border border-border bg-card transition-all duration-200 flex flex-col w-full",
          active ? "scale-100 opacity-100" : "scale-[0.96] opacity-70"
        )}
      >
        {/* Most Popular badge — top-right */}
        <span className="absolute top-0 right-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold px-2.5 py-1 rounded-bl-xl rounded-tr-2xl">
          {t("activation.plan.mostPopular")}
        </span>

        <div className="p-4 flex flex-col flex-1">
          {isDataOnly ? (
            <>
              <p className="text-[12px] text-muted-foreground mb-1">
                <button onClick={onMoreDetails} className="font-medium text-primary active:opacity-70">
                  {plan.title}
                </button>
                <span className="mx-1.5">•</span>
                {validity} {t("activation.plan.planSuffix")}
              </p>
              <div className="flex items-end justify-between mb-4">
                <p className="text-3xl font-bold leading-none text-primary">{plan.internet}</p>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">{t("activation.plan.vatIncl")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {Number(plan.price).toFixed(2)}{" "}
                    <span className="text-muted-foreground font-normal text-sm">{t("activation.checkout.sar")}</span>
                  </p>
                </div>
              </div>
              <div className="mb-4">
                <FeatureRow icon={Signal} label={<><span className="font-bold">{plan.internet}</span> {t("activation.plan.coreData")}</>} />
              </div>
            </>
          ) : layout === "postpaid" ? (
            <>
              <p className="text-[12px] text-muted-foreground mb-1">
                <button onClick={onMoreDetails} className="font-medium text-primary active:opacity-70">
                  {plan.title}
                </button>
                <span className="mx-1.5">•</span>
                {validity} {t("activation.plan.planSuffix")}
              </p>
              <div className="flex items-end justify-between mb-4">
                <p className="text-3xl font-bold leading-none text-primary">{plan.internet}</p>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">{t("activation.plan.vatIncl")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {Number(plan.price).toFixed(2)}{" "}
                    <span className="text-muted-foreground font-normal text-sm">{t("activation.checkout.sar")}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                <FeatureRow icon={Signal} label={<><span className="font-semibold">{plan.internet}</span> {t("activation.plan.coreData")}</>} />
                {plan.social && plan.social !== "-" && (
                  <FeatureRow
                    icon={Globe}
                    label={<><span className="font-semibold">{plan.social === "Unlimited" ? unlimited : plan.social}</span> {t("activation.plan.socialData")}</>}
                    chip={<SocialChip onClick={() => setOpenSheet("apps")} />}
                  />
                )}
                {plan.mins && plan.mins !== "-" && (
                  <FeatureRow icon={Phone} label={<><span className="font-semibold">{plan.mins === "Unlimited" ? unlimited : plan.mins}</span> {t("activation.plan.nationalMins")}</>} />
                )}
                {plan.mins && plan.mins !== "-" && (
                  <FeatureRow icon={Phone} label={<><span className="font-semibold">{unlimited}</span> {t("activation.plan.roaming")}</>} />
                )}
                {plan.sms && plan.sms !== "-" && (
                  <FeatureRow icon={MessageSquare} label={<><span className="font-semibold">{plan.sms === "Unlimited" ? unlimited : plan.sms}</span> {t("activation.plan.sms")}</>} />
                )}
                {plan.social && plan.social !== "-" && (
                  <FeatureRow
                    icon={Star}
                    label={t("activation.plan.freeSubscription")}
                    chip={<FlagChip onClick={() => setOpenSheet("countries")} />}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-[12px] text-muted-foreground mb-1">
                <button onClick={onMoreDetails} className="font-medium text-primary active:opacity-70">
                  {plan.title}
                </button>
                <span className="mx-1.5">•</span>
                {validity} {t("activation.plan.planSuffix")}
              </p>
              <div className="flex items-end justify-between mb-4">
                <p className="text-3xl font-bold leading-none text-primary">
                  {plan.mins !== "Unlimited" && <>{plan.mins}{" "}</>}
                  <span className="text-xl">{resolvedMinsLabel}</span>
                </p>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">{t("activation.plan.vatIncl")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {Number(plan.price).toFixed(2)}{" "}
                    <span className="text-muted-foreground font-normal text-sm">{t("activation.checkout.sar")}</span>
                  </p>
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                <FeatureRow icon={Signal} label={<><span className="font-semibold">{plan.internet}</span> {t("activation.plan.coreData")}</>} />
                {plan.social && plan.social !== "-" && (
                  <FeatureRow
                    icon={Globe}
                    label={<><span className="font-semibold">{plan.social === "Unlimited" ? unlimited : plan.social}</span> {t("activation.plan.socialData")}</>}
                    chip={<SocialChip onClick={() => setOpenSheet("apps")} />}
                  />
                )}
                <FeatureRow
                  icon={Phone}
                  label={<><span className="font-semibold">{plan.mins === "Unlimited" ? unlimited : plan.mins}</span> {resolvedMinsLabel.toLowerCase()}</>}
                  chip={<FlagChip onClick={() => setOpenSheet("countries")} />}
                />
              </div>
            </>
          )}

          {/* CTA */}
          <button
            onClick={onSelect}
            className={cn(
              "mt-auto w-full py-3 rounded-full text-sm font-semibold transition-colors",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-foreground hover:bg-primary/20"
            )}
          >
            {selected ? resolvedSelectedLabel : resolvedSelectLabel}
          </button>
        </div>
      </div>

      <AppsSheet open={openSheet === "apps"} onClose={() => setOpenSheet(null)} />
      <CountriesSheet open={openSheet === "countries"} onClose={() => setOpenSheet(null)} />
    </>
  );
};

export default PlanCard;
