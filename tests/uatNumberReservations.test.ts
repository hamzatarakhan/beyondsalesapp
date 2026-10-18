import { describe, expect, test } from "bun:test";
import { createUatReservationService, type UatReservation } from "../src/lib/uatNumberReservations";

const inventory = [
  { number: "0547896327", brand: "virgin" as const, available: false },
  { number: "0547896329", brand: "virgin" as const, available: true },
  { number: "0547896331", brand: "virgin" as const, available: true },
  { number: "0557896333", brand: "friendi" as const, available: true },
];

const existing = (status: UatReservation["status"], brand: "virgin" | "friendi" = "virgin"): UatReservation => ({ customerKey: "customer-a", number: "0547896329", brand, status });
describe("Existing UAT reservations", () => {
  test("Scenario 2 defaults to the number reserved for the same customer", () => {
    const service = createUatReservationService([existing("reserved")]);
    expect(service.reserve("customer-a", "virgin", inventory, "0547896331").number).toBe("0547896329");
    expect(service.message("customer-a")).toBe("reused");
  });
  test("Scenario 2 reuses a previously reserved number that is still available", () => {
    const service = createUatReservationService([existing("previously-reserved")]);
    expect(service.reserve("customer-a", "virgin", inventory).number).toBe("0547896329");
    expect(service.get("customer-a")?.status).toBe("reserved");
  });
  test("Scenario 3 replaces an unavailable number and records the reason", () => {
    const service = createUatReservationService([existing("unavailable")]);
    expect(service.reserve("customer-a", "virgin", inventory).number).toBe("0547896331");
    expect(service.message("customer-a")).toBe("replacedUnavailable");
  });
  test("Scenario 3 replaces a number being activated and records the reason", () => {
    const service = createUatReservationService([existing("activating")]);
    expect(service.reserve("customer-a", "virgin", inventory).number).toBe("0547896331");
    expect(service.message("customer-a")).toBe("replacedActivating");
    expect(service.isAvailable("customer-b", "0547896329")).toBe(false);
    expect(() => service.reserve("customer-b", "virgin", inventory)).toThrow("noAvailableNumber");
  });
  test("Scenario 3 replaces a previously reserved number no longer available", () => {
    const service = createUatReservationService([existing("previously-reserved")]);
    expect(service.reserve("customer-a", "virgin", inventory.map(item => ({ ...item, available: item.number !== "0547896329" && item.available }))).number).toBe("0547896331");
  });
  test("Scenario 4 rejects cancellation without permission for the reservation brand", () => {
    const service = createUatReservationService([existing("reserved", "friendi")], ["virgin"]);
    expect(service.canCancel("customer-a")).toBe(false);
    expect(() => service.cancel("customer-a")).toThrow("permissionDenied");
    expect(service.get("customer-a")?.brand).toBe("friendi");
  });
  test("Scenario 4 permits cancellation when access covers the reservation brand", () => {
    const service = createUatReservationService([existing("reserved", "virgin")], ["virgin"]);
    expect(() => service.reserve("customer-a", "friendi", inventory)).toThrow("existingReservation");
    expect(service.canCancel("customer-a")).toBe(true);
    service.cancel("customer-a");
    expect(service.get("customer-a")).toBeUndefined();
    expect(service.reserve("customer-a", "friendi", inventory).number).toBe("0557896333");
  });
});

describe("UAT Scenario 1: no existing reservation", () => {
  test("automatically books an available number for the customer and associated brand", () => {
    const service = createUatReservationService();
    expect(service.reserve("saudi-id:1324567896", "virgin", inventory)).toEqual({
      customerKey: "saudi-id:1324567896", brand: "virgin", number: "0547896329", status: "reserved",
    });
  });
  test("does not assign a booked number to another customer", () => {
    const service = createUatReservationService();
    service.reserve("customer-a", "virgin", inventory);
    expect(service.reserve("customer-b", "virgin", inventory).number).toBe("0547896331");
    expect(service.isAvailable("customer-b", "0547896329")).toBe(false);
  });
  test("repeating a request does not create another reservation", () => {
    const service = createUatReservationService();
    const first = service.reserve("customer-a", "virgin", inventory);
    expect(service.reserve("customer-a", "virgin", inventory, "0547896331")).toBe(first);
  });
  test("only assigns inventory belonging to the selected brand", () => {
    expect(createUatReservationService().reserve("customer-a", "friendi", inventory).number).toBe("0557896333");
  });
  test("blocks instead of inventing a number when no inventory is available", () => {
    expect(() => createUatReservationService().reserve("customer-a", "virgin", [])).toThrow("noAvailableNumber");
  });
  test("does not replace an existing reservation for a different brand", () => {
    const service = createUatReservationService();
    service.reserve("customer-a", "virgin", inventory);
    expect(() => service.reserve("customer-a", "friendi", inventory)).toThrow("existingReservation");
  });
});