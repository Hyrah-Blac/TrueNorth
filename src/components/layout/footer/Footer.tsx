import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "../container/Container";
import { HorizonDivider } from "@/components/layout/section/Section";
import { FooterLogo } from "./FooterLogo";
import { footerNav } from "@/content/navigation";
import { socialLinks } from "@/content/social-links";
import { siteConfig } from "@/lib/config/site";
import { getSiteSettings } from "@/lib/config/siteSettings";

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="bg-navy-950 text-white">
      <Container className="pb-8 pt-10 lg:pb-8 lg:pt-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr,1fr,1fr,1fr] lg:gap-8">
          <div>
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <FooterLogo />
              <span className="font-editorial text-lg tracking-tight">{siteConfig.shortName}</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">{siteConfig.description}</p>

            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#4EA8DE]" aria-hidden="true" />
                <span>
                  {settings.addressLine1}
                  {settings.addressLine2 ? `, ${settings.addressLine2}` : ""}
                  <br />
                  {settings.city}, {settings.country}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-[#4EA8DE]" aria-hidden="true" />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-white">
                  {settings.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-[#4EA8DE]" aria-hidden="true" />
                <a href={`mailto:${settings.email}`} className="transition-colors hover:text-white">
                  {settings.email}
                </a>
              </div>
            </div>
          </div>

          {footerNav.map((column) => (
            <div key={column.title}>
              <h3 className="spec-readout text-xs font-medium uppercase tracking-widest2 text-[#4EA8DE]">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-300 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <HorizonDivider className="mt-8 opacity-30 lg:mt-8" />

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {siteConfig.certifications.map((cert) => (
              <span key={cert} className="spec-readout text-xs uppercase tracking-widest2 text-slate-400">
                {cert}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.platform}
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 transition-colors hover:text-white"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}