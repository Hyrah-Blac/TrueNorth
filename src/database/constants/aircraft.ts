export const AIRCRAFT_CATEGORIES = {
  HELICOPTER: "helicopter",
  TURBOPROP: "turboprop",
  LIGHT_JET: "light_jet",
  UTILITY: "utility",
  MEDEVAC: "medevac",
  SAFARI: "safari",
  CARGO: "cargo",
} as const;

export type AircraftCategory = (typeof AIRCRAFT_CATEGORIES)[keyof typeof AIRCRAFT_CATEGORIES];

export const AIRCRAFT_CATEGORY_VALUES = Object.values(AIRCRAFT_CATEGORIES) as AircraftCategory[];

export const AIRCRAFT_CATEGORY_LABELS: Record<AircraftCategory, string> = {
  helicopter: "Helicopter",
  turboprop: "Executive Turboprop",
  light_jet: "Light Business Jet",
  utility: "Utility Aircraft",
  medevac: "Medical Evacuation",
  safari: "Safari Aircraft",
  cargo: "Cargo Aircraft",
};

export const AIRCRAFT_STATUSES = {
  ACTIVE: "active",
  MAINTENANCE: "maintenance",
  INACTIVE: "inactive",
} as const;

export type AircraftStatus = (typeof AIRCRAFT_STATUSES)[keyof typeof AIRCRAFT_STATUSES];

export const AIRCRAFT_STATUS_VALUES = Object.values(AIRCRAFT_STATUSES) as AircraftStatus[];

export const AIRCRAFT_STATUS_LABELS: Record<AircraftStatus, string> = {
  active: "Active",
  maintenance: "In Maintenance",
  inactive: "Inactive",
};

