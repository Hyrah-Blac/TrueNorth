import { LayoutDashboard, PlaneTakeoff, FileText, Receipt, UserCircle } from "lucide-react";
import { getCurrentUserOrThrow } from "@/middleware/auth";
import { DashboardShell } from "@/components/layout/sidebar/DashboardShell";
import type { SidebarNavItem } from "@/components/layout/sidebar/DashboardSidebar";

const navItems: SidebarNavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Bookings", href: "/dashboard/bookings", icon: PlaneTakeoff },
  { label: "Quotes", href: "/dashboard/quotes", icon: FileText },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
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
