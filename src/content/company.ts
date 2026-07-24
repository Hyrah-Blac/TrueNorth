export const companyStats = [
  { value: "7", label: "Aircraft categories" },
  { value: "18+", label: "Destinations served" },
  { value: "24/7", label: "Dispatch desk" },
  { value: "KCAA", label: "AOC certified" },
] as const;

export const companyFacts = {
  foundedContext: "Operating scheduled and on-demand charter across Kenya and East Africa.",
  baseAirport: "Wilson Airport, Nairobi (WIL)",
  fleetCategories: [
    "Helicopters",
    "Executive turboprops",
    "Light business jets",
    "Utility aircraft",
    "Medical evacuation aircraft",
    "Safari aircraft",
    "Cargo aircraft",
  ],
} as const;
