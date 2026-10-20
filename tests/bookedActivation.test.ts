import { describe, expect, test } from "bun:test";
import { BOOKED_ACTIVATION_CONFIG, BOOKED_ACTIVATION_MODES, bookedModeHasPlan, bookedModeHasTopup, validateBookedActivation } from "../src/lib/bookedActivation";

for (const brand of ["virgin", "friendi"] as const) {
  for (const subscription of ["prepaid", "basic-postpaid"]) {
    describe(`${brand} ${subscription} booked activation`, () => {
      const config = BOOKED_ACTIVATION_CONFIG[brand];
      test("supports Only Plan", () => expect(validateBookedActivation(config, subscription, "plan", 30, 0)).toEqual([]));
      test("supports Plan with Top Up", () => expect(validateBookedActivation(config, subscription, "plan-topup", 30, 10)).toEqual([]));
      test("supports Only Top Up", () => expect(validateBookedActivation(config, subscription, "topup", null, 10)).toEqual([]));
      test("supports No Plan or Top Up", () => expect(validateBookedActivation(config, subscription, "none", null, 0)).toEqual([]));
    });
  }
}
test("Switch Postpaid is not eligible for any booked combination", () => {
  for (const mode of BOOKED_ACTIVATION_MODES) expect(validateBookedActivation(BOOKED_ACTIVATION_CONFIG.virgin, "postpaid", mode, 30, 10)).toContain("unavailable");
});
test("minimum plan amount is configurable", () => {
  const config = { ...BOOKED_ACTIVATION_CONFIG.virgin, minPlanAmount: 40 };
  expect(validateBookedActivation(config, "prepaid", "plan", 39, 0)).toContain("planMinimum");
  expect(validateBookedActivation(config, "prepaid", "plan", 40, 0)).toEqual([]);
});
test("minimum top-up amount is configurable", () => {
  const config = { ...BOOKED_ACTIVATION_CONFIG.friendi, minTopupAmount: 15 };
  expect(validateBookedActivation(config, "basic-postpaid", "plan-topup", 30, 14.99)).toContain("topupMinimum");
  expect(validateBookedActivation(config, "basic-postpaid", "plan-topup", 30, 15)).toEqual([]);
});
test("combinations can be disabled independently by brand", () => {
  const config = { ...BOOKED_ACTIVATION_CONFIG.virgin, enabledModes: ["plan"] as const };
  expect(validateBookedActivation(config, "prepaid", "none", null, 0)).toContain("unavailable");
  expect(validateBookedActivation(BOOKED_ACTIVATION_CONFIG.friendi, "prepaid", "none", null, 0)).toEqual([]);
});
test("required plan and top-up cannot be omitted or invalid", () => {
  const config = BOOKED_ACTIVATION_CONFIG.virgin;
  expect(validateBookedActivation(config, "prepaid", "plan", null, 0)).toContain("planRequired");
  for (const value of [0, -1, NaN, Infinity]) expect(validateBookedActivation(config, "prepaid", "topup", null, value)).toContain("topupMinimum");
});
// The Booked tab has no option picker: the page activates whatever config.mode says, so an
// invalid or disabled mode would silently break every booked activation.
test("each brand configures one enabled activation combination", () => {
  for (const brand of ["virgin", "friendi"] as const) {
    const config = BOOKED_ACTIVATION_CONFIG[brand];
    expect(BOOKED_ACTIVATION_MODES).toContain(config.mode);
    expect(config.enabledModes).toContain(config.mode);
  }
});
// The Booked tab reads these two predicates straight from the config to decide which section to
// lock, so a wrong mapping would silently let a dealer pick a plan or top-up the brand's option
// doesn't include.
test("option-to-section mapping keeps excluded sections unselectable", () => {
  expect(bookedModeHasPlan("plan")).toBe(true);
  expect(bookedModeHasTopup("plan")).toBe(false);
  expect(bookedModeHasPlan("topup")).toBe(false);
  expect(bookedModeHasTopup("topup")).toBe(true);
  expect(bookedModeHasPlan("plan-topup")).toBe(true);
  expect(bookedModeHasTopup("plan-topup")).toBe(true);
  expect(bookedModeHasPlan("none")).toBe(false);
  expect(bookedModeHasTopup("none")).toBe(false);
});
