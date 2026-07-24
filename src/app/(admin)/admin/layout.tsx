import {
  LayoutDashboard,
  PlaneTakeoff,
  CalendarCheck,
  FileText,
  Receipt,
  Users,
  Settings,
} from "lucide-react";
import { requireAdmin } from "@/middleware/admin";
import { DashboardShell } from "@/components/layout/sidebar/DashboardShell";
import type { SidebarNavItem } from "@/components/layout/sidebar/DashboardSidebar";

const navItems: SidebarNavItem[] = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Aircraft", href: "/admin/aircraft", icon: PlaneTakeoff },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { label: "Quotes", href: "/admin/quotes", icon: FileText },
  { label: "Payments", href: "/admin/payments", icon: Receipt },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Edge middleware already redirects non-admins away from /admin/*;
  // this is the authoritative server-side check, matching the pattern
  // used by every admin server action and API route.
  await requireAdmin();

  return (
    <DashboardShell items={navItems} title="Admin">
      {children}
    </DashboardShell>
  );
}