import { getCurrentUserOrThrow } from "@/middleware/auth";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { Container } from "@/components/layout/container/Container";
import { SkipLink } from "@/components/shared/SkipLink";
import { getSiteSettings } from "@/lib/config/siteSettings";

// Customers reach their own data (Bookings, Quotes, Payments, Profile) as
// direct links inside the site's main nav menu, so these pages render
// inside the standard site Navbar/Footer — same light, editorial look as
// Fleet and Destinations — rather than a separate dashboard chrome.
export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  await getCurrentUserOrThrow();
  // Admin-configured phone (Settings > General), matching the public
  // (marketing) layout — see app/(public)/layout.tsx. This previously
  // read the hardcoded site.ts fallback directly, so a phone number
  // changed in Settings showed correctly to visitors but not to
  // signed-in customers.
  const settings = await getSiteSettings();

  return (
    <>
      <SkipLink />
      <Navbar phone={settings.phone} />
      <main id="main-content" className="min-h-screen pt-28 lg:pt-32">
        <Container className="pb-16 lg:pb-24">{children}</Container>
      </main>
      <Footer />
    </>
  );
}