import { getCurrentUserOrThrow } from "@/middleware/auth";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { Container } from "@/components/layout/container/Container";
import { SkipLink } from "@/components/shared/SkipLink";
import { getSiteSettings } from "@/lib/config/siteSettings";

// Customers reach their own data (Bookings, Quotes, Payments) as
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
      <main id="main-content" className="relative min-h-screen pt-28 lg:pt-32">
        {/* Background photo for every customer dashboard page (Bookings,
            Quotes, Payments) — fixed so it doesn't
            scroll with the content, with a soft white wash over it so the
            navy-on-white text and white premium cards stay legible. Swap
            the file at public/images/gallery/sept.jpg to change it. */}
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/gallery/sept.jpg')" }}
          aria-hidden="true"
        />
        {/* Gradient wash rather than a flat tint — richer/darker toward the
            top (under the transparent navbar) fading to a lighter wash
            further down, so the photo reads with some depth instead of
            looking uniformly pale. Page content sits in its own frosted
            glass panel (see each dashboard page) rather than directly on
            this wash, so text stays legible regardless. */}
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-white/70 via-white/80 to-white/92"
          aria-hidden="true"
        />
        <Container className="pb-16 lg:pb-24">{children}</Container>
      </main>
      <Footer />
    </>
  );
}