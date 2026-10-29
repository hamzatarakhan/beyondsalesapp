export const quantityError = (value: string, available: number, scanned: number): "quantityRequired" | "quantityInvalid" | "quantityLimit" | "quantityScanned" | undefined => {
  if (!value.trim() || Number(value) === 0) return "quantityRequired";
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) return "quantityInvalid";
  if (Number(value) > available) return "quantityLimit";
  if (Number(value) < scanned) return "quantityScanned";
};

// Serial numbers follow the prototype format, e.g. SN-VMSIM-3000: 6–24 characters
// of letters, digits and hyphens only.
export const isValidSerialFormat = (value: string) => /^[A-Za-z0-9-]{6,24}$/.test(value.trim());

export const serialError = (value: string, serials: string[], available: number): "serialRequired" | "serialInvalid" | "serialDuplicate" | "quantityLimit" | undefined => {
  if (!value.trim()) return "serialRequired";
  if (!isValidSerialFormat(value)) return "serialInvalid";
  if (serials.some(serial => serial.toUpperCase() === value.trim().toUpperCase())) return "serialDuplicate";
  if (serials.length >= available) return "quantityLimit";
};

// Submit-time check: every unit being returned needs its scanned serial, so the
// scanned count must reach the requested quantity (excess is clamped upstream).
export const serialCountError = (scanned: number, required: number): "serialsShort" | undefined =>
  scanned < required ? "serialsShort" : undefined;
// The remark is optional, except when the reason is "Others" — then it explains the return.
export const remarkError = (reason: string, remark: string): "remarkRequired" | undefined =>
  reason === "others" && !remark.trim() ? "remarkRequired" : undefined;
