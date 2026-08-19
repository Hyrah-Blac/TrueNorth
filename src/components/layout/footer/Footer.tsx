import type { SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { Linkedin, Phone, Mail, type LucideIcon } from "lucide-react";
import { getSiteSettings } from "@/lib/config/siteSettings";
import { FooterAccordionSection } from "./FooterAccordionSection";

// These four are each platform's actual solid brand mark (not a
// generic outline glyph), sourced from Simple Icons — a CC0-licensed
// library maintained specifically for accurate, redistributable brand
// SVG paths. LinkedIn is deliberately excluded from that library
// (removed at LinkedIn's own request over trademark-redistribution
// concerns), and their brand guidelines require their logo be used
// unmodified from their official assets — not reconstructed from
// memory — so LinkedIn stays on lucide-react's simplified interpretation
// below instead of a fabricated "real" mark.
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

// Instagram's real mark is a multi-stop gradient camera glyph, not a
// flat color — rendered here with an actual <linearGradient> so it
// looks like the genuine icon instead of a single-tint approximation.
function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  const gradientId = "instagram-gradient";
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
      />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

// Maps each social platform slug to its icon. Gracefully skips platforms
// whose slug we don't have an icon for yet — better to omit than throw.
const iconMap: Record<string, LucideIcon | typeof TikTokIcon> = {
  twitter: XIcon,
  x: XIcon,
  facebook: FacebookIcon,
  linkedin: Linkedin,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
};

// Solid color for the platforms rendered as flat-fill marks (Facebook,
// LinkedIn, X, TikTok). Instagram isn't listed here — its real mark is
// a gradient baked directly into InstagramIcon's SVG above, so it needs
// no color class. X and TikTok's real mark is black, which is invisible
// on this dark footer, so — matching how those brands render their own
// marks on dark surfaces — they use white here instead of black.
const socialBrandColors: Record<string, string> = {
  twitter: "text-white",
  x: "text-white",
  facebook: "text-[#0866FF]",
  linkedin: "text-[#0A66C2]",
  tiktok: "text-white",
};

// The site's real routes — see src/app/(public). One column, in the
// order people actually move through the site.
const NAV_LINKS = [
  { href: "/fleet", label: "Fleet" },
  { href: "/destinations", label: "Destinations" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/request-charter", label: "Request Charter" },
];

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-navy-950 to-navy-900">
      {/* Top hairline in a soft sky tint (not flat white) — a quiet
          signal that the footer is a distinct surface, echoing the
          sky/navy accent used in the hero sections rather than a hard
          cut between page and footer. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" aria-hidden="true" />
      {/* Faint corner glow, matching the radial treatment used on
          globals.css for hero surfaces, so the footer reads as part of
          the same visual system instead of a flat color block. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 15% 0%, rgb(var(--color-sky-500) / 0.06), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-container px-6 py-10 lg:px-12 lg:py-12">
        {/* Brand block full-width on top on mobile; Explore + Contact
            paired into a compact 2-column row beneath it instead of
            stacking as two long full-width blocks — halves the
            vertical scroll a phone has to cover. The pairing wrapper
            uses `lg:contents` to remove itself from the layout at the
            `lg` breakpoint, exposing Explore and Contact as direct
            children of the flex row below — so the same three blocks
            regroup into the evenly-spread desktop layout without
            duplicating any markup. */}
        <div className="flex flex-col items-center gap-4 sm:gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-4 lg:items-center">
            <Image
              src="/logo/logo.png"
              alt={settings.companyShortName}
              width={200}
              height={58}
              className="h-9 w-auto shrink-0 object-contain brightness-0 invert lg:h-10"
            />
            <span className="hidden h-5 w-px bg-white/15 sm:block" aria-hidden="true" />
            <span className="font-editorial text-xs font-light text-white/60">
              {settings.companyTagline}
            </span>
          </div>

          <div className="flex w-full flex-col sm:w-auto sm:flex-row sm:gap-16 lg:contents">
            <FooterAccordionSection title="Explore">
              <nav aria-label="Footer" className="flex flex-col gap-1.5">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-display text-xs text-white/80 transition-colors duration-300 ease-out hover:text-sky-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </FooterAccordionSection>

            <FooterAccordionSection title="Contact">
              <div className="flex flex-col gap-1.5">
                <a
                  href={`tel:${settings.phone}`}
                  className="font-display inline-flex items-center gap-2 text-xs text-white/80 transition-colors duration-300 ease-out hover:text-sky-300"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
                  {settings.phone}
                </a>
                <a
                  href={`mailto:${settings.email}`}
                  className="font-display inline-flex items-center gap-2 text-xs text-white/80 transition-colors duration-300 ease-out hover:text-sky-300 break-all"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
                  {settings.email}
                </a>
              </div>
            </FooterAccordionSection>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pb-2 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pb-0 sm:pt-8 lg:pr-16">
          <p className="order-2 text-xs text-white/50 sm:order-1">
            © {new Date().getFullYear()} {settings.companyName} — All Rights Reserved
          </p>

          {settings.socialLinks.length > 0 ? (
            <div className="order-1 flex items-center gap-3 sm:order-2">
              {settings.socialLinks.map((social) => {
                const platform = social.platform.toLowerCase();
                const Icon = iconMap[platform];
                if (!Icon) return null;

                const brandColor = socialBrandColors[platform] ?? "text-white/85 hover:text-sky-300";

                return (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className={`flex h-9 w-9 items-center justify-center transition-transform duration-300 ease-out hover:scale-110 ${brandColor}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}