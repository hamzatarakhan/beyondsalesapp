import { describe, expect, test } from "bun:test";
import { createUatReservationService } from "../src/lib/uatNumberReservations";

const inventory = [
  { number: "0547896327", brand: "virgin" as const, available: false },
  { number: "0547896329", brand: "virgin" as const, available: true },
  { number: "0547896331", brand: "virgin" as const, available: true },
  { number: "0557896333", brand: "friendi" as const, available: true },
];

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