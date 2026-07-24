export const MISSION_TYPES = {
  BUSINESS: "business",
  GOVERNMENT: "government",
  NGO_HUMANITARIAN: "ngo_humanitarian",
  MEDICAL_EVACUATION: "medical_evacuation",
  SAFARI_TOURISM: "safari_tourism",
  VIP_TRANSPORT: "vip_transport",
  MINING_INDUSTRIAL: "mining_industrial",
  FILM_MEDIA: "film_media",
  CARGO: "cargo",
  EMERGENCY: "emergency",
  OTHER: "other",
} as const;

export type MissionType = (typeof MISSION_TYPES)[keyof typeof MISSION_TYPES];

export const MISSION_TYPE_VALUES = Object.values(MISSION_TYPES) as MissionType[];

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  business: "Business Charter",
  government: "Government",
  ngo_humanitarian: "NGO / Humanitarian",
  medical_evacuation: "Medical Evacuation",
  safari_tourism: "Safari & Tourism",
  vip_transport: "VIP Transport",
  mining_industrial: "Mining / Industrial",
  film_media: "Film & Media Production",
  cargo: "Cargo",
  emergency: "Emergency Flight",
  other: "Other",
};

