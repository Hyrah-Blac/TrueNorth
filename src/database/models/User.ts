import { Schema, model, models, type Model, type Document } from "mongoose";
import { ROLE_VALUES, ROLES, type Role } from "../constants/roles";
import { softDeletePlugin, type SoftDeleteFields, type SoftDeleteMethods } from "../plugins/softDelete";

export interface UserDocument
  extends Document,
    SoftDeleteFields,
    SoftDeleteMethods<UserDocument> {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  role: Role;
  avatarUrl?: string;
  // Cloudinary public_id for the user-uploaded avatar (undefined when the
  // avatar still comes from Clerk's default image_url, e.g. right after
  // sign-up before the user has picked their own photo). Needed so we can
  // delete the old Cloudinary asset when the user replaces their avatar.
  avatarPublicId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    clerkId: {
      type: String,
      required: [true, "Clerk ID is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{9,15}$/, "Invalid phone number"],
    },
    company: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.CUSTOMER,
      required: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    avatarPublicId: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

UserSchema.plugin(softDeletePlugin);

UserSchema.index({ role: 1, isDeleted: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.virtual("fullName").get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export const User: Model<UserDocument> = models.User || model<UserDocument>("User", UserSchema);

export default User;