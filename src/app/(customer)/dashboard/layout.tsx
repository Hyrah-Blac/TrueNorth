import { getCurrentUserOrThrow } from "@/middleware/auth";
import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { Container } from "@/components/layout/container/Container";
import { SkipLink } from "@/components/shared/SkipLink";
import { siteConfig } from "@/lib/config/site";

// Customers reach their own data (Bookings, Quotes, Payments, Profile) as
// direct links inside the site's main nav menu, so these pages render
// inside the standard site Navbar/Footer — same light, editorial look as
// Fleet and Destinations — rather than a separate dashboard chrome.
export default async function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  await getCurrentUserOrThrow();

  return (
    <>
      <SkipLink />
      <Navbar phone={siteConfig.phone} />
      <main id="main-content" className="min-h-screen pt-28 lg:pt-32">
        <Container className="pb-16 lg:pb-24">{children}</Container>
      </main>
      <Footer />
    </>
  );
}