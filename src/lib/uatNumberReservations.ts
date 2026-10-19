import type { Brand } from "../contexts/BrandContext";

export type UatReservation = { customerKey: string; brand: Brand; number: string; status: "reserved" | "previously-reserved" | "unavailable" | "activating"; cancellable?: boolean };
export type AvailableNumber = { number: string; brand: Brand; available: boolean };
export type ReservationMessage = "reserved" | "reused" | "replacedUnavailable" | "replacedActivating";
export class DifferentBrandReservationError extends Error {
  constructor(public reservation: UatReservation) { super("existingReservation"); }
}

// UAT only: shared for the lifetime of this app session; never calls the operator.
export function createUatReservationService(initial: UatReservation[] = [], cancellationBrands: Brand[] = []) {
  const reservations = new Map<string, UatReservation>(initial.map(record => [record.customerKey, record]));
  const messages = new Map<string, ReservationMessage>();
  const previous = new Map<string, string>();
  const unavailableNumbers = new Set(initial.filter(record => record.status === "unavailable" || record.status === "activating").map(record => record.number));
  return {
    get(customerKey: string) { return reservations.get(customerKey); },
    previousNumber(customerKey: string): string | undefined { return previous.get(customerKey); },
    message(customerKey: string): ReservationMessage { return messages.get(customerKey) ?? "reserved"; },
    canCancel(customerKey: string) {
      const record = reservations.get(customerKey);
      return !!record && record.cancellable !== false && cancellationBrands.includes(record.brand);
    },
    cancel(customerKey: string) {
      const record = reservations.get(customerKey);
      if (!record || record.cancellable === false || !cancellationBrands.includes(record.brand)) throw new Error("permissionDenied");
      reservations.delete(customerKey);
      messages.delete(customerKey);
    },
    reserve(customerKey: string, brand: Brand, inventory: AvailableNumber[], preferredNumber?: string, explicitSelection = false): UatReservation {
      if (!customerKey.trim()) throw new Error("missingCustomer");
      const existing = reservations.get(customerKey);
      if (existing && existing.brand !== brand) throw new DifferentBrandReservationError(existing);
      const taken = new Set([...reservations.values()].filter(record => record.customerKey !== customerKey && record.status !== "previously-reserved").map(record => record.number));
      // Explicit picker choices replace atomically; automatic requests still reuse by default.
      if (explicitSelection) {
        const picked = inventory.find(item => item.number === preferredNumber && item.brand === brand && item.available);
        if (!picked || taken.has(picked.number) || unavailableNumbers.has(picked.number)) throw new Error("noAvailableNumber");
        if (existing?.number === picked.number && existing.status === "reserved") return existing;
        const reservation: UatReservation = { customerKey, brand, number: picked.number, status: "reserved" };
        reservations.set(customerKey, reservation);
        previous.delete(customerKey);
        messages.set(customerKey, "reserved");
        return reservation;
      }
      const existingInventory = inventory.find(item => item.number === existing?.number && item.brand === brand);
      if (existing && !taken.has(existing.number) && (existing.status === "reserved" || (existing.status === "previously-reserved" && existingInventory?.available))) {
        existing.status = "reserved";
        if (!messages.has(customerKey)) messages.set(customerKey, "reused");
        return existing;
      }
      if (existing) {
        taken.add(existing.number);
        unavailableNumbers.add(existing.number);
      }
      const available = inventory.filter(item => item.available && item.brand === brand && !taken.has(item.number) && !unavailableNumbers.has(item.number));
      const picked = available.find(item => item.number === preferredNumber) ?? available[0];
      if (!picked) throw new Error("noAvailableNumber");
      const reservation: UatReservation = { customerKey, brand, number: picked.number, status: "reserved" };
      reservations.set(customerKey, reservation);
      if (existing) previous.set(customerKey, existing.number); else previous.delete(customerKey);
      messages.set(customerKey, existing ? existing.status === "activating" ? "replacedActivating" : "replacedUnavailable" : "reserved");
      return reservation;
    },
    isAvailable(customerKey: string, number: string) {
      if (unavailableNumbers.has(number)) return false;
      return ![...reservations.values()].some(record => record.number === number && (record.customerKey !== customerKey ? record.status !== "previously-reserved" : record.status === "unavailable" || record.status === "activating"));
    },
  };
}

// Fixed UAT fixtures only. Brand switching never grants cancellation access — the
// brands below are the dealer's standing access, so both sample reservations can be
// cancelled from the cross-brand pop-up regardless of which brand is selected.
const sampleReservations: UatReservation[] = [
  { customerKey: "saudi-id:1222222202", brand: "virgin", number: "0547896329", status: "reserved" },
  { customerKey: "saudi-id:1222222212", brand: "virgin", number: "0547896331", status: "previously-reserved" },
  { customerKey: "saudi-id:1333333303", brand: "virgin", number: "0547896333", status: "unavailable" },
  { customerKey: "saudi-id:1555555505", brand: "friendi", number: "0551234569", status: "reserved" },
  { customerKey: "saudi-id:1444444404", brand: "friendi", number: "0551234567", status: "reserved", cancellable: false },
];
export const uatNumberReservations = createUatReservationService(sampleReservations, ["virgin", "friendi"]);