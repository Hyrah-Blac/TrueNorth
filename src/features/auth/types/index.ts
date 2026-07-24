import type { Role } from "@/database/constants/roles";

export interface AuthSession {
  clerkId: string;
  role: Role;
}

export interface UpdateUserRoleInput {
  userId: string;
  role: Role;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
