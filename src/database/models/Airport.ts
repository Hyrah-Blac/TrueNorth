import { Schema, model, models, type Model, type Document } from "mongoose";
import {
  RUNWAY_SURFACE_VALUES,
  AIRPORT_STATUS_VALUES,
  AIRPORT_STATUSES,
  type RunwaySurface,
  type AirportStatus,
} from "../constants/airport";

export type { RunwaySurface, AirportStatus };

export interface AirportDocument extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const AirportSchema = new Schema<AirportDocument>(
  {
    icao: {
      type: String,
      required: [true, "ICAO code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 4,
      maxlength: 4,
      match: [/^[A-Z]{4}$/, "ICAO code must be exactly 4 uppercase letters"],
    },
    iata: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      sparse: true,
      match: [/^[A-Z]{3}$/, "IATA code must be exactly 3 uppercase letters"],
    },
    name: {
      type: String,
      required: [true, "Airport name is required"],
      trim: true,
      maxlength: 150,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 100,
    },
    latitude: {
      type: Number,
      required: [true, "Latitude is required"],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, "Longitude is required"],
      min: -180,
      max: 180,
    },
    runwayLengthM: { type: Number, min: 0 },
    runwaySurface: { type: String, enum: RUNWAY_SURFACE_VALUES },
    elevationFt: { type: Number },
    fuelAvailable: { type: Boolean, default: false },
    nightOperations: { type: Boolean, default: false },
    customsAvailable: { type: Boolean, default: false },
    medicalSupport: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: AIRPORT_STATUS_VALUES,
      default: AIRPORT_STATUSES.ACTIVE,
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AirportSchema.index({ country: 1, status: 1 });
AirportSchema.index({ name: "text", city: "text", country: "text", icao: "text", iata: "text" });

export const Airport: Model<AirportDocument> =
  models.Airport || model<AirportDocument>("Airport", AirportSchema);

export default Airport;
