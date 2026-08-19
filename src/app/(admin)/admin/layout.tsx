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
  { label: "Overview", href: "/admin/dashboard", icon: <SquaresFour aria-hidden="true" />, exact: true },
  { label: "Aircraft", href: "/admin/aircraft", icon: <AirplaneTakeoff aria-hidden="true" /> },
  { label: "Airports", href: "/admin/airports", icon: <MapPin aria-hidden="true" /> },
  { label: "Knowledge Base", href: "/admin/knowledge-base", icon: <BookOpen aria-hidden="true" /> },
  { label: "Bookings", href: "/admin/bookings", icon: <CalendarCheck aria-hidden="true" /> },
  { label: "Quotes", href: "/admin/quotes", icon: <FileText aria-hidden="true" /> },
  { label: "Payments", href: "/admin/payments", icon: <Receipt aria-hidden="true" /> },
  { label: "Customers", href: "/admin/customers", icon: <Users aria-hidden="true" /> },
  { label: "Settings", href: "/admin/settings", icon: <Gear aria-hidden="true" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Edge middleware already redirects non-admins away from /admin/*;
  // this is the authoritative server-side check, matching the pattern
  // used by every admin server action and API route.
  await requireAdmin();

  return (
    <DashboardShell items={navItems} title="Admin">
      {/* Every `font-editorial` class in the admin subtree (row names in
          AdminQuoteRow/AdminBookingRow/AdminPaymentRow, PageHeader titles)
          resolves through --font-editorial. Re-point it to the shared
          Fraunces variable here, same as the customer dashboard/quotes,
          bookings, payments, and profile layouts — otherwise it silently
          falls back to the root Poppins value and rows lose the serif
          treatment they were styled to match. */}
      <div style={{ "--font-editorial": "var(--font-dashboard-serif)" } as CSSProperties}>{children}</div>
    </DashboardShell>
  );
}
