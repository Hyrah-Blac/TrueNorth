import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import {
  AIRCRAFT_CATEGORY_VALUES,
  AIRCRAFT_STATUS_VALUES,
  AIRCRAFT_STATUSES,
  type AircraftCategory,
  type AircraftStatus,
} from "../constants/aircraft";
import { MISSION_TYPE_VALUES, type MissionType } from "../constants/mission-type";
import { slugPlugin } from "../plugins/slug";
import { softDeletePlugin, type SoftDeleteFields, type SoftDeleteMethods } from "../plugins/softDelete";

export interface AircraftImage {
  url: string;
  publicId: string;
  caption?: string;
}

export interface AircraftDocument
  extends Omit<Document, "model">,
    SoftDeleteFields,
    SoftDeleteMethods<AircraftDocument> {
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
  heroImage?: AircraftImage;
  exteriorImages: AircraftImage[];
  interiorImages: AircraftImage[];
  cabinImages: AircraftImage[];
  status: AircraftStatus;
  isFeatured: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AircraftImageSchema = new Schema<AircraftImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, maxlength: 150 },
  },
  { _id: false }
);

const AircraftSchema = new Schema<AircraftDocument>(
  {
    name: {
      type: String,
      required: [true, "Aircraft name is required"],
      trim: true,
      maxlength: 100,
    },
    slug: { type: String }, // populated by slugPlugin
    category: {
      type: String,
      enum: AIRCRAFT_CATEGORY_VALUES,
      required: [true, "Aircraft category is required"],
      index: true,
    },
    manufacturer: { type: String, required: true, trim: true, maxlength: 100 },
    model: { type: String, required: true, trim: true, maxlength: 100 },
    registration: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    tagline: { type: String, trim: true, maxlength: 150 },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 3000,
    },
    passengerCapacity: {
      type: Number,
      required: [true, "Passenger capacity is required"],
      min: [1, "Passenger capacity must be at least 1"],
    },
    luggageCapacityKg: { type: Number, required: true, min: 0 },
    rangeNm: { type: Number, required: [true, "Range is required"], min: 0 },
    cruisingSpeedKts: { type: Number, required: [true, "Cruising speed is required"], min: 0 },
    cabinHeightM: { type: Number, min: 0 },
    cabinWidthM: { type: Number, min: 0 },
    cabinLengthM: { type: Number, min: 0 },
    amenities: {
      type: [String],
      default: [],
      validate: {
        validator: (value: string[]) => value.length <= 30,
        message: "A maximum of 30 amenities can be listed",
      },
    },
    recommendedMissions: {
      type: [String],
      enum: MISSION_TYPE_VALUES,
      default: [],
    },
    baseAirportCode: {
      type: String,
      required: [true, "Base airport code is required"],
      trim: true,
      uppercase: true,
      maxlength: 4,
    },
    heroImage: { type: AircraftImageSchema, default: undefined },
    exteriorImages: { type: [AircraftImageSchema], default: [] },
    interiorImages: { type: [AircraftImageSchema], default: [] },
    cabinImages: { type: [AircraftImageSchema], default: [] },
    status: {
      type: String,
      enum: AIRCRAFT_STATUS_VALUES,
      default: AIRCRAFT_STATUSES.ACTIVE,
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

AircraftSchema.plugin(slugPlugin, { source: "name" });
AircraftSchema.plugin(softDeletePlugin);

AircraftSchema.index({ category: 1, status: 1, isDeleted: 1 });
AircraftSchema.index({ passengerCapacity: 1 });
AircraftSchema.index({ name: "text", description: "text", manufacturer: "text" });

export const Aircraft: Model<AircraftDocument> =
  models.Aircraft || model<AircraftDocument>("Aircraft", AircraftSchema);

export default Aircraft;
