import type { AircraftCategory, AircraftStatus } from "@/database/constants/aircraft";
import type { MissionType } from "@/database/constants/mission-type";

export interface IAircraftImage {
  url: string;
  publicId: string;
  caption?: string;
}

export interface IPassengerRange {
  min: number;
  max: number;
}

export interface IFlightRange {
  minNm: number;
  maxNm: number;
}

export interface IAircraft {
  _id: string;
  name: string;
  slug: string;
  category: AircraftCategory;
  manufacturer: string;
  model: string;
  registration: string;
  tagline?: string;
  description: string;
  passengerCapacity: number;
  luggageCapacityKg: number;
  rangeNm: number;
  cruisingSpeedKts: number;
  cabinHeightM?: number;
  cabinWidthM?: number;
  cabinLengthM?: number;
  amenities: string[];
  recommendedMissions: MissionType[];
  baseAirportCode: string;
  heroImage?: IAircraftImage;
  exteriorImages: IAircraftImage[];
  interiorImages: IAircraftImage[];
  cabinImages: IAircraftImage[];
  status: AircraftStatus;
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // ── AI Concierge fields ──────────────────────────────────────────────────
  minimumRunwayLength?: number;
  preferredRunwaySurface?: string;
  luxuryLevel?: number;
  executiveRating?: number;
  petFriendly?: boolean;
  wifiAvailable?: boolean;
  baggageFlexibility?: string;
  shortRunwayCapable?: boolean;
  aiStrengths: string[];
  aiLimitations: string[];
  aiNotes?: string;
  recommendedMissionTypes: MissionType[];
  recommendedPassengerRange?: IPassengerRange;
  recommendedFlightRange?: IFlightRange;
  operatingRegions: string[];
}

export interface AircraftFilters {
  category?: AircraftCategory;
  minPassengers?: number;
  mission?: MissionType;
  search?: string;
  page?: number;
  limit?: number;
}
