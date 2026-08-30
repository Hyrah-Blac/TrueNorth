import type { CSSProperties } from "react";
import {
  SquaresFour,
  AirplaneTakeoff,
  CalendarCheck,
  FileText,
  Receipt,
  Users,
  Gear,
  MapPin,
  BookOpen,
} from "@phosphor-icons/react/dist/ssr";
import { requireAdmin } from "@/middleware/admin";
import { DashboardShell } from "@/components/layout/sidebar/DashboardShell";
import type { SidebarNavItem } from "@/components/layout/sidebar/DashboardSidebar";

const navItems: SidebarNavItem[] = [
  { label: "Overview",      href: "/admin/dashboard",      icon: <SquaresFour aria-hidden="true" />, exact: true },
  { label: "Aircraft",      href: "/admin/aircraft",       icon: <AirplaneTakeoff aria-hidden="true" /> },
  { label: "Airports",      href: "/admin/airports",       icon: <MapPin aria-hidden="true" /> },
  { label: "Knowledge Base",href: "/admin/knowledge-base", icon: <BookOpen aria-hidden="true" /> },
  { label: "Bookings",      href: "/admin/bookings",       icon: <CalendarCheck aria-hidden="true" /> },
  { label: "Quotes",        href: "/admin/quotes",         icon: <FileText aria-hidden="true" /> },
  { label: "Payments",      href: "/admin/payments",       icon: <Receipt aria-hidden="true" /> },
  { label: "Customers",     href: "/admin/customers",      icon: <Users aria-hidden="true" /> },
];

const footerNavItems: SidebarNavItem[] = [
  { label: "Settings", href: "/admin/settings", icon: <Gear aria-hidden="true" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <DashboardShell items={navItems} footerItems={footerNavItems} title="Admin">
      <div style={{ "--font-editorial": "var(--font-dashboard-serif)" } as CSSProperties}>
        {children}
      </div>
    </DashboardShell>
  );
}