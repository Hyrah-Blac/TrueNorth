import type { Metadata } from "next";
import { WhatsappLogo, Phone } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";
import { siteConfig } from "@/lib/config/site";

const description =
  "Get in touch with True North Charters via WhatsApp or phone for charter requests, fleet questions, or general inquiries.";

export const metadata: Metadata = {
  title: "Contact",
  description,
  openGraph: { title: "Contact | True North Charters", description },
  twitter: { title: "Contact | True North Charters", description },
};

// WhatsApp deep link needs digits only (country code + number, no spaces,
// no "+"). siteConfig.phone is formatted for display elsewhere, so strip
// everything but digits here — same approach as WhatsAppButton.tsx.
function getWhatsAppHref() {
  const digitsOnly = siteConfig.phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}`;
}

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden bg-slate-50 py-24 lg:py-32">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(15,42,67,0.06),transparent)]"
        aria-hidden="true"
      />

      <Container className="relative flex flex-col items-center text-center">
        <p className="spec-readout mb-4 text-xs font-medium uppercase tracking-widest2 text-sky-600">
          Get In Touch
        </p>
        <h1 className="font-editorial max-w-xl text-4xl font-light leading-[1.15] tracking-tight text-navy-900 lg:text-5xl">
          Talk to us directly on WhatsApp or by phone
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-600">
          For charter requests, fleet questions, or anything else — reach our
          team directly. No forms, no waiting for a callback.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
          <Button
            href={getWhatsAppHref()}
            variant="primary"
            size="lg"
            icon={<WhatsappLogo className="h-4 w-4" weight="fill" />}
          >
            Message on WhatsApp
          </Button>
          <Button
            href={`tel:${siteConfig.phone}`}
            variant="secondary"
            size="lg"
            icon={<Phone className="h-4 w-4" weight="thin" />}
          >
            Call {siteConfig.phone}
          </Button>
        </div>

        <p className="mt-10 text-sm text-slate-500">
          usually respond within the hour
        </p>
      </Container>
    </div>
  );
}