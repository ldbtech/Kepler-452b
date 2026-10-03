// Three fake dealership accounts for the prototype — each with its own
// buying focus and guardrails, used to personalize recommendations, bidding
// limits, and the demo purchase/watchlist history. No real backend/auth;
// session is just a signed-free cookie holding the dealer id (prototype only).
export type RiskTolerance = "Low" | "Low – Moderate" | "Moderate" | "Moderate – High";

export type Dealer = {
  id: string;
  name: string;
  initials: string;
  location: string;
  password: string;
  focusMakes: string[];
  focusCategories: string[]; // matches Vehicle.vehicleCategory values
  maxBidPerVehicle: number;
  totalBudgetCap: number;
  riskTolerance: RiskTolerance;
  interventionPreference: string;
  accent: string;
};

export const DEALERS: Dealer[] = [
  {
    id: "sunrise-motors",
    name: "Sunrise Motors",
    initials: "SM",
    location: "Phoenix, AZ",
    password: "sunrise",
    focusMakes: ["HONDA", "NISSAN", "KIA", "HYUNDAI", "TOYOTA"],
    focusCategories: ["SEDAN", "AUTOMOBILE"],
    maxBidPerVehicle: 8500,
    totalBudgetCap: 60000,
    riskTolerance: "Low – Moderate",
    interventionPreference: "Only if flagged",
    accent: "#3b82f6",
  },
  {
    id: "ridgeway-auto",
    name: "Ridgeway Auto Group",
    initials: "RA",
    location: "Columbus, OH",
    password: "ridgeway",
    focusMakes: ["FORD", "RAM", "CHEVROLET"],
    focusCategories: ["PICKUP", "SUV"],
    maxBidPerVehicle: 16000,
    totalBudgetCap: 220000,
    riskTolerance: "Moderate",
    interventionPreference: "Ask for high-value bids",
    accent: "#f97316",
  },
  {
    id: "coastal-wholesale",
    name: "Coastal Wholesale",
    initials: "CW",
    location: "Jacksonville, FL",
    password: "coastal",
    focusMakes: ["NISSAN", "KIA", "ISUZU"],
    focusCategories: ["SUV", "MEDIUM DUTY/BOX TRUCKS", "VAN"],
    maxBidPerVehicle: 6000,
    totalBudgetCap: 40000,
    riskTolerance: "Low",
    interventionPreference: "Manual approval for all",
    accent: "#10b981",
  },
];

export function getDealer(id: string | undefined): Dealer | undefined {
  return DEALERS.find((d) => d.id === id);
}
