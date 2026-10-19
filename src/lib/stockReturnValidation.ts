export const quantityError = (value: string, available: number, scanned: number): "quantityRequired" | "quantityInvalid" | "quantityLimit" | "quantityScanned" | undefined => {
  if (!value.trim() || Number(value) === 0) return "quantityRequired";
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) return "quantityInvalid";
  if (Number(value) > available) return "quantityLimit";
  if (Number(value) < scanned) return "quantityScanned";
};

export const serialError = (value: string, serials: string[], available: number): "serialRequired" | "serialDuplicate" | "quantityLimit" | undefined => {
  if (!value.trim()) return "serialRequired";
  if (serials.some(serial => serial.toUpperCase() === value.trim().toUpperCase())) return "serialDuplicate";
  if (serials.length >= available) return "quantityLimit";
};