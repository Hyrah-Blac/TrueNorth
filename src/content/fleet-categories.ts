import type { AircraftCategory } from "@/database/constants/aircraft";

export interface FleetCategoryContent {
  category: AircraftCategory;
  label: string;
  shortLabel: string;
  description: string;
  bestFor: string;
}

export const fleetCategories: FleetCategoryContent[] = [
  {
    category: "helicopter",
    label: "Helicopters",
    shortLabel: "Helicopter",
    description:
      "Point-to-point access where there is no runway — site visits, VIP transfers, and survey work into terrain fixed-wing aircraft can't reach.",
    bestFor: "Mining sites, film locations, VIP transfers",
  },
  {
    category: "turboprop",
    label: "Executive Turboprops",
    shortLabel: "Turboprop",
    description:
      "The workhorse of regional business travel — short-field capable, efficient over Kenya's domestic routes, comfortable for small teams.",
    bestFor: "Business travel, government missions",
  },
  {
    category: "light_jet",
    label: "Light Business Jets",
    shortLabel: "Light Jet",
    description:
      "Faster cruise and a quieter cabin for longer regional legs across East Africa, without the cost of a heavy jet.",
    bestFor: "Cross-border executive travel",
  },
  {
    category: "heavy_jet",
    label: "Heavy Jet",
    shortLabel: "Heavy Jet",
    description:
      "Long-range cabins with the legs for intercontinental sectors and the space for a full team to work, sleep, or entertain in transit.",
    bestFor: "Intercontinental travel, large delegations",
  },
  {
    category: "utility",
    label: "Utility & Bush Aircraft",
    shortLabel: "Utility",
    description:
      "Rugged, dependable airframes built for unpaved strips, mixed passenger-and-cargo loads, and remote field operations.",
    bestFor: "Remote fieldwork, mixed cargo runs",
  },
  {
    category: "medevac",
    label: "Air Ambulance",
    shortLabel: "Air Ambulance",
    description:
      "Stretcher-configured aircraft with medical equipment mounts, on standby for time-critical patient transfers.",
    bestFor: "Emergency and inter-facility transfers",
  },
  {
    category: "safari",
    label: "Safari Aircraft",
    shortLabel: "Safari",
    description:
      "Scenic low-altitude flying into bush airstrips across Kenya's reserves and conservancies, sized for small tour groups.",
    bestFor: "Safari tourism, scenic charters",
  },
  {
    category: "cargo",
    label: "Freight Aircraft",
    shortLabel: "Freight",
    description:
      "Freight capacity for time-sensitive or oversized loads across the region — available on request.",
    bestFor: "Freight and logistics runs",
  },
];