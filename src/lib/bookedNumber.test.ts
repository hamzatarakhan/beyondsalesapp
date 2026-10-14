import { describe, expect, test } from "bun:test";
import { bookingCodeSchema, canActivateBookedNumber } from "./bookedNumber";

describe("booked-number activation", () => {
  test("booking codes must have exactly ten characters", () => {
    expect(bookingCodeSchema.safeParse("BK20261045").success).toBe(true);
    expect(bookingCodeSchema.safeParse("BK2026104").success).toBe(false);
    expect(bookingCodeSchema.safeParse("BK202610458").success).toBe(false);
  });
  test("booking codes must contain letters and numbers only, with both present", () => {
    for (const code of ["1234567890", "ABCDEFGHIJ", "BK-2026104", "BK202610 4"]) {
      expect(bookingCodeSchema.safeParse(code).success).toBe(false);
    }
    expect(bookingCodeSchema.safeParse("ab12345678").success).toBe(true);
  });
  test("booked-number activation is prepaid only", () => {
    expect(canActivateBookedNumber("prepaid")).toBe(true);
    expect(canActivateBookedNumber("postpaid")).toBe(false);
    expect(canActivateBookedNumber("basic-postpaid")).toBe(false);
  });
});