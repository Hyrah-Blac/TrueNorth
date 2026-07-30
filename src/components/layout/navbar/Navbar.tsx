"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { Container } from "../container/Container";
import { MobileNav } from "./MobileNav";
import { NavMenuTrigger } from "./NavMenuTrigger";
import { Button } from "@/components/shared/buttons/Button";
import { siteConfig } from "@/lib/config/site";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSITION = "transition-all duration-[450ms] ease-editorial";

// Brand accent used elsewhere in this file (kept as a plain hex literal,
// not a JS variable, so Tailwind's static scanner can pick it up at build
// time):
//   Blue #4EA8DE — logo fallback badge
// The CTA button now comes from the shared <Button /> component (see
// components/shared/buttons/Button.tsx) rather than a one-off styled
// <Link />. It uses the "blue" variant — a flat, static pill (solid
// blue, white text, no lift/shadow on hover, just a quiet color fade to
// blue-700) — the same variant used for the "View Entire Fleet" CTA in
// FleetCategoriesSection, so its color/hover behavior is controlled
// there, not here.

// ---------------------------------------------------------------------------
// Navbar
//
// Transparent only at the very top of hero routes (see HERO_ROUTES below);
// everywhere else it opens already solid, since those pages have no dark
// hero for white text to sit on. It then gains a shadow/border once the
// page scrolls (or the mobile menu opens), so it visually lifts off the
// content beneath it. Nav link/logo colors flip from white to dark navy at
// the same moment (see the `solid` prop threaded through TopLink/NavbarLogo)
// so text stays legible against whichever background is showing. Fixed
// positioning is used everywhere (not just home) so the transparent state
// can actually overlay page content instead of just sitting inline above
// it; pages need top padding/margin equal to the bar's height (h-24) to
// avoid their content being tucked underneath it. The transition is a plain
// background-color fade (see TRANSITION), not a layout shift — height
// stays constant so nothing jumps.
//
// Fleet / Destinations / About are inline top-bar links (visible from lg
// upward). The hamburger stays visible at every breakpoint — on mobile
// it's still the only way to reach Fleet/Destinations/About, and at
// every screen size it holds the account/dashboard items (Bookings,
// Quotes, Payments, Profile, Sign Out) plus Contact and auth, since
// dashboards are admin-only and customers reach their own data through
// this menu instead of a sidebar.
// ---------------------------------------------------------------------------

// Routes whose top section is a full-bleed dark/image hero — these are the
// only pages where a transparent, white-text bar over that hero makes
// sense. Every other route (contact, about, etc.) opens straight into a
// white page background, so the bar needs to start solid there or its
// white text and logo disappear against the page underneath it.
const HERO_ROUTES = ["/"];

export function Navbar({ phone }: { phone: string }) {
  const pathname = usePathname();
  const isHeroRoute = HERO_ROUTES.includes(pathname);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Runs on every page now, not just home — any page can have a light
  // or busy section scroll under the bar, not only the homepage hero.
  //
  // Same listener also drives the hide-on-scroll-down / reveal-on-
  // scroll-up behavior: comparing the current position against the
  // last one tells us direction, and a small threshold (12px) stops it
  // from flickering on tiny scroll jitter (trackpads, mobile bounce).
  // Hiding only kicks in past 80px so the bar doesn't disappear the
  // moment someone nudges the page near the very top.
  useEffect(() => {
    lastY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrolled(currentY > 24);

      const delta = currentY - lastY.current;
      if (Math.abs(delta) > 12) {
        if (delta > 0 && currentY > 80) {
          setHidden(true);
        } else if (delta < 0) {
          setHidden(false);
        }
        lastY.current = currentY;
      }
    };

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
  // pushing mobile content down. Also force the bar back into view
  // when the menu opens — it would be disorienting for the trigger
  // itself to be scrolled off-screen while its panel is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (menuOpen) setHidden(false);
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // On hero routes, stay transparent until the page scrolls (or the menu
  // opens). On every other route there's no hero to be transparent over,
  // so the bar is solid from the first paint — it just won't show the
  // scrolled elevation (border/shadow) until the page actually scrolls,
  // which is what makes it read as merged with the page rather than a
  // floating card sitting on top of it.
  const showSolid = !isHeroRoute || scrolled || menuOpen;
  const elevated = scrolled || menuOpen;

  // --- render ----------------------------------------------------------------

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full ${TRANSITION} ${
        hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
      } ${showSolid ? "bg-white" : "bg-transparent"} ${
        elevated
          ? "border-b border-slate-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]"
          : "border-b border-transparent"
      }`}
    >
      <Container>
        <nav className={`relative flex h-24 items-center justify-between ${TRANSITION}`} aria-label="Primary">
          <div className="flex items-center gap-8">
            <NavMenuTrigger open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} solid={showSolid} />

            <div className="hidden items-center gap-8 lg:flex">
              <TopLink href="/fleet" active={pathname === "/fleet"} solid={showSolid}>
                Fleet
              </TopLink>
              <TopLink href="/destinations" active={pathname === "/destinations"} solid={showSolid}>
                Destinations
              </TopLink>
            </div>
          </div>

          <NavbarLogo logoError={logoError} onLogoError={() => setLogoError(true)} solid={showSolid} />

          <div className="flex items-center gap-8">
            <div className="hidden lg:flex">
              <TopLink href="/about" active={pathname === "/about"} solid={showSolid}>
                About
              </TopLink>
            </div>

            <Button
              href="/request-charter"
              variant="blue"
              size="md"
              className="!px-4 !py-2 !text-[10px] sm:!px-5"
            >
              <span className="sm:hidden">Charter</span>
              <span className="hidden sm:inline">Request Charter</span>
            </Button>
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
  solid,
}: {
  logoError: boolean;
  onLogoError: () => void;
  solid: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Link
        href="/"
        className={`pointer-events-auto flex items-center transition-opacity duration-300 hover:opacity-80 ${
          solid ? "text-navy-900" : "text-[#F7F6F2]"
        }`}
        aria-label={siteConfig.shortName}
      >
        {logoError ? (
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
              solid ? "border-[#4EA8DE]/60 bg-[#EAF4FB]" : "border-[#4EA8DE]/40 bg-[#12263A]"
            }`}
          >
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
  solid,
  children,
  className = "",
  ...rest
}: {
  href: string;
  active?: boolean;
  solid?: boolean;
  children: React.ReactNode;
  className?: string;
} & React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group font-display relative inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-normal tracking-normal transition-all duration-[250ms] ease-out ${
        solid
          ? active
            ? "text-navy-900"
            : "text-slate-600 hover:text-sky-600"
          : active
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