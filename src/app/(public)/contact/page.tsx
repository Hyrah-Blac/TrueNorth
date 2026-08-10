import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import { Phone, WhatsappLogo, EnvelopeSimple, MapPin, Clock } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/layout/container/Container";
import { Button } from "@/components/shared/buttons/Button";
import { getSiteSettings } from "@/lib/config/siteSettings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `Get in touch with ${settings.companyName} via WhatsApp or phone for charter requests, fleet questions, or general inquiries.`;

  return {
    title: "Contact",
    description,
    openGraph: { title: `Contact | ${settings.companyName}`, description },
    twitter: { title: `Contact | ${settings.companyName}`, description },
  };
}

// WhatsApp deep link needs digits only (country code + number, no spaces,
// no "+"). The admin-configured number is formatted for display elsewhere,
// so strip everything but digits here — same approach as WhatsAppButton.tsx.
function getWhatsAppHref(whatsapp: string) {
  const digitsOnly = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}`;
}

interface ContactRowProps {
  label: string;
  children: ReactNode;
  caption?: string;
  href: string;
  actionLabel: string;
  icon: Icon;
  emphasize?: boolean;
}

// Each method now reads as its own compact "instrument" — label, value,
// and a real tappable Button (44px+ target) instead of a small underlined
// text link, so the row holds up as a touch target on phones, not just a
// desktop hover affordance. Stacks to a column below `sm`, sits inline
// beside the value from `sm` up.
function ContactRow({ label, children, caption, href, actionLabel, icon: IconComponent, emphasize }: ContactRowProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-navy-900/10 py-6 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne-50 text-champagne-600">
            <IconComponent className="h-2.5 w-2.5" weight="light" aria-hidden="true" />
          </span>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
        </div>
        <div
          className={`font-editorial mt-2 break-words font-light leading-snug text-navy-900 ${
            emphasize ? "text-sm sm:text-base" : "text-xs sm:text-sm"
          }`}
        >
          {children}
        </div>
        {caption ? <p className="mt-1.5 text-[0.6875rem] text-slate-500">{caption}</p> : null}
      </div>
      <Button
        href={href}
        variant="outline"
        size="sm"
        icon={<IconComponent className="h-3 w-3" weight="light" aria-hidden="true" />}
        className="w-full shrink-0 whitespace-nowrap bg-white/70 !text-xs hover:!translate-y-0 hover:!border-slate-300 hover:!text-navy-900 sm:w-32"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappNumber = settings.whatsapp || settings.phone;

  return (
    <section className="relative min-h-dvh overflow-hidden bg-white lg:flex lg:min-h-screen lg:items-center lg:py-16">
      <style>{`
        @keyframes contactFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .contact-fade { animation: contactFadeIn 0.7s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .contact-fade { animation: none; }
        }
      `}</style>

      {/* Full-page background photo — a slow, continuous zoom (same
          animate-zoom-slow used on the other hero routes) gives it a
          little ambient life instead of sitting static. saturate/contrast
          keep the photo's actual color alive under the white scrim
          instead of reading as a flat grey wash. The scrim is light —
          just enough to keep the navy/slate copy legible directly on
          top of it, since there's no separate card panel dimming things
          further. A matching top/bottom fade grounds both edges of the
          section instead of the photo cutting off abruptly. */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/destinations/nairobi.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover [filter:saturate(1.25)_contrast(1.05)]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/65" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/95 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/70 to-transparent" />
      </div>


      {/* Content sits directly on the full-page photo/scrim behind it —
          no separate card panel, so the page reads as one continuous
          surface rather than a floating sheet on top of the photo. */}
      <Container className="relative pb-16 pt-28 sm:pb-20 sm:pt-32 lg:py-0">
        <div className="contact-fade relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
          <div className="relative lg:col-span-5">
            <h1 className="font-display relative max-w-md text-[clamp(1.5rem,1.2rem+1.4vw,2.125rem)] font-extrabold uppercase leading-[1.15] tracking-tight text-navy-900">
              Speak With Our <span className="text-champagne-600">Charter Team</span>
            </h1>
            <p className="relative mt-4 max-w-sm text-[0.6875rem] leading-relaxed text-slate-600 sm:text-xs">
              Our concierge is available around the clock to arrange your
              flight, answer fleet questions, or handle any request directly —
              no forms, no waiting for a callback.
            </p>

            <div className="horizon-divider relative mt-10 lg:mt-14" />

            <div className="relative mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-8">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-champagne-600" weight="light" aria-hidden="true" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    Office
                  </p>
                </div>
                <div className="font-editorial mt-2 text-xs font-light leading-relaxed text-navy-900">
                  <span className="block">{settings.addressLine1}</span>
                  {settings.addressLine2 ? <span className="block">{settings.addressLine2}</span> : null}
                  <span className="block">{settings.city}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-champagne-600" weight="light" aria-hidden="true" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                    Hours
                  </p>
                </div>
                <p className="font-editorial mt-2 text-xs font-light text-navy-900">
                  {settings.operatingHours}
                </p>
                {settings.emergencyContact ? (
                  <>
                    <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Emergency
                    </p>
                    <p className="font-editorial mt-2 text-xs font-light text-navy-900">
                      {settings.emergencyContact}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="lg:col-span-6 lg:col-start-7 lg:border-l lg:border-navy-900/10 lg:pl-16"
            style={{ animationDelay: "0.1s" }}
          >
            <ContactRow
              label="Call Us"
              caption="Available 24 hours"
              emphasize
              href={`tel:${settings.phone}`}
              actionLabel="Call"
              icon={Phone}
            >
              {settings.phone}
            </ContactRow>

            <ContactRow
              label="WhatsApp"
              caption="Typically replies within minutes"
              emphasize
              href={getWhatsAppHref(whatsappNumber)}
              actionLabel="WhatsApp"
              icon={WhatsappLogo}
            >
              {whatsappNumber}
            </ContactRow>

            <ContactRow
              label="Email"
              caption="For charter quotations and operational enquiries"
              emphasize
              href={`mailto:${settings.email}`}
              actionLabel="Email"
              icon={EnvelopeSimple}
            >
              {settings.email}
            </ContactRow>
          </div>
        </div>
      </Container>
    </section>
  );
}