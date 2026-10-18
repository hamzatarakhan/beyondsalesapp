import type { Brand } from "../contexts/BrandContext";

export type UatReservation = { customerKey: string; brand: Brand; number: string; status: "reserved" };
export type AvailableNumber = { number: string; brand: Brand; available: boolean };

// UAT only: shared for the lifetime of this app session; never calls the operator.
export function createUatReservationService() {
  const reservations = new Map<string, UatReservation>();
  return {
    reserve(customerKey: string, brand: Brand, inventory: AvailableNumber[], preferredNumber?: string): UatReservation {
      if (!customerKey.trim()) throw new Error("missingCustomer");
      const existing = reservations.get(customerKey);
      if (existing) {
        // Existing-reservation business scenarios are not specified yet. Do not replace them.
        if (existing.brand !== brand) throw new Error("existingReservation");
        return existing;
      }
      const taken = new Set([...reservations.values()].map(record => record.number));
      const available = inventory.filter(item => item.available && item.brand === brand && !taken.has(item.number));
      const picked = available.find(item => item.number === preferredNumber) ?? available[0];
      if (!picked) throw new Error("noAvailableNumber");
      const reservation: UatReservation = { customerKey, brand, number: picked.number, status: "reserved" };
      reservations.set(customerKey, reservation);
      return reservation;
    },
    isAvailable(customerKey: string, number: string) {
      return ![...reservations.values()].some(record => record.number === number && record.customerKey !== customerKey);
    },
  };
}

export const uatNumberReservations = createUatReservationService();