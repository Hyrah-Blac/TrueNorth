"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Menu, X, Compass } from "lucide-react";
import { Container } from "../container/Container";
import { MobileNav } from "./MobileNav";
import { siteConfig } from "@/lib/config/site";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRANSITION = "transition-all duration-[450ms] ease-editorial";

// Brand accents used throughout this file (kept as plain hex literals,
// not JS variables, so Tailwind's static scanner can pick up the
// arbitrary-value classes at build time):
//   Yellow #F0C24B — primary accent: active-page underline, CTA button
//   Blue   #4EA8DE — secondary accent: link hover states, logo fallback badge
// To retune the palette, find/replace these two hex values across the file.

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // --- effects -------------------------------------------------------------

  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Close the mobile menu on route change — the layout persists across
  // navigations in the App Router, so state has to be reset explicitly.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // --- derived state ---------------------------------------------------------

  const transparent = isHome && !scrolled && !mobileOpen;
  const barHeight = transparent ? "h-[112px]" : "h-[92px]";

  // --- render ----------------------------------------------------------------

  return (
    <header
      className={`${isHome ? "fixed inset-x-0 top-0" : "sticky top-0"} z-50 w-full ${TRANSITION} ${
        transparent
          ? "bg-transparent"
          : "border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,18,30,0.70)] shadow-[0_20px_60px_-18px_rgba(0,0,0,0.55)] backdrop-blur-[18px]"
      }`}
    >
      <Container>
        <nav
          className={`relative flex items-center justify-between ${TRANSITION} ${barHeight}`}
          aria-label="Primary"
        >
          <NavbarLeftCluster
            pathname={pathname}
            mobileOpen={mobileOpen}
            onToggleMobile={() => setMobileOpen((open) => !open)}
          />

          <NavbarLogo
            transparent={transparent}
            logoError={logoError}
            onLogoError={() => setLogoError(true)}
          />

          <NavbarRightCluster pathname={pathname} />
        </nav>
      </Container>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

// ---------------------------------------------------------------------------
// Left cluster — mobile trigger + Fleet / Destinations plain links
// (no dropdowns — kept flat and premium-feeling per design direction)
// ---------------------------------------------------------------------------

function NavbarLeftCluster({
  pathname,
  mobileOpen,
  onToggleMobile,
}: {
  pathname: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  return (
    <div className="flex items-center gap-10">
      <NavbarMobileTrigger mobileOpen={mobileOpen} onToggle={onToggleMobile} />

      <div className="hidden items-center gap-10 lg:flex">
        <TopLink href="/fleet" active={pathname === "/fleet"}>
          Fleet
        </TopLink>

        <TopLink href="/destinations" active={pathname === "/destinations"}>
          Destinations
        </TopLink>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Center — logo only (no wordmark). Absolutely positioned and centered
// against the full nav width, so it can never be pushed off-center or
// overlapped by the left/right clusters no matter how their content
// lengths compare. pointer-events-none on the wrapper keeps it from
// stealing clicks meant for the flanking links; the inner Link re-enables
// them for just the logo itself.
// ---------------------------------------------------------------------------

function NavbarLogo({
  transparent,
  logoError,
  onLogoError,
}: {
  transparent: boolean;
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
          <span
            className={`flex items-center justify-center rounded-full border border-[#4EA8DE]/40 bg-[#12263A] ${TRANSITION} ${
              transparent ? "h-16 w-16" : "h-12 w-12"
            }`}
          >
            <Compass className="h-6 w-6 text-[#4EA8DE]" aria-hidden="true" />
          </span>
        ) : (
          <Image
            src="/logo/logo.png"
            alt={siteConfig.shortName}
            width={280}
            height={82}
            priority
            onError={onLogoError}
            className={`w-auto object-contain ${TRANSITION} ${transparent ? "h-16" : "h-12"}`}
          />
        )}
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right cluster — About / Contact, auth links, Request Charter CTA
// ---------------------------------------------------------------------------

function NavbarRightCluster({ pathname }: { pathname: string }) {
  return (
    <div className="flex items-center gap-10">
      <div className="hidden items-center gap-10 lg:flex">
        <TopLink href="/about" active={pathname === "/about"}>
          About
        </TopLink>
        <TopLink href="/contact" active={pathname === "/contact"}>
          Contact
        </TopLink>
      </div>

      <div className="hidden items-center gap-6 lg:flex">
        <span className="h-6 w-px bg-[rgba(255,255,255,0.08)]" aria-hidden="true" />

        <SignedOut>
          <TopLink href="/sign-in" active={pathname === "/sign-in"}>
            Sign In
          </TopLink>
        </SignedOut>

        <SignedIn>
          <TopLink href="/dashboard" active={pathname === "/dashboard"}>
            Dashboard
          </TopLink>
          <UserButton afterSwitchSessionUrl="/" />
        </SignedIn>

        <Link
          href="/request-charter"
          className="group font-display relative inline-flex items-center justify-center whitespace-nowrap rounded-full border border-[#F0C24B]/60 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#F0C24B] shadow-[0_4px_24px_rgba(240,194,75,0.14)] transition-all duration-300 ease-out hover:-translate-y-px hover:border-[#F0C24B] hover:bg-[#F0C24B] hover:text-[#1A1200] hover:shadow-[0_10px_32px_rgba(240,194,75,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0C24B]"
        >
          Request Charter
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile hamburger trigger — kept separate so it can sit in the header's
// own left edge outside the flex clusters above on small screens.
// ---------------------------------------------------------------------------

export function NavbarMobileTrigger({
  mobileOpen,
  onToggle,
}: {
  mobileOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center text-[#F7F6F2] transition-colors duration-300 hover:text-[#4EA8DE] lg:hidden"
      onClick={onToggle}
      aria-label={mobileOpen ? "Close menu" : "Open menu"}
      aria-expanded={mobileOpen}
    >
      {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </button>
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
      className={`group font-display relative inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium tracking-normal transition-all duration-[250ms] ease-out ${
        active
          ? "text-[#F7F6F2]"
          : "text-[#B8C2CC] hover:text-[#6EC5F2] hover:drop-shadow-[0_0_10px_rgba(78,168,222,0.55)]"
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