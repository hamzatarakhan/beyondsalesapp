import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const ROLE_CONFIGS: RoleConfig[] = [
  {
    key: "sales-partner",
    listLabel: "Sales Partner",
    formTitle: "New Sales Partner",
    businessFields: [
      { key: "orgTradingName", label: "Organization Trading Name", required: true, type: "text", placeholder: "Enter organization name", demoValue: "Al Rajhi Retail Trading Co." },
      { key: "orgId", label: "Organization ID", required: true, type: "text", placeholder: "Enter the ID", demoValue: "7011223344" },
      { key: "sapNumber", label: "SAP Number", required: true, type: "text", placeholder: "Enter the number", demoValue: "SAP-558231" },
      { key: "bankIban", label: "Bank IBAN Proof", required: true, type: "text", placeholder: "Enter IBAN", demoValue: "SA0380000000608010167519" },
      { key: "crExpiry", label: "CR Expiry Date", required: true, type: "date", demoOffsetDays: 365 },
    ],
    memberFields: [
      { key: "fullName", label: "Full Name", required: true, type: "name", placeholder: "Enter full name", demoValue: "Ahmed Al Otaibi" },
      { key: "civilId", label: "Civil ID", required: true, type: "text", placeholder: "Enter Civil ID", demoValue: "1029384756" },
      { key: "absherMobile", label: "Absher Mobile Number", required: true, type: "mobile", placeholder: "Enter Absher mobile number", demoValue: "0501234567" },
      { key: "email", label: "Email", required: true, type: "email", placeholder: "Enter the email", demoValue: "ahmed@alrajhiretail.sa" },
      { key: "contactName", label: "Contact Name", required: true, type: "name", placeholder: "Enter contact name", demoValue: "Sara Al Harbi" },
      { key: "contactMobile", label: "Contact Mobile Number", required: true, type: "mobile", placeholder: "Enter the mobile number", demoValue: "0559876543" },
    ],
    locationFields: [
      { key: "hqAddress", label: "HQ National Address", required: true, type: "text", placeholder: "Enter the coordinates EX. ABCD1234", demoValue: "RRRD1234" },
      { key: "region", label: "Region", required: true, type: "select", options: REGIONS, demoValue: "Riyadh Region" },
      { key: "city", label: "City", required: true, type: "select", options: CITIES, demoValue: "Riyadh" },
      { key: "district", label: "District", required: true, type: "select", demoValue: "Al Olaya" },
    ],
    showMap: true,
    documents: [
      { key: "commercialRegistration", label: "Commercial Registration", required: true, multi: true },
      { key: "vatCertificate", label: "VAT Certificate", required: true, multi: true },
      { key: "municipalityLicense", label: "Municipality License", required: true, multi: true },
      { key: "memberCivilIdCopy", label: "Member Civil ID Copy", required: true, multi: true },
      { key: "memberSignature", label: "Member Signature", required: true, signature: true },
      { key: "shopPictures", label: "Shop Pictures", required: true, multi: true },
      { key: "contractCopy", label: "Contract Copy", required: true, multi: true },
    ],
  },
  {
    key: "distributor",
    listLabel: "Distributor",
    formTitle: "New Partner",
    businessFields: [
      { key: "storeName", label: "Store Name", required: true, type: "text", placeholder: "Enter the store name", demoValue: "Noor Mobile Store" },
      { key: "rentalStart", label: "Rental Agreement Start Date", required: true, type: "date", demoOffsetDays: -30 },
      { key: "rentalEnd", label: "Rental Agreement End Date", required: true, type: "date", demoOffsetDays: 335 },
    ],
    locationFields: [
      { key: "region", label: "Region", type: "select", options: REGIONS, demoValue: "Makkah Region" },
      { key: "city", label: "City", required: true, type: "select", options: CITIES, demoValue: "Jeddah" },
      { key: "district", label: "District", required: true, type: "select", demoValue: "Al Hamra" },
      { key: "landmark", label: "Landmark", type: "text", placeholder: "Enter landmark", demoValue: "Near Al Rawdah Park" },
    ],
    documents: [
      { key: "rentalAgreementCopy", label: "Rental Agreement Copy", required: true },
      { key: "municipalityLicense", label: "Municipality license" },
    ],
  },
  {
    key: "pos",
    listLabel: "POS",
    formTitle: "New Partner",
    businessFields: [
      { key: "parentPartnerCode", label: "Parent Partner Code", required: true, type: "select", options: PARTNER_CODES, placeholder: "Select the partner code", demoValue: PARTNER_CODES[0] },
      { key: "storeName", label: "Store Name", required: true, type: "text", placeholder: "Enter the store name", demoValue: "Gulf Connect POS Store" },
      { key: "rentalStart", label: "Rental Agreement Start Date", required: true, type: "date", demoOffsetDays: -20 },
      { key: "rentalEnd", label: "Rental Agreement End Date", required: true, type: "date", demoOffsetDays: 345 },
    ],
    locationFields: [
      { key: "region", label: "Region", type: "select", options: REGIONS, demoValue: "Eastern Province" },
      { key: "city", label: "City", required: true, type: "select", options: CITIES, demoValue: "Dammam" },
      { key: "district", label: "District", required: true, type: "select", demoValue: "Al Faisaliyah" },
      { key: "landmark", label: "Landmark", type: "text", placeholder: "Enter landmark", demoValue: "Opposite Al Nuzha Mall" },
    ],
    documents: [
      { key: "rentalAgreementCopy", label: "Rental Agreement Copy", required: true },
    ],
  },
  {
    key: "sales-promotor",
    listLabel: "Sales Promotor (Outsource)",
    formTitle: "New Sales Promotor",
    businessFields: [
      { key: "fullName", label: "Full Name", required: true, type: "name", placeholder: "Enter the full name", demoValue: "Fahad Al Qahtani" },
      { key: "civilId", label: "Civil ID", required: true, type: "text", placeholder: "Enter the Civil ID", demoValue: "1055667788" },
      { key: "absherMobile", label: "Absher Mobile Number", required: true, type: "mobile", placeholder: "Enter the Absher mobile number", demoValue: "0503456789" },
      { key: "partnerName", label: "Partner Name", required: true, type: "locked", lockedValue: "Al Rajhi Trading Partner" },
      { key: "partnerStoreName", label: "Partner Store Name", type: "select", options: PARTNER_STORE_NAMES, placeholder: "Select the partner store name", demoValue: PARTNER_STORE_NAMES[0] },
    ],
    documents: [
      { key: "civilIdAttachment", label: "Civil ID Attachment", required: true },
    ],
  },
  {
    key: "sales-champion",
    listLabel: "Sales Champion",
    formTitle: "New Sales Champion",
    businessFields: [
      { key: "fullName", label: "Full Name", required: true, type: "name", placeholder: "Enter the full name", demoValue: "Noura Al Harbi" },
      { key: "activeMobile", label: "Active Mobile Number", required: true, type: "mobile", placeholder: "Enter the active mobile number", demoValue: "0502345678" },
      { key: "dob", label: "Date of Birth", required: true, type: "date", demoOffsetDays: -30 * 365 },
      { key: "civilId", label: "Civil ID", required: true, type: "text", placeholder: "Enter the Civil ID", demoValue: "2098765432" },
      { key: "idExpiry", label: "ID Expiry Date", required: true, type: "date", demoOffsetDays: 900 },
      { key: "email", label: "Email", required: true, type: "email", placeholder: "Enter the email", demoValue: "noura@example.sa" },
      { key: "mtStoreName", label: "MT Store Name", required: true, type: "text", placeholder: "Enter the MT store name", demoValue: "Noura MT Store" },
    ],
    documents: [
      { key: "civilIdAttachment", label: "Civil ID Attachment", required: true },
    ],
  },
  {
    key: "team-leader",
    listLabel: "Team Leader",
    formTitle: "New Team Leader",
    businessFields: [
      { key: "fullName", label: "Full Name", required: true, type: "name", placeholder: "Enter the full name", demoValue: "Khalid Al Dossari" },
      { key: "activeMobile", label: "Active Mobile Number", required: true, type: "mobile", placeholder: "Enter the active mobile number", demoValue: "0544455566" },
      { key: "dob", label: "Date of Birth", required: true, type: "date", demoOffsetDays: -32 * 365 },
      { key: "civilId", label: "Civil ID", required: true, type: "text", placeholder: "Enter the Civil ID", demoValue: "2233445566" },
      { key: "idExpiry", label: "ID Expiry Date", required: true, type: "date", demoOffsetDays: 800 },
      { key: "email", label: "Email", required: true, type: "email", placeholder: "Enter the email", demoValue: "khalid@example.sa" },
    ],
    locationFields: [
      { key: "nationalAddress", label: "National Address", type: "text", placeholder: "Enter the national address", demoValue: "ABCD5678" },
      { key: "region", label: "Region", required: true, type: "select", options: REGIONS, demoValue: "Madinah Region" },
      { key: "city", label: "City", required: true, type: "select", options: CITIES, demoValue: "Medina" },
      { key: "district", label: "District", required: true, type: "select", demoValue: "Quba" },
    ],
    showMap: true,
    documents: [
      { key: "civilIdAttachment", label: "Civil ID Attachment", required: true },
    ],
  },
  {
    key: "account-manager",
    listLabel: "Account Manager",
    formTitle: "New Account Manager",
    businessFields: [
      { key: "fullName", label: "Full Name", required: true, type: "name", placeholder: "Enter the full name", demoValue: "Huda Al Qahtani" },
      { key: "activeMobile", label: "Active Mobile Number", required: true, type: "mobile", placeholder: "Enter the active mobile number", demoValue: "0555566677" },
      { key: "dob", label: "Date of Birth", required: true, type: "date", demoOffsetDays: -35 * 365 },
      { key: "civilId", label: "Civil ID", required: true, type: "text", placeholder: "Enter the Civil ID", demoValue: "1344556677" },
      { key: "idExpiry", label: "ID Expiry Date", required: true, type: "date", demoOffsetDays: 700 },
      { key: "email", label: "Email", required: true, type: "email", placeholder: "Enter the email", demoValue: "huda@example.sa" },
    ],
    locationFields: [
      { key: "nationalAddress", label: "National Address", type: "text", placeholder: "Enter the national address", demoValue: "WXYZ4321" },
      { key: "region", label: "Region", required: true, type: "select", options: REGIONS, demoValue: "Makkah Region" },
      { key: "city", label: "City", required: true, type: "select", options: CITIES, demoValue: "Jeddah" },
      { key: "district", label: "District", required: true, type: "select", demoValue: "Al Safa" },
    ],
    showMap: true,
    documents: [
      { key: "civilIdAttachment", label: "Civil ID Attachment", required: true },
    ],
  },
];

