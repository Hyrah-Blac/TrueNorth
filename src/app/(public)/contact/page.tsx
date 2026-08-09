import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import Image from "next/image";
import { Phone, WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
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
    <div className="flex flex-col gap-4 border-b border-navy-900/10 py-7 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <div
          className={`font-editorial mt-2 break-words font-light leading-snug text-navy-900 ${
            emphasize ? "text-lg sm:text-xl" : "text-base sm:text-lg"
          }`}
        >
          {children}
        </div>
        {caption ? <p className="mt-1.5 text-xs text-slate-500">{caption}</p> : null}
      </div>
      <Button
        href={href}
        variant="outline"
        size="sm"
        icon={<IconComponent className="h-3.5 w-3.5" weight="light" aria-hidden="true" />}
        className="w-full shrink-0 whitespace-nowrap bg-white/70 hover:!translate-y-0 hover:!border-slate-300 hover:!text-navy-900 sm:w-36"
      >
        {actionLabel}
      </Button>
    </div>
  );
}

function CompassMark() {
  return (
    <svg
      viewBox="0 0 240 240"
      className="pointer-events-none absolute -right-6 -top-8 hidden h-48 w-48 text-navy-900/[0.05] sm:block sm:h-56 sm:w-56 lg:-right-10 lg:-top-10 lg:h-64 lg:w-64"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="118" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="120" cy="120" r="90" fill="none" stroke="currentColor" strokeWidth="1" />
      <line x1="120" y1="6" x2="120" y2="234" stroke="currentColor" strokeWidth="1" />
      <line x1="6" y1="120" x2="234" y2="120" stroke="currentColor" strokeWidth="1" />
      <path d="M120 24 L131 120 L120 216 L109 120 Z" fill="currentColor" opacity="0.5" />
      <path d="M24 120 L120 131 L216 120 L120 109 Z" fill="currentColor" opacity="0.25" />
    </svg>
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
          little ambient life instead of sitting static. A soft white
          scrim keeps the navy copy legible everywhere, with an extra
          light band pinned to the very top so the transparent navbar's
          dark logo/links (see Navbar.tsx's isContactPage flag) always
          have a light surface to sit on, at every scroll position. */}
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src="/images/gallery/contact.jpg"
          alt=""
          fill
          priority
          className="animate-zoom-slow object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/72" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/95 to-transparent" />
      </div>

      {/* -mx-6 cancels Container's own mobile gutter so the panel runs
          edge-to-edge as a full-bleed frosted sheet on phones — the same
          "sheet below lg, inset card at lg" treatment used on
          request-charter, for a consistent premium feel across the
          site. It becomes a floating rounded card with its own shadow
          and hairline ring once there's room for it beside the photo. */}
      <Container className="relative pb-16 pt-28 sm:pb-20 sm:pt-32 lg:py-0">
        <div className="-mx-6 lg:mx-0">
          <div className="contact-fade relative overflow-hidden bg-white/65 lg:rounded-[28px] lg:shadow-lifted lg:ring-1 lg:ring-black/[0.04]">
            <div className="px-6 py-10 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
                <div className="relative lg:col-span-5">
                  <CompassMark />

                  <h1 className="font-display relative max-w-md text-[clamp(1.75rem,1.35rem+2vw,2.75rem)] font-extrabold uppercase leading-[1.12] tracking-tight text-navy-900">
                    Speak With Our <span className="text-champagne-600">Charter Team</span>
                  </h1>
                  <p className="relative mt-4 max-w-sm text-xs leading-relaxed text-slate-600 sm:text-sm">
                    Our concierge is available around the clock to arrange your
                    flight, answer fleet questions, or handle any request directly —
                    no forms, no waiting for a callback.
                  </p>

                  <div className="horizon-divider relative mt-10 lg:mt-14" />

                  <div className="relative mt-8 grid grid-cols-1 gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-8">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        Office
                      </p>
                      <div className="font-editorial mt-2 text-sm font-light leading-relaxed text-navy-900">
                        <span className="block">{settings.addressLine1}</span>
                        {settings.addressLine2 ? <span className="block">{settings.addressLine2}</span> : null}
                        <span className="block">{settings.city}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                        Hours
                      </p>
                      <p className="font-editorial mt-2 text-sm font-light text-navy-900">
                        {settings.operatingHours}
                      </p>
                      {settings.emergencyContact ? (
                        <>
                          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                            Emergency
                          </p>
                          <p className="font-editorial mt-2 text-sm font-light text-navy-900">
                            {settings.emergencyContact}
                          </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div
                  className="contact-fade lg:col-span-6 lg:col-start-7 lg:border-l lg:border-navy-900/10 lg:pl-16"
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
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}