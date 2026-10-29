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

// Range Scan: a serial is a prefix plus a trailing number, e.g. SN-VMSIM-3000 or a purely
// numeric 3676837484836. First and last must share the prefix; the range is every number
// from first to last inclusive, keeping the first serial's zero padding. BigInt keeps long
// numeric serials exact. When a return quantity is set (`required` > 0), a range may not
// hold more serials than are still needed to reach it.
const splitSerial = (value: string) => {
  const m = value.trim().match(/^(.*?)(\d+)$/);
  return m ? { prefix: m[1], digits: m[2] } : undefined;
};

export const serialRangeError = (
  first: string,
  last: string,
  serials: string[],
  available: number,
  required = 0,
): "serialInvalid" | "rangeMismatch" | "rangeOrder" | "rangeOverlap" | "quantityLimit" | "rangeExceedsRequired" | undefined => {
  if (!isValidSerialFormat(last)) return "serialInvalid";
  const a = splitSerial(first);
  const b = splitSerial(last);
  if (!a || !b || a.prefix.toUpperCase() !== b.prefix.toUpperCase()) return "rangeMismatch";
  const start = BigInt(a.digits);
  const end = BigInt(b.digits);
  if (end < start) return "rangeOrder";
  if (end - start + 1n > BigInt(available - serials.length)) return "quantityLimit";
  if (required > 0 && end - start + 1n > BigInt(required - serials.length)) return "rangeExceedsRequired";
  const range = expandSerialRange(first, last);
  // The last serial must be written the way the range would write it (same padding).
  if (range[range.length - 1].toUpperCase() !== last.trim().toUpperCase()) return "rangeMismatch";
  const taken = new Set(serials.map((s) => s.toUpperCase()));
  if (range.some((s) => taken.has(s.toUpperCase()))) return "rangeOverlap";
};

// Every serial from first to last inclusive. Call only after serialRangeError passes.
export const expandSerialRange = (first: string, last: string): string[] => {
  const a = splitSerial(first)!;
  const end = BigInt(splitSerial(last)!.digits);
  const out: string[] = [];
  for (let n = BigInt(a.digits); n <= end; n++) out.push(a.prefix + n.toString().padStart(a.digits.length, "0"));
  return out;
};

// `serial` moved forward by `by` (prototype scan button), keeping prefix and padding.
export const offsetSerial = (serial: string, by: number) => {
  const a = splitSerial(serial);
  return a ? a.prefix + (BigInt(a.digits) + BigInt(by)).toString().padStart(a.digits.length, "0") : serial;
};
