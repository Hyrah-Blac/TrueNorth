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
// upward). The hamburger stays visible at every breakpoint and is the
// only account entry point at every breakpoint — dashboards are
// admin-only, so customers reach their own data through links in that
// panel rather than a sidebar. There's no separate avatar in the bar
// itself; the panel's own name/email header links to Profile (see
// MobileNav.tsx).
//
// The centered logo mark is suppressed while the bar is transparent, but
// only on the home hero ("/") — that's the only page where the Hero
// component renders its own logo over the "Adventure, above & beyond"
// line, so showing it here too would double it up. Every other hero
// route (fleet, destinations, about) keeps the navbar logo visible even
// while transparent, since nothing else on those pages is showing it.
// It fades back in the moment the bar goes solid (scroll, menu open, or
// a non-hero route), in sync with the same background-color transition.
// ---------------------------------------------------------------------------

// Routes whose top section is a full-bleed dark/image hero — these are the
// only pages where a transparent, white-text bar over that hero makes
// sense. Every other route opens straight into a white page background,
// so the bar needs to start solid there or its white text and logo
// disappear against the page underneath it.
//
// request-charter used to have a dark navy/photo hero here too, but the
// charter request flow now opens straight into a plain white page (the
// VistaJet-style "Request a quote" layout — see the page component), so
// it moved out of this list to match every other plain-white route.
const HERO_ROUTES = ["/", "/fleet", "/destinations", "/about", "/contact"];

// Contact and about now use a light, white-washed photo (not the dark
// ones used on the other hero routes), so a transparent bar there still
// needs dark text/logo to stay legible — white text would vanish against
// it. These routes get a transparent background like the others, but
// keep solid-page text color throughout.
const LIGHT_HERO_ROUTES = ["/contact", "/about"];

// The customer dashboard (Bookings, Quotes, Payments) now renders its
// own background photo (see the (customer)/dashboard
// layout) with the same light white-wash treatment as contact/about, so
// it's handled the same way here: matched by prefix rather than an exact
// path since every dashboard sub-route (e.g. /dashboard/bookings/abc123)
// should behave identically, not just the bare /dashboard route itself.

export function Navbar({ phone }: { phone: string }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isHeroRoute = HERO_ROUTES.includes(pathname) || isDashboardRoute;
  const isLightHero = LIGHT_HERO_ROUTES.includes(pathname) || isDashboardRoute;

  // The charter request flow gets a stripped-down bar: just the logo,
  // floating over the page with a transparent background at all times
  // (no solid-on-scroll, no border/shadow) — the form itself is the
  // focus here, not site navigation.
  const isMinimalNav = pathname === "/request-charter";

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
  const showSolid = isMinimalNav ? false : !isHeroRoute || scrolled || menuOpen;
  const elevated = isMinimalNav ? false : scrolled || menuOpen;

  // Background transparency (showSolid) and text/logo color are usually
  // the same toggle, but on a light-background hero like contact — and
  // now on the minimal request-charter bar — they diverge: the bar
  // itself should still go transparent, while the text/logo stays dark
  // since there's no dark photo backing it.
  const textSolid = showSolid || isLightHero || isMinimalNav;

  // Only the home hero renders its own oversized logo over "Adventure,
  // above & beyond" — the other hero routes (fleet, destinations, about)
  // don't duplicate it, so the navbar's own logo should stay visible on
  // those even while the bar is transparent. It's only suppressed here
  // on "/" while transparent, to avoid showing it twice.
  const isHomeHero = pathname === "/";
  const showLogo = !(isHomeHero && !showSolid);

  // --- render ----------------------------------------------------------------

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 w-full ${TRANSITION} ${
        hidden && !menuOpen ? "-translate-y-full" : "translate-y-0"
      } ${showSolid ? "bg-white" : "bg-transparent"} ${
        elevated
          ? "border-b border-slate-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]"
          : !isHeroRoute && !isMinimalNav
            ? "border-b border-slate-200/70"
            : "border-b border-transparent"
      }`}
    >
      <Container className="px-4 sm:px-6 lg:px-10 xl:px-14">
        <nav className={`relative flex h-24 items-center justify-between ${TRANSITION}`} aria-label="Primary">
          {!isMinimalNav && (
            <div className="flex items-center gap-4 lg:gap-6">
              <NavMenuTrigger open={menuOpen} onToggle={() => setMenuOpen((open) => !open)} solid={textSolid} />

              <div className="hidden items-center gap-6 lg:flex">
                <TopLink href="/fleet" active={pathname === "/fleet"} solid={textSolid}>
                  Fleet
                </TopLink>
                <TopLink href="/destinations" active={pathname === "/destinations"} solid={textSolid}>
                  Destinations
                </TopLink>
              </div>
            </div>
          )}

          {showLogo && (
            <NavbarLogo logoError={logoError} onLogoError={() => setLogoError(true)} solid={textSolid} />
          )}

          {!isMinimalNav && (
            <div className="flex items-center gap-6 lg:gap-10">
              <div className="hidden lg:flex">
                <TopLink href="/contact" active={pathname === "/contact"} solid={textSolid}>
                  Contact
                </TopLink>
              </div>

              <Button
                href="/request-charter"
                variant="blue"
                size="md"
                className="!px-5 !py-2.5 !text-[10px] !tracking-[0.12em] sm:!px-6"
              >
                <span className="sm:hidden">Charter</span>
                <span className="hidden sm:inline">Request Charter</span>
              </Button>
            </div>
          )}
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
// Shared top-level nav link: small tracked caps. Hover brightens the text
// to a glowing blue; the active page is marked by color alone (no
// underline).
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
      className={`group font-body relative inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-light uppercase tracking-[0.1em] transition-all duration-[250ms] ease-out ${
        solid
          ? active
            ? "text-navy-900"
            : "text-slate-600 hover:text-[#0000FF]"
          : active
            ? "text-white"
            : "text-white hover:text-[#0000FF]"
      } ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}