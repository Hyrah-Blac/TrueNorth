import type { SVGProps } from "react";
import { Twitter, Facebook, Linkedin, Instagram, type LucideIcon } from "lucide-react";
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

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="relative bg-blue-500">
      <div className="mx-auto flex max-w-container flex-col items-center gap-8 px-6 py-16 text-center lg:py-20">
        {settings.socialLinks.length > 0 ? (
          <div className="flex items-center gap-5">
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
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white/85 transition-all duration-300 ease-out hover:scale-110 hover:border-sky-300 hover:text-sky-300 hover:shadow-[0_0_20px_rgba(78,168,222,0.35)]"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        ) : null}

        <p className="text-xs text-white/80">
          © {new Date().getFullYear()} {settings.companyName} — All Rights Reserved{" "}
          <span className="text-white/60">|</span>{" "}
          <span>Privacy Policy</span>
        </p>
      </div>
    </footer>
  );
}