const validateField = (field: FieldDef, val: string): string | undefined => {
  if (!val) return undefined;
  if (field.type === "name" && !/^[A-Za-z\s]+$/.test(val)) return "Full name must contain letters only.";
  if (field.type === "mobile" && !/^\d{9,10}$/.test(val)) return "Enter a valid mobile number.";
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email address.";
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
    navigate("/");
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
    setErrors((prev) => ({ ...prev, [field.key]: validateField(field, values[field.key] || "") }));
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
              {dates[field.key] ? format(dates[field.key]!, "d MMM yyyy") : "Select Date"}
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
              <Plus className="w-3.5 h-3.5" /> Add Files
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
            <p className="text-sm text-muted-foreground">Upload your files here</p>
          </button>
        ) : (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2.5 rounded-xl border border-dashed border-border bg-card px-3.5 py-3">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">{file.title}</span>
                <button type="button" aria-label={`View ${file.title}`} className="text-primary shrink-0">
                  <Eye className="w-4 h-4" />
                </button>
                <button type="button" aria-label={`Remove ${file.title}`} onClick={() => removeFile(doc.key, i)} className="text-destructive shrink-0">
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
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
          <p className="text-sm font-semibold text-foreground px-1">Business Information</p>
          <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
            {activeRole.businessFields.map(renderFieldWrapper)}
          </div>
        </div>

        {activeRole.memberFields && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground px-1">Member Information</p>
            <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3.5">
              {activeRole.memberFields.map(renderFieldWrapper)}
            </div>
          </div>
        )}

        {activeRole.locationFields && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-foreground">Location Information</p>
              {activeRole.showMap && (
                <button type="button" onClick={() => setMapOpen(true)} className="flex items-center gap-0.5 text-xs font-semibold text-primary">
                  Map <ChevronRight className="w-3.5 h-3.5" />
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

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3">
          <div className="max-w-[390px] mx-auto">
            <Button disabled={!canSubmit} onClick={handleSubmit} className="w-full h-12 rounded-full font-semibold">
              Submit
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
      <AppHeader title={view === "form" ? activeRole?.formTitle ?? "" : "Channel Member Onboarding"} showBack onBackClick={handleBack} />

      {view === "form" ? renderForm() : renderList()}

      {/* Date picker */}
      <Drawer open={!!dateDrawerKey} onOpenChange={(o) => !o && setDateDrawerKey(null)}>
        <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-8 pt-2">
          <div className="flex justify-center pt-1 pb-2"><div className="w-9 h-1 bg-muted-foreground/20 rounded-full" /></div>
          <div className="flex items-center justify-between pb-1">
            <div className="flex-1 text-center">
              <h3 className="text-lg font-bold text-foreground">Pick a Date</h3>
              <p className="text-xs text-muted-foreground">Please select a date</p>
            </div>
            <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center absolute end-5 top-4">
              <X className="w-4 h-4 text-muted-foreground" />
            </DrawerClose>
          </div>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={dateDrawerKey ? dates[dateDrawerKey] : undefined}
              onSelect={(d) => dateDrawerKey && setDates((prev) => ({ ...prev, [dateDrawerKey]: d }))}
              numberOfMonths={1}
              className="p-0"
              classNames={{ caption_label: "text-sm font-bold text-primary" }}
            />
          </div>
          <Button className="w-full h-12 rounded-full font-semibold mt-2" onClick={() => setDateDrawerKey(null)}>Apply</Button>
        </DrawerContent>
      </Drawer>

      {/* Signature pad */}
      <SignaturePadSheet
        open={sigOpen}
        title="Member Signature"
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
            <h3 className="font-semibold text-foreground text-base mb-1">Request Submitted</h3>
            <p className="text-sm text-muted-foreground text-center">
              {activeRole?.listLabel} onboarding request has been submitted for review.
            </p>
          </div>
          <Button className="w-full h-12 rounded-full font-semibold" onClick={() => { setSuccessOpen(false); closeForm(); }}>
            Done
          </Button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ChannelOnboarding;
