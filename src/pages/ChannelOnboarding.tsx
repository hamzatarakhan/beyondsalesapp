import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import AppHeader from "@/components/AppHeader";
import MapPicker from "@/components/MapPicker";
import { SignatureBox, SignaturePadSheet } from "@/components/activation/SignatureBox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerClose } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Plus,
  Eye,
  Trash2,
  FileText,
  CalendarDays,
  Check,
  X,
} from "lucide-react";

// ---------- Shared location data (mirrors NewActivation.tsx's demo Region/City/District set) ----------
const REGIONS = ["Riyadh Region", "Makkah Region", "Eastern Province", "Madinah Region", "Aseer Region", "Tabuk Region", "Hail Region", "Northern Borders", "Jouf Region", "Qassim Region", "Najran Region", "Jizan Region", "Bahah Region"];
const CITIES = ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"];
const DISTRICTS: Record<string, string[]> = {
  Riyadh: ["Al Olaya", "Al Malaz", "Al Muruj", "Al Nakheel", "Al Rawdah", "Al Qirawan", "Al Yasmin"],
  Jeddah: ["Al Hamra", "Al Rawdah", "Al Sharafeyah", "Al Balad", "Al Safa", "Al Zahraa"],
  Dammam: ["Al Faisaliyah", "Al Nuzha", "Al Shatea", "Al Adamah", "Al Badiyah"],
  Mecca: ["Al Aziziyah", "Al Shisha", "Al Zaher", "Al Rusaifa"],
  Medina: ["Al Haram", "Al Aziziyah", "Quba", "Al Salam"],
};
const CITY_TO_REGION: Record<string, string> = {
  Riyadh: "Riyadh Region",
  Jeddah: "Makkah Region",
  Mecca: "Makkah Region",
  Medina: "Madinah Region",
  Dammam: "Eastern Province",
};

const PARTNER_CODES = ["PTR-1001 — Al Rajhi Trading", "PTR-1042 — Noor Mobile Trading", "PTR-1077 — Gulf Connect Est."];
const PARTNER_STORE_NAMES = ["Al Rajhi Mobile Store — Al Olaya", "Al Rajhi Downtown Branch — Al Malaz"];

// Stretches the date-picker grid to the full width of its drawer instead of the default's
// intrinsic (centered) sizing — the day columns become flexible instead of fixed w-9 cells.
const FULL_WIDTH_CALENDAR_CLASSNAMES = {
  caption_label: "text-sm font-bold text-primary",
  months: "w-full",
  month: "w-full space-y-4",
  table: "w-full border-collapse space-y-1",
  head_row: "flex w-full",
  head_cell: "text-muted-foreground flex-1 text-center font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "flex-1 flex items-center justify-center h-9 text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
};

const generateNationalAddress = () => {
  const letters = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
  const digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join("");
  return `${letters}${digits}`;
};

// A quick squiggle used to pre-fill the Member Signature box for demo purposes.
const generatePlaceholderSignature = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(20, 80);
  ctx.bezierCurveTo(60, 20, 100, 100, 140, 40);
  ctx.bezierCurveTo(170, 10, 200, 90, 240, 50);
  ctx.bezierCurveTo(260, 30, 270, 70, 290, 45);
  ctx.stroke();
  return canvas.toDataURL("image/png");
};

// ---------- Config-driven form model ----------
type FieldType = "text" | "name" | "mobile" | "email" | "date" | "select" | "locked";

interface FieldDef {
  key: string;
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  lockedValue?: string;
  /** Pre-fills the field so demos don't need to type every value by hand. */
  demoValue?: string;
  /** For "date" fields — demo date expressed as an offset (in days) from today. */
  demoOffsetDays?: number;
}

interface DocDef {
  key: string;
  label: string;
  required?: boolean;
  multi?: boolean;
  signature?: boolean;
}

interface RoleConfig {
  key: string;
  listLabel: string;
  formTitle: string;
  businessFields: FieldDef[];
  memberFields?: FieldDef[];
  locationFields?: FieldDef[];
  showMap?: boolean;
  documents: DocDef[];
}

