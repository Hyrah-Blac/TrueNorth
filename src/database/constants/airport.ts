export const RUNWAY_SURFACES = {
  PAVED: "paved",
  GRASS: "grass",
  GRAVEL: "gravel",
  DIRT: "dirt",
  SAND: "sand",
  MIXED: "mixed",
} as const;

export type RunwaySurface = (typeof RUNWAY_SURFACES)[keyof typeof RUNWAY_SURFACES];

export const RUNWAY_SURFACE_VALUES = Object.values(RUNWAY_SURFACES) as RunwaySurface[];

export const RUNWAY_SURFACE_LABELS: Record<RunwaySurface, string> = {
  paved: "Paved",
  grass: "Grass",
  gravel: "Gravel",
  dirt: "Dirt",
  sand: "Sand",
  mixed: "Mixed",
};

export const AIRPORT_STATUSES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  RESTRICTED: "restricted",
} as const;

export type AirportStatus = (typeof AIRPORT_STATUSES)[keyof typeof AIRPORT_STATUSES];

export const AIRPORT_STATUS_VALUES = Object.values(AIRPORT_STATUSES) as AirportStatus[];

export const AIRPORT_STATUS_LABELS: Record<AirportStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  restricted: "Restricted",
};
