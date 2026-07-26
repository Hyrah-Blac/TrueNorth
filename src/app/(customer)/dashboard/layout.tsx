// Server Component, so we pull from the /dist/ssr entry point rather than
// the default @phosphor-icons/react export — the default export assumes a
// client render tree and will warn/misbehave when it crosses the RSC
// boundary as a plain import (separate from the element-vs-reference issue
// below, but easy to hit at the same time).
import { SquaresFour, AirplaneTakeoff, FileText, Receipt, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { DashboardShell } from "@/components/layout/sidebar/DashboardShell";
import type { SidebarNavItem } from "@/components/layout/sidebar/DashboardSidebar";

const navItems: SidebarNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <SquaresFour aria-hidden="true" />, exact: true },
  { label: "Bookings", href: "/dashboard/bookings", icon: <AirplaneTakeoff aria-hidden="true" /> },
  { label: "Quotes", href: "/dashboard/quotes", icon: <FileText aria-hidden="true" /> },
  { label: "Payments", href: "/dashboard/payments", icon: <Receipt aria-hidden="true" /> },
  { label: "Profile", href: "/dashboard/profile", icon: <UserCircle aria-hidden="true" /> },
];

export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  // The edge middleware already blocks unauthenticated requests to
  // /dashboard/*; this re-check is the authoritative server-side
  // guard, and also ensures the account exists and is active before
  // rendering anything dashboard-related.
  await getCurrentUserOrThrow();

  return (
    <DashboardShell items={navItems} title="Dashboard">
      {children}
    </DashboardShell>
  );
}