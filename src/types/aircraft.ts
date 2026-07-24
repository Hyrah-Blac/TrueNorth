import type { AircraftCategory, AircraftStatus } from "@/database/constants/aircraft";
import type { MissionType } from "@/database/constants/mission-type";

export interface IAircraftImage {
  url: string;
  publicId: string;
  caption?: string;
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
}

export interface AircraftFilters {
  category?: AircraftCategory;
  minPassengers?: number;
  mission?: MissionType;
  search?: string;
  page?: number;
  limit?: number;
}
