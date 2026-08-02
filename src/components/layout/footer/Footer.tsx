import { Twitter, Facebook, Linkedin, Instagram, type LucideIcon } from "lucide-react";
import { getSiteSettings } from "@/lib/config/siteSettings";

// Maps each social platform slug to its icon. Gracefully skips platforms
// whose slug we don't have an icon for yet — better to omit than throw.
const iconMap: Record<string, LucideIcon> = {
  twitter: Twitter,
  x: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
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
