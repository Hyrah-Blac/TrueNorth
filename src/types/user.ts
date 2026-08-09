import type { Role } from "@/database/constants/roles";

export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  company?: string;
  role: Role;
  avatarUrl?: string;
  avatarPublicId?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}