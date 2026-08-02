import type { RunwaySurface, AirportStatus } from "@/database/constants/airport";

export type { RunwaySurface, AirportStatus };

export interface IAirport {
  _id: string;
  icao: string;
  iata?: string;
  name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  runwayLengthM?: number;
  runwaySurface?: RunwaySurface;
  elevationFt?: number;
  fuelAvailable: boolean;
  nightOperations: boolean;
  customsAvailable: boolean;
  medicalSupport: boolean;
  notes?: string;
  status: AirportStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AirportFilters {
  status?: AirportStatus;
  country?: string;
  runwaySurface?: RunwaySurface;
  search?: string;
  fuelAvailable?: boolean;
  nightOperations?: boolean;
  customsAvailable?: boolean;
  page?: number;
  limit?: number;
}
