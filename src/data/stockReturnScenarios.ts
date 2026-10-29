// Stock Return demo scenarios — the five user contexts a tester can preview from Home's
// Stock Return entry sheet. Every scenario runs the exact same Stock Return screens and
// workflow; only the demo user and their mock locations change. `role` and `locationMode`
// are kept as separate fields so future role-specific tweaks can branch on them without
// restructuring, but nothing branches on them yet — do not add per-role UI here until the
// business defines it.

export type StockReturnRole = "dealer" | "teamLeader" | "accountManager";
export type StockReturnLocationMode = "single" | "multi";

export type StockReturnScenarioId = "dealerSingle" | "dealerMulti" | "teamLeaderSingle" | "teamLeaderMulti" | "accountManager";

export interface StockReturnScenario {
  id: StockReturnScenarioId;
  role: StockReturnRole;
  locationMode: StockReturnLocationMode;
  user: { name: string; code: string };
  locations: string[];
}

export const STOCK_RETURN_SCENARIOS: StockReturnScenario[] = [
  { id: "dealerSingle", role: "dealer", locationMode: "single", user: { name: "Hamza Tarkan", code: "DLR-123456" }, locations: ["Riyadh – Olaya Branch"] },
  { id: "dealerMulti", role: "dealer", locationMode: "multi", user: { name: "Hamza Tarkan", code: "DLR-123456" }, locations: ["Riyadh – Olaya Branch", "Jeddah – Tahlia Branch", "Dammam – Corniche Branch"] },
  { id: "teamLeaderSingle", role: "teamLeader", locationMode: "single", user: { name: "Noura Alqahtani", code: "TL-204517" }, locations: ["Riyadh Warehouse"] },
  { id: "teamLeaderMulti", role: "teamLeader", locationMode: "multi", user: { name: "Noura Alqahtani", code: "TL-204517" }, locations: ["Riyadh Warehouse", "Jeddah Warehouse", "Khobar Warehouse"] },
  { id: "accountManager", role: "accountManager", locationMode: "multi", user: { name: "Ahmed Al-Otaibi", code: "AM-310982" }, locations: ["Riyadh Warehouse", "Jeddah Warehouse", "Dammam Warehouse", "Medina Warehouse"] },
];

// Where returned stock can be sent back to — shared by every scenario.
export const STOCK_RETURN_DESTINATIONS = [
  "Riyadh Central Warehouse",
  "Jeddah Returns Center",
  "Dammam Distribution Center",
  "Medina Regional Warehouse",
  "Head Office – Riyadh",
];

// Dealers and Team Leaders pick a Location & Destination before choosing products; Account
// Manager keeps the original flow for now. One Location shows its location read-only.
export const usesLocationStep = (s: StockReturnScenario) => s.role !== "accountManager";

const STORAGE_KEY = "stockReturnScenario";

export const getStockReturnScenario = (): StockReturnScenario => {
  let id: string | null = null;
  try { id = sessionStorage.getItem(STORAGE_KEY); } catch {}
  return STOCK_RETURN_SCENARIOS.find((s) => s.id === id) ?? STOCK_RETURN_SCENARIOS[0];
};

export const setStockReturnScenario = (id: StockReturnScenarioId) => {
  try { sessionStorage.setItem(STORAGE_KEY, id); } catch {}
};
