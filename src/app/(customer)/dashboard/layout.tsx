import { getCurrentUserOrThrow } from "@/middleware/auth";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { Container } from "@/components/layout/container/Container";
import { SkipLink } from "@/components/shared/SkipLink";
import { siteConfig } from "@/lib/config/site";

// Dashboards are admin-only now — DashboardShell/DashboardSidebar (the
// sidebar-driven shell) are reserved for the (admin) route group.
// Customers reach their own data (Bookings, Quotes, Payments, Profile)
// as direct links inside the site's main nav menu instead of a sidebar,
// so these pages now render inside the standard site Navbar/Footer
// rather than a separate dashboard chrome.
export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  // The edge middleware already blocks unauthenticated requests to
  // /dashboard/*; this re-check is the authoritative server-side guard,
  // and also ensures the account exists and is active before rendering
  // anything account-related.
  await getCurrentUserOrThrow();

  return (
    <>
      <SkipLink />
      <Navbar phone={siteConfig.phone} />
      <main id="main-content" className="min-h-screen bg-navy-950 pt-8 lg:pt-14">
        <Container className="pb-16 lg:pb-24">{children}</Container>
      </main>
      <Footer />
    </>
  );
}