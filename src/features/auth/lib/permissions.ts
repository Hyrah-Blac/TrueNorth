import { ROLES, type Role } from "@/database/constants/roles";

export function canAccessAdminDashboard(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function canManageAircraft(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function canApproveQuotes(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function canVerifyPayments(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function canManageUsers(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function isCustomer(role: Role): boolean {
  return role === ROLES.CUSTOMER;
}
