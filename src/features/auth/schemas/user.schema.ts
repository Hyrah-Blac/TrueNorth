import { z } from "zod";
import { ROLE_VALUES } from "@/database/constants/roles";
import type { Role } from "@/database/constants/roles";

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  role: z.enum(ROLE_VALUES as [Role, ...Role[]]),
});

export type UpdateUserRoleFormValues = z.infer<typeof updateUserRoleSchema>;