import { Navbar } from "@/components/layout/navbar/Navbar";
import { Footer } from "@/components/layout/footer/Footer";
import { JsonLd } from "@/components/shared/JsonLd";
import { SkipLink } from "@/components/shared/SkipLink";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { getOrganizationSchema } from "@/lib/seo/structuredData";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = await getOrganizationSchema();

  return (
    <>
      <JsonLd data={organizationSchema} />
      <SkipLink />
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}