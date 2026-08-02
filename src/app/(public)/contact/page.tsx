import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";
import { Phone, WhatsappLogo, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { Container } from "@/components/layout/container/Container";
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

function TextLink({
  href,
  icon: IconComponent,
  children,
}: {
  href: string;
  icon: Icon;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navy-900 transition-colors duration-300 hover:!text-[#4EA8DE]"
    >
      <IconComponent className="h-3.5 w-3.5 shrink-0" weight="light" aria-hidden="true" />
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#4EA8DE] transition-all duration-300 group-hover:w-full" />
      </span>
    </a>
  );
}

interface ContactRowProps {
  label: string;
  children: ReactNode;
  caption?: string;
  action?: ReactNode;
  emphasize?: boolean;
}

function ContactRow({ label, children, caption, action, emphasize }: ContactRowProps) {
  return (
    <div className="border-b border-slate-200 py-6 first:pt-0 last:border-b-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div
        className={`font-editorial mt-2 font-light leading-snug text-navy-900 ${
          emphasize ? "text-lg sm:text-xl" : "text-base sm:text-lg"
        }`}
      >
        {children}
      </div>
      {caption ? <p className="mt-1.5 text-xs text-slate-500">{caption}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

function CompassMark() {
  return (
    <svg
      viewBox="0 0 240 240"
      className="pointer-events-none absolute -right-10 -top-6 hidden h-56 w-56 text-navy-900/[0.06] sm:block sm:h-64 sm:w-64 lg:-right-16 lg:-top-10 lg:h-72 lg:w-72"
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
    <div className="overflow-hidden bg-white">
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

      <Container className="relative pb-16 pt-32 sm:pb-20 sm:pt-36 lg:pb-32 lg:pt-40">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-20">
          <div className="contact-fade relative lg:col-span-5">
            <CompassMark />
            <h1 className="font-display relative max-w-md text-2xl font-extrabold uppercase leading-[1.15] tracking-tight text-navy-900 sm:text-3xl lg:text-4xl">
              Speak With Our Charter Team
            </h1>
            <p className="relative mt-4 max-w-sm text-xs leading-relaxed text-slate-600 sm:mt-5 sm:text-sm">
              Our concierge is available around the clock to arrange your
              flight, answer fleet questions, or handle any request directly —
              no forms, no waiting for a callback.
            </p>

            <div className="contact-fade relative mt-10 lg:mt-14" style={{ animationDelay: "0.25s" }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                Office
              </p>
              <div className="font-editorial mt-2 text-sm font-light leading-relaxed text-navy-900">
                <span className="block">{settings.addressLine1}</span>
                {settings.addressLine2 ? <span className="block">{settings.addressLine2}</span> : null}
                <span className="block">{settings.city}</span>
              </div>
              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
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

          <div
            className="contact-fade lg:col-span-6 lg:col-start-7 lg:border-l lg:border-slate-200 lg:pl-16"
            style={{ animationDelay: "0.1s" }}
          >
            <ContactRow
              label="Call Us"
              caption="Available 24 hours"
              emphasize
              action={
                <TextLink href={`tel:${settings.phone}`} icon={Phone}>
                  Call
                </TextLink>
              }
            >
              {settings.phone}
            </ContactRow>

            <ContactRow
              label="WhatsApp"
              caption="Typically replies within minutes"
              emphasize
              action={
                <TextLink href={getWhatsAppHref(whatsappNumber)} icon={WhatsappLogo}>
                  WhatsApp
                </TextLink>
              }
            >
              {whatsappNumber}
            </ContactRow>

            <ContactRow
              label="Email"
              caption="For charter quotations and operational enquiries"
              emphasize
              action={
                <TextLink href={`mailto:${settings.email}`} icon={EnvelopeSimple}>
                  Email
                </TextLink>
              }
            >
              {settings.email}
            </ContactRow>
          </div>
        </div>
      </Container>
    </div>
  );
}
