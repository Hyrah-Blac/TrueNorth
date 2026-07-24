"use client";

import { useState } from "react";
import Image from "next/image";
import { Compass } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

/**
 * Same logo-with-fallback pattern as NavbarLogo (see
 * /components/navbar/Navbar.tsx) — tries the real logo image first, falls
 * back to a Compass-in-a-circle badge if it 404s. Split into its own
 * client component because Footer itself is an async server component
 * (it awaits getSiteSettings()), and a component can't be both async and
 * "use client".
 */
export function FooterLogo() {
  const [logoError, setLogoError] = useState(false);

  if (logoError) {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#4EA8DE]/40 bg-[#12263A]">
        <Compass className="h-3.5 w-3.5 text-[#4EA8DE]" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Image
      src="/logo/logo.png"
      alt={siteConfig.shortName}
      width={140}
      height={40}
      onError={() => setLogoError(true)}
      className="h-8 w-auto object-contain"
    />
  );
}