const buildRoleConfigs = (t: (key: string, opts?: Record<string, unknown>) => string): RoleConfig[] => [
  {
    key: "sales-partner",
    listLabel: t("channelOnboarding.roles.salesPartner.listLabel"),
    formTitle: t("channelOnboarding.roles.salesPartner.formTitle"),
    businessFields: [
      { key: "orgTradingName", label: t("channelOnboarding.fieldLabels.orgTradingName"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterOrgName"), demoValue: "Al Rajhi Retail Trading Co." },
      { key: "orgId", label: t("channelOnboarding.fieldLabels.orgId"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheId"), demoValue: "7011223344" },
      { key: "sapNumber", label: t("channelOnboarding.fieldLabels.sapNumber"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheNumber"), demoValue: "SAP-558231" },
      { key: "bankIban", label: t("channelOnboarding.fieldLabels.bankIbanProof"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterIban"), demoValue: "SA0380000000608010167519" },
      { key: "crExpiry", label: t("channelOnboarding.fieldLabels.crExpiryDate"), required: true, type: "date", demoOffsetDays: 365 },
    ],
    memberFields: [
      { key: "fullName", label: t("channelOnboarding.fieldLabels.fullName"), required: true, type: "name", placeholder: t("channelOnboarding.fieldPlaceholders.enterFullName"), demoValue: "Ahmed Al Otaibi" },
      { key: "civilId", label: t("channelOnboarding.fieldLabels.civilId"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterCivilId"), demoValue: "1029384756" },
      { key: "absherMobile", label: t("channelOnboarding.fieldLabels.absherMobile"), required: true, type: "mobile", placeholder: t("channelOnboarding.fieldPlaceholders.enterAbsherMobile"), demoValue: "0501234567" },
      { key: "email", label: t("channelOnboarding.fieldLabels.email"), required: true, type: "email", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheEmail"), demoValue: "ahmed@alrajhiretail.sa" },
      { key: "contactName", label: t("channelOnboarding.fieldLabels.contactName"), required: true, type: "name", placeholder: t("channelOnboarding.fieldPlaceholders.enterContactName"), demoValue: "Sara Al Harbi" },
      { key: "contactMobile", label: t("channelOnboarding.fieldLabels.contactMobile"), required: true, type: "mobile", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheMobileNumber"), demoValue: "0559876543" },
    ],
    locationFields: [
      { key: "hqAddress", label: t("channelOnboarding.fieldLabels.hqNationalAddress"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterCoordinates"), demoValue: "RRRD1234" },
      { key: "region", label: t("channelOnboarding.fieldLabels.region"), required: true, type: "select", options: REGIONS, demoValue: "Riyadh Region" },
      { key: "city", label: t("channelOnboarding.fieldLabels.city"), required: true, type: "select", options: CITIES, demoValue: "Riyadh" },
      { key: "district", label: t("channelOnboarding.fieldLabels.district"), required: true, type: "select", demoValue: "Al Olaya" },
    ],
    showMap: true,
    documents: [
      { key: "commercialRegistration", label: t("channelOnboarding.docLabels.commercialRegistration"), required: true, multi: true },
      { key: "vatCertificate", label: t("channelOnboarding.docLabels.vatCertificate"), required: true, multi: true },
      { key: "municipalityLicense", label: t("channelOnboarding.docLabels.municipalityLicense"), required: true, multi: true },
      { key: "memberCivilIdCopy", label: t("channelOnboarding.docLabels.memberCivilIdCopy"), required: true, multi: true },
      { key: "memberSignature", label: t("channelOnboarding.memberSignature"), required: true, signature: true },
      { key: "shopPictures", label: t("channelOnboarding.docLabels.shopPictures"), required: true, multi: true },
      { key: "contractCopy", label: t("channelOnboarding.docLabels.contractCopy"), required: true, multi: true },
    ],
  },
  {
    key: "distributor",
    listLabel: t("channelOnboarding.roles.distributor.listLabel"),
    formTitle: t("channelOnboarding.roles.distributor.formTitle"),
    businessFields: [
      { key: "storeName", label: t("channelOnboarding.fieldLabels.storeName"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterStoreName"), demoValue: "Noor Mobile Store" },
      { key: "rentalStart", label: t("channelOnboarding.fieldLabels.rentalStart"), required: true, type: "date", demoOffsetDays: -30 },
      { key: "rentalEnd", label: t("channelOnboarding.fieldLabels.rentalEnd"), required: true, type: "date", demoOffsetDays: 335 },
    ],
    locationFields: [
      { key: "region", label: t("channelOnboarding.fieldLabels.region"), type: "select", options: REGIONS, demoValue: "Makkah Region" },
      { key: "city", label: t("channelOnboarding.fieldLabels.city"), required: true, type: "select", options: CITIES, demoValue: "Jeddah" },
      { key: "district", label: t("channelOnboarding.fieldLabels.district"), required: true, type: "select", demoValue: "Al Hamra" },
      { key: "landmark", label: t("channelOnboarding.fieldLabels.landmark"), type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterLandmark"), demoValue: "Near Al Rawdah Park" },
    ],
    documents: [
      { key: "rentalAgreementCopy", label: t("channelOnboarding.docLabels.rentalAgreementCopy"), required: true },
      { key: "municipalityLicense", label: t("channelOnboarding.docLabels.municipalityLicense") },
    ],
  },
  {
    key: "pos",
    listLabel: t("channelOnboarding.roles.pos.listLabel"),
    formTitle: t("channelOnboarding.roles.pos.formTitle"),
    businessFields: [
      { key: "parentPartnerCode", label: t("channelOnboarding.fieldLabels.parentPartnerCode"), required: true, type: "select", options: PARTNER_CODES, placeholder: t("channelOnboarding.fieldPlaceholders.selectPartnerCode"), demoValue: PARTNER_CODES[0] },
      { key: "storeName", label: t("channelOnboarding.fieldLabels.storeName"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterStoreName"), demoValue: "Gulf Connect POS Store" },
      { key: "rentalStart", label: t("channelOnboarding.fieldLabels.rentalStart"), required: true, type: "date", demoOffsetDays: -20 },
      { key: "rentalEnd", label: t("channelOnboarding.fieldLabels.rentalEnd"), required: true, type: "date", demoOffsetDays: 345 },
    ],
    locationFields: [
      { key: "region", label: t("channelOnboarding.fieldLabels.region"), type: "select", options: REGIONS, demoValue: "Eastern Province" },
      { key: "city", label: t("channelOnboarding.fieldLabels.city"), required: true, type: "select", options: CITIES, demoValue: "Dammam" },
      { key: "district", label: t("channelOnboarding.fieldLabels.district"), required: true, type: "select", demoValue: "Al Faisaliyah" },
      { key: "landmark", label: t("channelOnboarding.fieldLabels.landmark"), type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterLandmark"), demoValue: "Opposite Al Nuzha Mall" },
    ],
    documents: [
      { key: "rentalAgreementCopy", label: t("channelOnboarding.docLabels.rentalAgreementCopy"), required: true },
    ],
  },
  {
    key: "sales-promotor",
    listLabel: t("channelOnboarding.roles.salesPromotor.listLabel"),
    formTitle: t("channelOnboarding.roles.salesPromotor.formTitle"),
    businessFields: [
      { key: "fullName", label: t("channelOnboarding.fieldLabels.fullName"), required: true, type: "name", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheFullName"), demoValue: "Fahad Al Qahtani" },
      { key: "civilId", label: t("channelOnboarding.fieldLabels.civilId"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheCivilId"), demoValue: "1055667788" },
      { key: "absherMobile", label: t("channelOnboarding.fieldLabels.absherMobile"), required: true, type: "mobile", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheAbsherMobile"), demoValue: "0503456789" },
      { key: "partnerName", label: t("channelOnboarding.fieldLabels.partnerName"), required: true, type: "locked", lockedValue: t("channelOnboarding.lockedValues.partnerNameValue") },
      { key: "partnerStoreName", label: t("channelOnboarding.fieldLabels.partnerStoreName"), type: "select", options: PARTNER_STORE_NAMES, placeholder: t("channelOnboarding.fieldPlaceholders.selectPartnerStoreName"), demoValue: PARTNER_STORE_NAMES[0] },
    ],
    documents: [
      { key: "civilIdAttachment", label: t("channelOnboarding.docLabels.civilIdAttachment"), required: true },
    ],
  },
  {
    key: "sales-champion",
    listLabel: t("channelOnboarding.roles.salesChampion.listLabel"),
    formTitle: t("channelOnboarding.roles.salesChampion.formTitle"),
    businessFields: [
      { key: "fullName", label: t("channelOnboarding.fieldLabels.fullName"), required: true, type: "name", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheFullName"), demoValue: "Noura Al Harbi" },
      { key: "activeMobile", label: t("channelOnboarding.fieldLabels.activeMobile"), required: true, type: "mobile", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheActiveMobile"), demoValue: "0502345678" },
      { key: "dob", label: t("channelOnboarding.fieldLabels.dob"), required: true, type: "date", demoOffsetDays: -30 * 365 },
      { key: "civilId", label: t("channelOnboarding.fieldLabels.civilId"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheCivilId"), demoValue: "2098765432" },
      { key: "idExpiry", label: t("channelOnboarding.fieldLabels.idExpiry"), required: true, type: "date", demoOffsetDays: 900 },
      { key: "email", label: t("channelOnboarding.fieldLabels.email"), required: true, type: "email", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheEmail"), demoValue: "noura@example.sa" },
      { key: "mtStoreName", label: t("channelOnboarding.fieldLabels.mtStoreName"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheMtStoreName"), demoValue: "Noura MT Store" },
    ],
    documents: [
      { key: "civilIdAttachment", label: t("channelOnboarding.docLabels.civilIdAttachment"), required: true },
    ],
  },
  {
    key: "team-leader",
    listLabel: t("channelOnboarding.roles.teamLeader.listLabel"),
    formTitle: t("channelOnboarding.roles.teamLeader.formTitle"),
    businessFields: [
      { key: "fullName", label: t("channelOnboarding.fieldLabels.fullName"), required: true, type: "name", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheFullName"), demoValue: "Khalid Al Dossari" },
      { key: "activeMobile", label: t("channelOnboarding.fieldLabels.activeMobile"), required: true, type: "mobile", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheActiveMobile"), demoValue: "0544455566" },
      { key: "dob", label: t("channelOnboarding.fieldLabels.dob"), required: true, type: "date", demoOffsetDays: -32 * 365 },
      { key: "civilId", label: t("channelOnboarding.fieldLabels.civilId"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheCivilId"), demoValue: "2233445566" },
      { key: "idExpiry", label: t("channelOnboarding.fieldLabels.idExpiry"), required: true, type: "date", demoOffsetDays: 800 },
      { key: "email", label: t("channelOnboarding.fieldLabels.email"), required: true, type: "email", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheEmail"), demoValue: "khalid@example.sa" },
    ],
    locationFields: [
      { key: "nationalAddress", label: t("channelOnboarding.fieldLabels.nationalAddress"), type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheNationalAddress"), demoValue: "ABCD5678" },
      { key: "region", label: t("channelOnboarding.fieldLabels.region"), required: true, type: "select", options: REGIONS, demoValue: "Madinah Region" },
      { key: "city", label: t("channelOnboarding.fieldLabels.city"), required: true, type: "select", options: CITIES, demoValue: "Medina" },
      { key: "district", label: t("channelOnboarding.fieldLabels.district"), required: true, type: "select", demoValue: "Quba" },
    ],
    showMap: true,
    documents: [
      { key: "civilIdAttachment", label: t("channelOnboarding.docLabels.civilIdAttachment"), required: true },
    ],
  },
  {
    key: "account-manager",
    listLabel: t("channelOnboarding.roles.accountManager.listLabel"),
    formTitle: t("channelOnboarding.roles.accountManager.formTitle"),
    businessFields: [
      { key: "fullName", label: t("channelOnboarding.fieldLabels.fullName"), required: true, type: "name", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheFullName"), demoValue: "Huda Al Qahtani" },
      { key: "activeMobile", label: t("channelOnboarding.fieldLabels.activeMobile"), required: true, type: "mobile", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheActiveMobile"), demoValue: "0555566677" },
      { key: "dob", label: t("channelOnboarding.fieldLabels.dob"), required: true, type: "date", demoOffsetDays: -35 * 365 },
      { key: "civilId", label: t("channelOnboarding.fieldLabels.civilId"), required: true, type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheCivilId"), demoValue: "1344556677" },
      { key: "idExpiry", label: t("channelOnboarding.fieldLabels.idExpiry"), required: true, type: "date", demoOffsetDays: 700 },
      { key: "email", label: t("channelOnboarding.fieldLabels.email"), required: true, type: "email", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheEmail"), demoValue: "huda@example.sa" },
    ],
    locationFields: [
      { key: "nationalAddress", label: t("channelOnboarding.fieldLabels.nationalAddress"), type: "text", placeholder: t("channelOnboarding.fieldPlaceholders.enterTheNationalAddress"), demoValue: "WXYZ4321" },
      { key: "region", label: t("channelOnboarding.fieldLabels.region"), required: true, type: "select", options: REGIONS, demoValue: "Makkah Region" },
      { key: "city", label: t("channelOnboarding.fieldLabels.city"), required: true, type: "select", options: CITIES, demoValue: "Jeddah" },
      { key: "district", label: t("channelOnboarding.fieldLabels.district"), required: true, type: "select", demoValue: "Al Safa" },
    ],
    showMap: true,
    documents: [
      { key: "civilIdAttachment", label: t("channelOnboarding.docLabels.civilIdAttachment"), required: true },
    ],
  },
];

const validateField = (t: (key: string) => string, field: FieldDef, val: string): string | undefined => {
  if (!val) return undefined;
  if (field.type === "name" && !/^[A-Za-z\s]+$/.test(val)) return t("channelOnboarding.nameError");
  if (field.type === "mobile" && !/^\d{9,10}$/.test(val)) return t("channelOnboarding.mobileError");
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return t("channelOnboarding.emailError");
  return undefined;
};

const roleAllFields = (role: RoleConfig): FieldDef[] => [
  ...role.businessFields,
  ...(role.memberFields ?? []),
  ...(role.locationFields ?? []),
];

const buildDefaultValues = (role: RoleConfig): Record<string, string> => {
  const result: Record<string, string> = {};
  roleAllFields(role).forEach((f) => {
    if (f.demoValue) result[f.key] = f.demoValue;
  });
  return result;
};

const buildDefaultDates = (role: RoleConfig): Record<string, Date | undefined> => {
  const result: Record<string, Date | undefined> = {};
  roleAllFields(role).forEach((f) => {
    if (f.type === "date" && f.demoOffsetDays !== undefined) {
      result[f.key] = new Date(Date.now() + f.demoOffsetDays * 86400000);
    }
  });
  return result;
};

const buildDefaultFiles = (role: RoleConfig): Record<string, { title: string }[]> => {
  const result: Record<string, { title: string }[]> = {};
  role.documents.forEach((d) => {
    if (d.signature) return;
    result[d.key] = d.multi ? [{ title: "File Title" }, { title: "Image Title" }] : [{ title: `${d.label.replace(/\s+/g, "_")}.pdf` }];
  });
  return result;
};

const ChannelOnboarding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const ROLE_CONFIGS = buildRoleConfigs(t);

  const [view, setView] = useState<"list" | "form">("list");
  const [activeRole, setActiveRole] = useState<RoleConfig | null>(null);

  const [values, setValues] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, Date | undefined>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [filesByDoc, setFilesByDoc] = useState<Record<string, { title: string }[]>>({});
  const [signature, setSignature] = useState<string | null>(null);
  const [sigOpen, setSigOpen] = useState(false);

  const [dateDrawerKey, setDateDrawerKey] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const openForm = (role: RoleConfig) => {
    setActiveRole(role);
    setValues(buildDefaultValues(role));
    setDates(buildDefaultDates(role));
    setErrors({});
    setFilesByDoc(buildDefaultFiles(role));
    setSignature(role.documents.some((d) => d.signature) ? generatePlaceholderSignature() : null);
    setView("form");
  };

  const closeForm = () => {
    setView("list");
    setActiveRole(null);
  };

  const handleBack = () => {
    if (view === "form") {
      closeForm();
      return;
    }
    navigate(-1);
  };

  const handleChange = (key: string, val: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "city") next.district = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleBlur = (field: FieldDef) => {
    setErrors((prev) => ({ ...prev, [field.key]: validateField(t, field, values[field.key] || "") }));
  };

  const addFile = (doc: DocDef) => {
    setFilesByDoc((prev) => {
      const list = prev[doc.key] ?? [];
      if (!doc.multi) return { ...prev, [doc.key]: [{ title: `${doc.label.replace(/\s+/g, "_")}.pdf` }] };
      const title = list.length % 2 === 0 ? "File Title" : "Image Title";
      return { ...prev, [doc.key]: [...list, { title }] };
    });
  };

  const removeFile = (docKey: string, idx: number) => {
    setFilesByDoc((prev) => ({ ...prev, [docKey]: (prev[docKey] ?? []).filter((_, i) => i !== idx) }));
  };

  const isFieldFilled = (f: FieldDef) => {
    if (!f.required) return true;
    if (f.type === "locked") return true;
    if (f.type === "date") return !!dates[f.key];
    return !!(values[f.key] && values[f.key].trim());
  };

  const allFields = activeRole ? roleAllFields(activeRole) : [];
  const requiredFieldsFilled = allFields.every(isFieldFilled);
  const requiredDocsFilled = activeRole
    ? activeRole.documents.every((d) => {
        if (!d.required) return true;
        if (d.signature) return !!signature;
        return (filesByDoc[d.key]?.length ?? 0) > 0;
      })
    : false;
  const hasErrors = Object.values(errors).some(Boolean);
  const canSubmit = requiredFieldsFilled && requiredDocsFilled && !hasErrors;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSuccessOpen(true);
  };

  // ---------- Field renderers ----------
  const renderField = (field: FieldDef) => {
    switch (field.type) {
      case "select": {
        const opts = field.key === "district" ? (DISTRICTS[values.city] ?? []) : field.options ?? [];
        return (
          <Select
            value={values[field.key] || ""}
            onValueChange={(v) => handleChange(field.key, v)}
            disabled={field.key === "district" && !values.city}
          >
            <SelectTrigger className="h-12 rounded-xl bg-card border-input">
              <SelectValue placeholder={field.placeholder ?? `Select the ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {opts.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "date":
        return (
          <button
            type="button"
            onClick={() => setDateDrawerKey(field.key)}
            className="w-full h-12 rounded-xl border border-input bg-card px-3.5 flex items-center justify-between text-sm"
          >
            <span className={dates[field.key] ? "text-foreground font-medium" : "text-muted-foreground"}>
              {dates[field.key] ? format(dates[field.key]!, "d MMM yyyy") : t("channelOnboarding.selectDate")}
            </span>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </button>
        );
      case "locked":
        return (
          <div className="h-12 rounded-xl bg-muted px-3.5 flex items-center">
            <span className="text-sm font-medium text-muted-foreground">{field.lockedValue}</span>
          </div>
        );
      default:
        return (
          <Input
            type={field.type === "email" ? "email" : field.type === "mobile" ? "tel" : "text"}
            value={values[field.key] || ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={field.placeholder}
            className={cn("h-12 rounded-xl bg-card", errors[field.key] ? "border-destructive focus-visible:ring-destructive" : "border-input")}
          />
        );
    }
  };

  const renderFieldWrapper = (field: FieldDef) => (
    <div key={field.key} className="space-y-1.5">
      <label className="text-sm text-foreground">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </label>
      {renderField(field)}
      {errors[field.key] && <p className="text-xs text-destructive">{errors[field.key]}</p>}
    </div>
  );

  const renderDocument = (doc: DocDef) => {
    if (doc.signature) {
      return (
        <SignatureBox
          title={doc.label}
          required={doc.required}
          value={signature}
          onEdit={() => setSigOpen(true)}
          onClear={() => setSignature(null)}
        />
      );
    }

    const files = filesByDoc[doc.key] ?? [];

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-foreground">
            {doc.label}
            {doc.required && <span className="text-destructive"> *</span>}
          </p>
          {doc.multi && files.length > 0 && (
            <button type="button" onClick={() => addFile(doc)} className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Plus className="w-3.5 h-3.5" /> {t("channelOnboarding.addFiles")}
            </button>
          )}
        </div>
        {files.length === 0 ? (
          <button
            type="button"
            onClick={() => addFile(doc)}
            className="w-full border-2 border-dashed border-border rounded-2xl bg-card py-8 flex flex-col items-center gap-2 active:bg-primary/5 transition-colors"
          >
            <span className="w-9 h-9 rounded-full border-2 border-primary flex items-center justify-center text-primary">
              <Plus className="w-4 h-4" />
            </span>
            <p className="text-sm text-muted-foreground">{t("channelOnboarding.uploadFilesHere")}</p>
          </button>
        ) : (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-card px-3.5 py-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">{file.title}</span>
                <button type="button" aria-label={t("channelOnboarding.viewFileAria", { title: file.title })} className="text-primary shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
                <button type="button" aria-label={t("channelOnboarding.removeFileAria", { title: file.title })} onClick={() => removeFile(doc.key, i)} className="text-destructive shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---------- List view ----------
  const renderList = () => (
    <div className="px-4 py-2 space-y-2.5">
      {ROLE_CONFIGS.map((role) => (
        <button
          key={role.key}
          type="button"
          onClick={() => openForm(role)}
          className="w-full bg-card rounded-xl px-4 py-4 flex items-center justify-between shadow-sm"
        >
          <span className="text-sm font-medium text-foreground">{role.listLabel}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
        </button>
      ))}
    </div>
  );

  // ---------- Form view ----------
  const renderForm = () => {
    if (!activeRole) return null;
    const addressField = activeRole.showMap ? activeRole.locationFields?.find((f) => f.type === "text") : undefined;

    return (
      <div className="px-4 pb-32 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground px-1">{t("channelOnboarding.businessInformation")}</p>
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
            {activeRole.businessFields.map(renderFieldWrapper)}
          </div>
        </div>

        {activeRole.memberFields && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground px-1">{t("channelOnboarding.memberInformation")}</p>
            <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
              {activeRole.memberFields.map(renderFieldWrapper)}
            </div>
          </div>
        )}

        {activeRole.locationFields && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-foreground">{t("channelOnboarding.locationInformation")}</p>
              {activeRole.showMap && (
                <button type="button" onClick={() => setMapOpen(true)} className="flex items-center gap-0.5 text-xs font-semibold text-primary">
                  {t("channelOnboarding.map")} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              )}
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
              {activeRole.locationFields.map(renderFieldWrapper)}
            </div>
          </div>
        )}

        {activeRole.documents.map((doc) => (
          <div key={doc.key}>{renderDocument(doc)}</div>
        ))}

        <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
          <div className="max-w-[390px] mx-auto">
            <Button disabled={!canSubmit} onClick={handleSubmit} className="w-full h-12 rounded-full font-semibold">
              {t("channelOnboarding.submit")}
            </Button>
          </div>
        </div>

        {addressField && (
          <MapPicker
            open={mapOpen}
            onOpenChange={setMapOpen}
            onConfirm={(city) => {
              const matchedCity = CITIES.find((c) => city?.toLowerCase().includes(c.toLowerCase())) ?? "Riyadh";
              handleChange(addressField.key, generateNationalAddress());
              handleChange("region", CITY_TO_REGION[matchedCity] ?? REGIONS[0]);
              handleChange("city", matchedCity);
              const districts = DISTRICTS[matchedCity] ?? [];
              handleChange("district", districts[Math.floor(Math.random() * districts.length)] ?? "");
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-6">
      <AppHeader title={view === "form" ? activeRole?.formTitle ?? "" : t("channelOnboarding.title")} showBack onBackClick={handleBack} />

      {view === "form" ? renderForm() : renderList()}

      {/* Date picker */}
      <Drawer open={!!dateDrawerKey} onOpenChange={(o) => !o && setDateDrawerKey(null)}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-1">
            <div className="flex-1 text-center">
              <h3 className="text-lg font-bold text-foreground">{t("channelOnboarding.pickADate")}</h3>
              <p className="text-xs text-muted-foreground">{t("channelOnboarding.pleaseSelectDate")}</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center absolute end-5 top-4">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>
          <Calendar
            mode="single"
            selected={dateDrawerKey ? dates[dateDrawerKey] : undefined}
            onSelect={(d) => dateDrawerKey && setDates((prev) => ({ ...prev, [dateDrawerKey]: d }))}
            numberOfMonths={1}
            className="w-full p-0"
            classNames={FULL_WIDTH_CALENDAR_CLASSNAMES}
          />
          <Button className="w-full h-12 rounded-full font-semibold mt-2" onClick={() => setDateDrawerKey(null)}>{t("channelOnboarding.apply")}</Button>
        </DrawerContent>
      </Drawer>

      {/* Signature pad */}
      <SignaturePadSheet
        open={sigOpen}
        title={t("channelOnboarding.memberSignature")}
        initial={signature}
        onClose={() => setSigOpen(false)}
        onSave={(dataUrl) => { setSignature(dataUrl); setSigOpen(false); }}
      />

      {/* Success */}
      <Drawer open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); closeForm(); } }}>
        <DrawerContent className="bg-card rounded-t-[28px] border-0 px-5 pb-6 pt-2">
          <div className="flex flex-col items-center mb-4">
            <div className="rounded-full bg-emerald-500/15 p-3 mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h3 className="font-semibold text-foreground text-base mb-1">{t("channelOnboarding.requestSubmitted")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("channelOnboarding.requestSubmittedDesc", { role: activeRole?.listLabel })}
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); closeForm(); }}>
            {t("channelOnboarding.done")}
          </Button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ChannelOnboarding;
