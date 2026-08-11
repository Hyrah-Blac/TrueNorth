import type { SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { Twitter, Facebook, Linkedin, Instagram, Phone, Mail, type LucideIcon } from "lucide-react";
import { getSiteSettings } from "@/lib/config/siteSettings";

// lucide-react has no TikTok mark yet (open request:
// lucide-icons/lucide#2810), so this is a small hand-drawn glyph — the
// classic TikTok "note" shape, redrawn from Bootstrap Icons' outline —
// sized so it sits flush with the Lucide brand icons on either side of it.
function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z" />
    </svg>
  );
}

// Maps each social platform slug to its icon. Gracefully skips platforms
// whose slug we don't have an icon for yet — better to omit than throw.
const iconMap: Record<string, LucideIcon | typeof TikTokIcon> = {
  twitter: Twitter,
  x: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: TikTokIcon,
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

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[11px] font-medium uppercase tracking-[0.22em] text-white/50">{children}</p>
  );
}

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="relative bg-blue-500">
      <div className="mx-auto max-w-container px-6 py-10 lg:px-12 lg:py-12">
        {/* Brand lockup (logo + tagline) on one side, nav + contact on the
            other — both stack to a single centered column on mobile, and
            each internally switches from centered to left-aligned the
            moment it goes horizontal (at `sm`), so alignment and layout
            direction always change together instead of one lagging the
            other across breakpoints. */}
        <div className="flex flex-col items-center gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Image
              src="/logo/logo.png"
              alt={settings.companyShortName}
              width={200}
              height={58}
              className="h-8 w-auto shrink-0 object-contain brightness-0 invert"
            />
            <span className="hidden h-5 w-px bg-white/25 sm:block" aria-hidden="true" />
            <span className="font-editorial text-xs font-light text-white/65">
              {settings.companyTagline}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:gap-x-14">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <FooterHeading>Explore</FooterHeading>
              <nav aria-label="Footer" className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-x-6 sm:gap-y-1.5">
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
            </div>

            <div className="flex flex-col items-center gap-2 sm:items-start">
              <FooterHeading>Contact</FooterHeading>
              <div className="flex flex-col items-start gap-1.5">
                <a
                  href={`tel:${settings.phone}`}
                  className="font-display inline-flex items-center gap-2 text-xs text-white/80 transition-colors duration-300 ease-out hover:text-sky-300"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
                  {settings.phone}
                </a>
                <a
                  href={`mailto:${settings.email}`}
                  className="font-display inline-flex items-center gap-2 text-xs text-white/80 transition-colors duration-300 ease-out hover:text-sky-300"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden="true" />
                  {settings.email}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="my-7 h-px w-full bg-white/15" />

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="order-2 text-xs text-white/60 sm:order-1">
            © {new Date().getFullYear()} {settings.companyName} — All Rights Reserved{" "}
            <span className="text-white/40">|</span> <span>Privacy Policy</span>
          </p>

          {settings.socialLinks.length > 0 ? (
            <div className="order-1 flex items-center gap-3 sm:order-2">
              {settings.socialLinks.map((social) => {
                const Icon = iconMap[social.platform.toLowerCase()];
                if (!Icon) return null;

                return (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white/85 transition-all duration-300 ease-out hover:scale-110 hover:border-sky-300 hover:text-sky-300 hover:shadow-[0_0_20px_rgba(78,168,222,0.35)]"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
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