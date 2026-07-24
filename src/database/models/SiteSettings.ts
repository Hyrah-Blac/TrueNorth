import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface SiteSettingsDocument extends Document {
  phone: string;
  email: string;
  whatsapp?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  operatingHours: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    operatingHours: { type: String, required: true, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Enforced as a singleton at the application layer (see
// getSiteSettings/updateSiteSettings) rather than a schema-level
// constraint — Mongoose has no native "max one document" validator,
// and a unique index on a constant field is a common workaround, but
// simpler to just always upsert against a fixed known _id.

export const SiteSettings: Model<SiteSettingsDocument> =
  models.SiteSettings || model<SiteSettingsDocument>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
