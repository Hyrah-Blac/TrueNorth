import { z } from "zod";
import { ROLE_VALUES } from "@/database/constants/roles";
import type { Role } from "@/database/constants/roles";

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{9,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  avatarUrl: z.string().trim().url().optional().or(z.literal("")),
  avatarPublicId: z.string().trim().optional().or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  role: z.enum(ROLE_VALUES as [Role, ...Role[]]),
});

export type UpdateUserRoleFormValues = z.infer<typeof updateUserRoleSchema>;