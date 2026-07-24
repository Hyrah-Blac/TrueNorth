"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { Role } from "@/database/constants/roles";
import { Unauthorized } from "./Unauthorized";

interface RoleGuardProps {
  allow: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Client-side convenience guard for hiding/showing UI by role.
 * This is a UX nicety only — the actual security boundary is the
 * server-side requireAuth()/requireAdmin() checks in every action
 * and API route. Never rely on RoleGuard alone to protect data.
 */
export function RoleGuard({ allow, children, fallback }: RoleGuardProps) {
  const { role, isLoaded } = useCurrentUser();

  if (!isLoaded) {
    return null;
  }

  if (!allow.includes(role)) {
    return fallback ?? <Unauthorized />;
  }

  return <>{children}</>;
}
