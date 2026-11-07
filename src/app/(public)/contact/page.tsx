import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/container/Container";
import { ContactIllustration } from "@/components/contact/ContactIllustration";
import { JsonLd } from "@/components/shared/JsonLd";
import { getBreadcrumbSchema } from "@/lib/seo/structuredData";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { siteConfig } from "@/lib/config/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const description = `Get in touch with ${settings.companyName} via WhatsApp or phone for charter requests, fleet questions, or general inquiries.`;
  const ogImage = { url: `${siteConfig.url}/images/gallery/sept.jpg`, alt: `Contact ${settings.companyName}` };

  return {
    title: "Contact",
    description,
    alternates: { canonical: `${siteConfig.url}/contact` },
    openGraph: { title: `Contact | ${settings.companyName}`, description, images: [ogImage] },
    twitter: { title: `Contact | ${settings.companyName}`, description, images: [ogImage.url] },
  };
}

// WhatsApp deep link needs digits only (country code + number, no spaces,
// no "+"). The admin-configured number is formatted for display elsewhere,
// so strip everything but digits here — same approach as WhatsAppButton.tsx.
function getWhatsAppHref(whatsapp: string) {
  const digitsOnly = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}`;
}

interface Channel {
  key: string;
  label: string;
  href: string;
  title: string;
  lines: string[];
  hint: string;
  external?: boolean;
  logo: { src: string; width: number; height: number; className: string };
}

// One channel: a round full-colour logo with its label. It is a real link, so
// click/tap/Enter performs the action; hovering or keyboard-focusing it opens
// a small card with the details. `align` keeps the card inside the column.
function ChannelLink({ channel, align }: { channel: Channel; align: "left" | "right" }) {
  const { logo } = channel;
  const anchor = align === "left" ? "left-0" : "right-0";

  return (
    <li className="group/channel relative w-20">
      <a
        href={channel.href}
        {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        aria-label={`${channel.title}: ${channel.lines.join(", ")}`}
        className="flex flex-col items-center gap-3.5 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-950"
      >
        {/* White disc with a blush-tinted shadow (matches the illustration's
            shadows) that lifts a touch on hover/focus. */}
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-[0_1px_2px_rgba(155,63,99,0.1),0_10px_22px_-10px_rgba(155,63,99,0.42)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/channel:-translate-y-0.5 group-hover/channel:shadow-[0_2px_4px_rgba(155,63,99,0.1),0_18px_30px_-12px_rgba(155,63,99,0.5)] group-focus-within/channel:-translate-y-0.5 group-focus-within/channel:shadow-[0_2px_4px_rgba(155,63,99,0.1),0_18px_30px_-12px_rgba(155,63,99,0.5)]">
          {/* Light shine sweep, same treatment as the admin Save button. */}
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[rgba(240,196,214,0.55)] to-transparent transition-transform duration-700 ease-out group-hover/channel:translate-x-full group-focus-within/channel:translate-x-full"
            aria-hidden="true"
          />
          <Image src={logo.src} width={logo.width} height={logo.height} alt="" unoptimized className={`relative ${logo.className}`} />
        </span>
        {/* pl matches the tracking so the label stays optically centred under the disc. */}
        <span className="pl-[0.2em] text-[0.625rem] font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors duration-300 group-hover/channel:text-navy-950 group-focus-within/channel:text-navy-950">
          {channel.label}
        </span>
      </a>

      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-30 mt-4 w-max min-w-[14rem] max-w-[18rem] translate-y-1.5 rounded-2xl text-left opacity-0 shadow-[0_2px_6px_rgba(11,22,34,0.12),0_28px_56px_-20px_rgba(11,22,34,0.5)] transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/channel:visible group-hover/channel:translate-y-0 group-hover/channel:opacity-100 group-focus-within/channel:visible group-focus-within/channel:translate-y-0 group-focus-within/channel:opacity-100 ${anchor}`}
      >
        <span className="block overflow-hidden rounded-2xl border border-white/10 bg-navy-950">
          <span className="block px-5 pb-4 pt-4">
            <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-white/50">
              {channel.title}
            </span>
            <span className="mt-2.5 block">
              {channel.lines.map((line) => (
                <span key={line} className="block break-words text-[0.8rem] font-medium leading-relaxed text-white">
                  {line}
                </span>
              ))}
            </span>
          </span>
          <span className="block border-t border-white/10 bg-white/[0.04] px-5 py-2.5 text-[0.65rem] font-medium tracking-wide text-white/75">
            <span>
              <span className="hidden [@media(hover:hover)]:inline">Click</span>
              <span className="[@media(hover:hover)]:hidden">Tap</span> {channel.hint}
            </span>
          </span>
        </span>
      </span>
    </li>
  );
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappNumber = settings.whatsapp || settings.phone;

  const addressParts = [settings.addressLine1, settings.addressLine2, settings.city].filter(
    (part): part is string => Boolean(part),
  );
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressParts.join(", "))}`;

  const channels: Channel[] = [
    {
      key: "phone",
      label: "Call",
      href: `tel:${settings.phone}`,
      title: "Call us",
      lines: [settings.phone],
      hint: "to call",
      logo: { src: "/images/brand/phone.svg", width: 48, height: 48, className: "h-7 w-7" },
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: getWhatsAppHref(whatsappNumber),
      title: "WhatsApp",
      lines: [whatsappNumber],
      hint: "to start a chat",
      external: true,
      logo: { src: "/images/brand/whatsapp.svg", width: 256, height: 258, className: "h-8 w-8" },
    },
    {
      key: "email",
      label: "Email",
      href: `mailto:${settings.email}`,
      title: "Email us",
      lines: [settings.email],
      hint: "to write an email",
      logo: { src: "/images/brand/gmail.svg", width: 256, height: 204, className: "h-5 w-auto" },
    },
    {
      key: "visit",
      label: "Visit us",
      href: directionsHref,
      title: "Visit us",
      lines: addressParts,
      hint: "to open in Google Maps",
      external: true,
      logo: { src: "/images/brand/google-maps.png", width: 184, height: 256, className: "h-7 w-auto" },
    },
  ];

  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: siteConfig.url },
          { name: "Contact", url: `${siteConfig.url}/contact` },
        ])}
      />

      {/* Hero: heading, intro and contact icons on the left, the illustration
          on the right. */}
      <section
        className="flex min-h-[100svh] flex-col overflow-hidden bg-[#FDF2F6]"
        style={{
          // Layers, top to bottom: a fade at the very top (keeps the transparent
          // navbar legible) and a lighter one at the bottom, then a soft veil
          // centred on the content, then the icon wallpaper. The wallpaper
          // stays visible toward the edges but quietens behind the copy and
          // illustration, so the text sits on a calm surface.
          backgroundImage: [
            "linear-gradient(to bottom, rgba(253,242,246,0.96) 0%, rgba(253,242,246,0.7) 9%, rgba(253,242,246,0) 24%, rgba(253,242,246,0) 86%, rgba(253,242,246,0.75) 100%)",
            "radial-gradient(ellipse 60% 52% at 45% 54%, rgba(253,242,246,0.97) 0%, rgba(253,242,246,0.88) 42%, rgba(253,242,246,0.4) 74%, rgba(253,242,246,0) 100%)",
            "url('/images/contact-pattern.svg')",
          ].join(", "),
          backgroundSize: "100% 100%, 100% 100%, 240px 240px",
        }}
      >
        <Container className="flex w-full flex-1 items-center pb-16 pt-28 sm:pb-20 sm:pt-32 lg:pb-24 lg:pt-36">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-x-12">
            <div className="self-center lg:col-span-5">
              {/* Same family as the "Not Sure Which Aircraft You Need?" heading on the
                  fleet page (font-body / Raleway, uppercase, light), set a little larger
                  with wider tracking so it carries the hero. */}
              <h1 className="font-body text-balance text-[clamp(1.125rem,0.95rem+0.8vw,1.625rem)] font-light uppercase leading-[1.1] tracking-[0.24em] text-navy-950">
                Contact
              </h1>
              <p className="mt-6 max-w-[27rem] text-[0.8125rem] leading-[1.85] text-slate-600">
                Speak directly with our charter team. We are available around the clock to arrange your flight,
                answer fleet questions, or handle any request, with no forms and no waiting for a callback.
              </p>

              <nav aria-label="Ways to reach us" className="mt-10">
                {/* -ml-3 cancels the (w-20 − h-14) / 2 inset so the first disc sits flush
                    with the heading's left edge. */}
                <ul className="-ml-3 flex flex-wrap gap-x-3 gap-y-8">
                  {channels.map((channel, index) => (
                    <ChannelLink key={channel.key} channel={channel} align={index < 2 ? "left" : "right"} />
                  ))}
                </ul>
              </nav>
            </div>

            <div className="self-center lg:col-span-7">
              <ContactIllustration className="mx-auto h-auto w-full max-w-[27.5rem] lg:ml-auto lg:mr-0" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}