"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { Container } from "../container/Container";
import { MobileNav } from "./MobileNav";
import { NavMenuTrigger } from "./NavMenuTrigger";
import { siteConfig } from "@/lib/config/site";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSITION = "transition-all duration-[450ms] ease-editorial";

// Brand accents used throughout this file (kept as plain hex literals,
// not JS variables, so Tailwind's static scanner can pick up the
// arbitrary-value classes at build time):
//   Yellow #F0C24B — primary accent: CTA button
//   Blue   #4EA8DE — secondary accent: logo fallback badge
// To retune the palette, find/replace these two hex values across the file.

// ---------------------------------------------------------------------------
// Navbar
//
// Transparent at the very top of the page, then smoothly gains a
// dark/blurred background once the page scrolls — this covers the
// common case where scrolling brings a light/white section (or just
// busy content) underneath the bar, which would otherwise wash out the
// white text. The transition is a plain background-color/backdrop-filter
// fade (see TRANSITION), not a layout shift — height stays constant so
// nothing jumps.
//
// Fleet / Destinations / About are inline top-bar links (visible from lg
// upward). The hamburger stays visible at every breakpoint — on mobile
// it's still the only way to reach Fleet/Destinations/About, and at
// every screen size it holds the account/dashboard items (Bookings,
// Quotes, Payments, Profile, Sign Out) plus Contact and auth, since
// dashboards are admin-only and customers reach their own data through
// this menu instead of a sidebar.
// ---------------------------------------------------------------------------

export function Navbar({ phone }: { phone: string }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Runs on every page now, not just home — any page can have a light
  // or busy section scroll under the bar, not only the homepage hero.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the menu on route change — the layout persists across
  // navigations in the App Router, so state has to be reset explicitly.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the slide-out panel is open, since it now
  // covers the full viewport at every breakpoint rather than just
  // pushing mobile content down.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const showSolid = !isHome || scrolled || menuOpen;

  // --- render ----------------------------------------------------------------

  return (
    <header
      className={`${isHome ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 w-full ${TRANSITION} ${
        showSolid
          ? "border-b border-white/[0.06] bg-[rgba(18,22,28,0.38)] shadow-[0_20px_60px_-18px_rgba(0,0,0,0.35)] backdrop-blur-[22px]"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <Container>
        <nav className={`relative flex h-16 items-center justify-between ${TRANSITION}`} aria-label="Primary">
          <div className="flex items-center gap-8">
            <NavMenuTrigger open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} />

            <div className="hidden items-center gap-8 lg:flex">
              <TopLink href="/fleet" active={pathname === "/fleet"}>
                Fleet
              </TopLink>
              <TopLink href="/destinations" active={pathname === "/destinations"}>
                Destinations
              </TopLink>
            </div>
          </div>

          <NavbarLogo logoError={logoError} onLogoError={() => setLogoError(true)} />

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex">
              <TopLink href="/about" active={pathname === "/about"}>
                About
              </TopLink>
            </div>

            <Link
              href="/request-charter"
              className="group font-display relative inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#F0C24B] bg-[#F0C24B] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1A1200] shadow-[0_4px_24px_rgba(240,194,75,0.24)] transition-all duration-300 ease-out hover:-translate-y-px hover:shadow-[0_10px_32px_rgba(240,194,75,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0C24B]"
            >
              Request Charter
            </Link>
          </div>
        </nav>
      </Container>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} phone={phone} />
    </header>
  );
}

// ---------------------------------------------------------------------------
// Center — logo only (no wordmark). Absolutely positioned and centered
// against the full nav width, so it can never be pushed off-center or
// overlapped by the left/right clusters no matter how their content
// lengths compare. pointer-events-none on the wrapper keeps it from
// stealing clicks meant for the flanking controls; the inner Link
// re-enables them for just the logo itself.
// ---------------------------------------------------------------------------

function NavbarLogo({
  logoError,
  onLogoError,
}: {
  logoError: boolean;
  onLogoError: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Link
        href="/"
        className="pointer-events-auto flex items-center text-[#F7F6F2] transition-opacity duration-300 hover:opacity-80"
        aria-label={siteConfig.shortName}
      >
        {logoError ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4EA8DE]/40 bg-[#12263A]">
            <Compass className="h-4 w-4 text-[#4EA8DE]" aria-hidden="true" />
          </span>
        ) : (
          <Image
            src="/logo/logo.png"
            alt={siteConfig.shortName}
            width={280}
            height={82}
            priority
            onError={onLogoError}
            className="h-8 w-auto object-contain"
          />
        )}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared top-level nav link: small tracked caps. Hover only brightens the
// text to a glowing blue — no underline sweep on hover. The hairline
// yellow underline is reserved solely for marking the current page.
// ---------------------------------------------------------------------------

function TopLink({
  href,
  active,
  children,
  className = "",
  ...rest
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group font-display relative inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-normal tracking-normal transition-all duration-[250ms] ease-out ${
        active
          ? "text-white"
          : "text-white/75 hover:text-[#6EC5F2]"
      } ${className}`}
      {...rest}
    >
      {children}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-2 left-0 h-px bg-[#F0C24B] transition-all duration-300 ease-out ${
          active ? "w-full opacity-100" : "w-0 opacity-0"
        }`}
      />
    </Link>
  );
}