// Lightweight persistence for partially filled prepaid activations.
// Stored against the customer's ID number so the same person can resume
// where they left off on a later Search Customer match.

const STORAGE_KEY = "prepaid:activation-drafts";

export type ActivationDraft = {
  idNumber: string;
  savedAt: number; // epoch ms
  data: Record<string, unknown>;
};

type DraftMap = Record<string, ActivationDraft>;

const read = (): DraftMap => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DraftMap;
  } catch {
    return {};
  }
};

const write = (map: DraftMap) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
};

const normalize = (id?: string | null) => (id ? id.trim().toUpperCase() : "");

/** Returns true when there is meaningful saved data worth resuming. */
const isMeaningful = (data: Record<string, unknown>) => {
  if (!data) return false;
  const keys = [
    "simType",
    "kit",
    "email",
    "numberSource",
    "phone",
    "portNumber",
    "portOperator",
    "planType",
    "activeTags",
    "selectedPlan",
    "promoCode",
    "pay",
    "customerSig",
    "dealerSig",
  ];
  return keys.some((k) => {
    const v = (data as any)[k];
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
};

export const getActivationDraft = (idNumber?: string | null): ActivationDraft | null => {
  const key = normalize(idNumber);
  if (!key) return null;
  const draft = read()[key];
  if (!draft) return null;
  if (!isMeaningful(draft.data)) return null;
  return draft;
};

export const hasActivationDraft = (idNumber?: string | null): boolean =>
  !!getActivationDraft(idNumber);

export const saveActivationDraft = (
  idNumber: string | null | undefined,
  data: Record<string, unknown>
) => {
  const key = normalize(idNumber);
  if (!key) return;
  if (!isMeaningful(data)) {
    clearActivationDraft(key);
    return;
  }
  const map = read();
  map[key] = { idNumber: key, savedAt: Date.now(), data };
  write(map);
};

export const clearActivationDraft = (idNumber?: string | null) => {
  const key = normalize(idNumber);
  if (!key) return;
  const map = read();
  if (map[key]) {
    delete map[key];
    write(map);
  }
};

export const formatDraftAge = (savedAt: number) => {
  const diffMs = Date.now() - savedAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};