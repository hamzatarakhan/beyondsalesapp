import type { Brand } from "@/contexts/BrandContext";
import { canActivateBookedNumber } from "./bookedNumber";

export const BOOKED_ACTIVATION_MODES = ["plan", "plan-topup", "topup", "none"] as const;
export type BookedActivationMode = typeof BOOKED_ACTIVATION_MODES[number];
export interface BookedActivationConfig {
  /** The one combination this brand runs for booked-number activation: "plan" (Only Plan),
      "plan-topup" (Plan with Top Up), "topup" (Only Top Up) or "none" (No Plan or Top Up). */
  mode: BookedActivationMode;
  enabledModes: readonly BookedActivationMode[];
  minPlanAmount: number;
  minTopupAmount: number;
}

// Independent brand configuration. Zero means no extra minimum has been specified.
export const BOOKED_ACTIVATION_CONFIG: Record<Brand, BookedActivationConfig> = {
  virgin: { mode: "plan", enabledModes: ["plan", "none"], minPlanAmount: 0, minTopupAmount: 0 },
  friendi: { mode: "plan", enabledModes: ["plan", "none"], minPlanAmount: 0, minTopupAmount: 0 },
};
export const bookedModeHasPlan = (mode: BookedActivationMode) => mode === "plan" || mode === "plan-topup";
export const bookedModeHasTopup = (mode: BookedActivationMode) => mode === "topup" || mode === "plan-topup";

export function validateBookedActivation(
  config: BookedActivationConfig,
  payType: string,
  mode: BookedActivationMode,
  planAmount: number | null,
  topupAmount: number,
): string[] {
  const errors: string[] = [];
  if (!canActivateBookedNumber(payType) || !config.enabledModes.includes(mode)) errors.push("unavailable");
  if (bookedModeHasPlan(mode)) {
    if (planAmount === null) errors.push("planRequired");
    else if (!Number.isFinite(planAmount) || planAmount < config.minPlanAmount) errors.push("planMinimum");
  }
  if (bookedModeHasTopup(mode) && (!Number.isFinite(topupAmount) || topupAmount <= 0 || topupAmount < config.minTopupAmount)) errors.push("topupMinimum");
  return errors;
}