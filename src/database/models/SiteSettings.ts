import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface SiteSettingsDocument extends Document {
  // Contact
  phone: string;
  email: string;
  whatsapp?: string;
  emergencyContact?: string;
  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  // Identity
  companyName: string;
  companyShortName?: string;
  companyDescription?: string;
  companyTagline?: string;
  // Operations
  operatingHours: string;
  // Social links (stored as key-value map)
  socialLinks: {
    platform: string;
    href: string;
    label: string;
  }[];
  // AI Concierge configuration — all optional; buildSystemPrompt() and
  // the frontend fall back to sensible defaults when unset so an admin
  // who never touches this section sees no behavior change.
  ai: {
    enabled: boolean;
    welcomeMessage?: string;
    tone?: string;
    fallbackMessage?: string;
    starterPrompts: string[];
    maxConversationLength?: number;
  };
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema(
  {
    platform: { type: String, required: true, trim: true, maxlength: 30 },
    href: { type: String, required: true, trim: true, maxlength: 300 },
    label: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { _id: false }
);

const SiteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    // Contact
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    whatsapp: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    // Address
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    // Identity
    companyName: { type: String, required: true, trim: true, maxlength: 150 },
    companyShortName: { type: String, trim: true, maxlength: 60 },
    companyDescription: { type: String, trim: true, maxlength: 500 },
    companyTagline: { type: String, trim: true, maxlength: 200 },
    // Operations
    operatingHours: { type: String, required: true, trim: true },
    // Social
    socialLinks: { type: [SocialLinkSchema], default: [] },
    // AI Concierge
    ai: {
      type: new Schema(
        {
          enabled: { type: Boolean, default: true },
          welcomeMessage: { type: String, trim: true, maxlength: 200 },
          tone: { type: String, trim: true, maxlength: 100 },
          fallbackMessage: { type: String, trim: true, maxlength: 300 },
          starterPrompts: { type: [String], default: [] },
          maxConversationLength: { type: Number, min: 5, max: 500 },
        },
        { _id: false }
      ),
      default: () => ({ enabled: true, starterPrompts: [] }),
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Enforced as a singleton at the application layer (see
// getSiteSettings/updateSiteSettings) rather than a schema-level
// constraint — always upsert against a fixed known _id.
export const SiteSettings: Model<SiteSettingsDocument> =
  models.SiteSettings || model<SiteSettingsDocument>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
