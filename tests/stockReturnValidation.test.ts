import { describe, expect, test } from "bun:test";
import { quantityError, serialError } from "../src/lib/stockReturnValidation";

describe("Stock Return validation", () => {
  test("requires a positive quantity", () => {
    expect(quantityError("0", 10, 0)).toBe("quantityRequired");
    expect(quantityError("1", 10, 0)).toBeUndefined();
  });
  test("does not reinterpret negative or decimal quantities", () => {
    expect(quantityError("-2", 10, 0)).toBe("quantityInvalid");
    expect(quantityError("1.5", 20, 0)).toBe("quantityInvalid");
  });
  test("quantity cannot exceed available stock", () => {
    expect(quantityError("11", 10, 0)).toBe("quantityLimit");
    expect(quantityError("10", 10, 0)).toBeUndefined();
  });
  test("quantity cannot exclude already added serials", () => {
    expect(quantityError("1", 10, 2)).toBe("quantityScanned");
    expect(quantityError("2", 10, 2)).toBeUndefined();
  });
  test("duplicate serial entries are rejected without changing the list", () => {
    const serials = ["SN-123"];
    expect(serialError(" sn-123 ", serials, 10)).toBe("serialDuplicate");
    expect(serials).toEqual(["SN-123"]);
    expect(serialError("SN-124", serials, 10)).toBeUndefined();
  });
  test("malformed serials are rejected before duplicate and limit checks", () => {
    expect(serialError("ab", [], 10)).toBe("serialInvalid");
    expect(serialError("has space", [], 10)).toBe("serialInvalid");
    expect(serialError("SN-123#$", [], 10)).toBe("serialInvalid");
    expect(serialError("S".repeat(25), [], 10)).toBe("serialInvalid");
    expect(serialError("SN-VMSIM-3000", [], 10)).toBeUndefined();
    expect(serialError("SN-123", [], 10)).toBeUndefined();
  });
  test("adding serials cannot exceed stock availability", () => {
    expect(serialError("SN-124", ["SN-123"], 1)).toBe("quantityLimit");
  });
});