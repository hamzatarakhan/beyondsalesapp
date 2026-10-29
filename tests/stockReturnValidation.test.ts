import { describe, expect, test } from "bun:test";
import { expandSerialRange, offsetSerial, quantityError, remarkError, serialCountError, serialError, serialRangeError } from "../src/lib/stockReturnValidation";

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
  test("submit requires a serial for every unit returned", () => {
    expect(serialCountError(4, 9)).toBe("serialsShort");
    expect(serialCountError(0, 9)).toBe("serialsShort");
    expect(serialCountError(9, 9)).toBeUndefined();
  });
  test("remark is required only when the reason is Others", () => {
    expect(remarkError("others", "")).toBe("remarkRequired");
    expect(remarkError("others", "   ")).toBe("remarkRequired");
    expect(remarkError("others", "Box arrived crushed")).toBeUndefined();
    expect(remarkError("damagedSim", "")).toBeUndefined();
  });
});

describe("Stock Return range scan", () => {
  test("expands first to last inclusive, keeping prefix and padding", () => {
    expect(expandSerialRange("SN-VMSIM-0098", "SN-VMSIM-0101")).toEqual(["SN-VMSIM-0098", "SN-VMSIM-0099", "SN-VMSIM-0100", "SN-VMSIM-0101"]);
    expect(expandSerialRange("3676837484836", "3676837484838")).toEqual(["3676837484836", "3676837484837", "3676837484838"]);
  });
  test("rejects ranges that cannot be expanded", () => {
    expect(serialRangeError("SN-VMSIM-3000", "SN-ROUTER-3005", [], 100)).toBe("rangeMismatch");
    expect(serialRangeError("SN-VMSIM-3005", "SN-VMSIM-3000", [], 100)).toBe("rangeOrder");
    expect(serialRangeError("SN-VMSIM-3000", "SN-VMSIM-3200", [], 100)).toBe("quantityLimit");
    expect(serialRangeError("SN-VMSIM-3000", "SN-VMSIM-3004", ["SN-VMSIM-3002"], 100)).toBe("rangeOverlap");
    expect(serialRangeError("SN-VMSIM-3000", "SN-VMSIM-3004", [], 100)).toBeUndefined();
  });
  test("offsets a serial for the prototype scan button", () => {
    expect(offsetSerial("SN-VMSIM-3000", 4)).toBe("SN-VMSIM-3004");
  });
});
