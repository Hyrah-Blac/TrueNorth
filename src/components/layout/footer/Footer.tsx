import Link from "next/link";
import { Twitter, Facebook, Linkedin, Instagram, type LucideIcon } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { socialLinks } from "@/content/social-links";

// Maps each social platform to its icon. Falls back gracefully if a new
// platform is added to content/social-links.ts without a matching icon
// here yet — better to skip rendering than to throw.
const iconMap: Record<string, LucideIcon> = {
  twitter: Twitter,
  x: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
};

export function Footer() {
  return (
    <footer className="relative bg-navy-950">
      {/* Thin gold accent line across the very top — the only color
          accent in an otherwise monochrome, minimal footer. */}
      <div className="h-[3px] bg-sky-500" aria-hidden="true" />

      <div className="mx-auto flex max-w-container flex-col items-center gap-8 px-6 py-16 text-center lg:py-20">
        <div className="flex items-center gap-5">
          {socialLinks.map((social) => {
            const Icon = iconMap[social.platform.toLowerCase()];
            if (!Icon) return null;

            return (
              <a
                key={social.platform}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={social.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/50 transition-all duration-300 ease-out hover:scale-110 hover:border-sky-400 hover:text-sky-400 hover:shadow-[0_0_20px_rgba(78,168,222,0.35)]"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            );
          })}
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {siteConfig.name} — All Rights Reserved{" "}
          <span className="text-slate-600">|</span>{" "}
          <Link href="/privacy-policy" className="transition-colors hover:text-slate-300">
            Privacy Policy
          </Link>
        </p>
      </div>
    </footer>
  );
}