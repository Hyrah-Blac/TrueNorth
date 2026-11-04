import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { JsonLd } from "@/components/shared/JsonLd";
import { SkipLink } from "@/components/shared/SkipLink";
import { FloatingActions } from "@/features/ai/components/FloatingActions";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { getOrganizationSchema } from "@/lib/seo/structuredData";
import { getSiteSettings } from "@/lib/config/siteSettings";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [organizationSchema, settings] = await Promise.all([getOrganizationSchema(), getSiteSettings()]);

  return (
    <>
      <JsonLd data={organizationSchema} />
      <SkipLink />
      <Navbar phone={settings.phone} />
      <main id="main-content">{children}</main>
      <Footer />
      <FloatingActions
        whatsapp={settings.whatsapp || settings.phone}
        aiEnabled={settings.ai.enabled}
        welcomeMessage={settings.ai.welcomeMessage}
        starterPrompts={settings.ai.starterPrompts}
      />
      <CookieConsentBanner />
    </>
  );
}