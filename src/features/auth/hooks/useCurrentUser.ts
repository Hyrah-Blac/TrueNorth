"use client";

import { useUser } from "@clerk/nextjs";
import { ROLES, type Role } from "@/database/constants/roles";

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser();

  const role = (user?.publicMetadata?.role as Role | undefined) ?? ROLES.CUSTOMER;

  return {
    user,
    isLoaded,
    isSignedIn,
    role,
    isAdmin: role === ROLES.ADMIN,
  };
}
