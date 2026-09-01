"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  AirplaneTakeoff,
  AirplaneTilt,
  EnvelopeSimple,
  FileText,
  Gauge,
  House,
  Info,
  MapPin,
  Receipt,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { Container } from "../container/Container";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  phone: string;
}

// ---------------------------------------------------------------------------
// Slide-out menu. Fleet / Destinations / About are inline top-bar links
// on desktop now, but this panel still carries them too since they're
// the only way to reach those pages on mobile (where the inline links
// are hidden). Its main job now is the account section: dashboards are
// admin-only, so signed-in customers get Bookings / Quotes / Payments /
// Sign Out as direct links here instead of a sidebar shell. Admins
// (role === "admin" in Clerk publicMetadata) see "Admin Account" instead
// of "My Account", with a single Admin Dashboard link in place of the
// customer-facing links.
//
// Sizing: full-screen on phones — a partial-width drawer on a small
// viewport just leaves an awkward sliver of the page visible behind it
// and cramps the account section, so under the sm breakpoint it takes
// the entire width. From sm upward there's a lot more screen to spare,
// so it caps at a slim 320px there instead of ballooning into a wide
// panel.
//
// There's no standalone Profile or Dashboard-overview page anymore, so
// the name/email header block at the top of this panel (avatar + name +
// email) is purely decorative identity — it isn't a link. Bookings,
// Quotes, and Payments are the direct entry points into account data;
// Sign Out sits below them. There's no separate avatar in the top bar
// (see Navbar.tsx) — this panel is the only account entry point at
// every breakpoint.
//
// Every text size in here is a flat `text-xs` at every breakpoint, no
// `sm:text-sm` step-up — matching the footer, which uses the same flat
// scale throughout rather than growing type at wider viewports.
// ---------------------------------------------------------------------------

// Primary nav is icon-led, matching the account section's icon+label
// pattern below it — before this the top list was plain text while the
// account list had icons, which read as two different components
// glued together rather than one considered panel.
const NAV_ITEMS = [
  { href: "/", label: "Home", icon: House },
  { href: "/fleet", label: "Fleet", icon: AirplaneTilt },
  { href: "/destinations", label: "Destinations", icon: MapPin },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: EnvelopeSimple },
];

const LINK_CLASS =
  "font-display flex items-center gap-3 rounded-md px-2 py-3 text-xs font-medium text-white/90 transition-[color,background-color,opacity,transform] duration-500 ease-editorial hover:bg-white/10 hover:text-[#BFE0F7] sm:px-3 sm:py-3.5";

const ACCOUNT_LINK_CLASS =
  "font-display flex items-center gap-3 rounded-md px-2 py-2.5 text-xs font-medium text-white/85 transition-colors duration-300 hover:bg-white/10 hover:text-[#BFE0F7] sm:px-3 sm:py-3";

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  // Role lives in Clerk's publicMetadata (readable client-side, unlike
  // privateMetadata). Compared case-insensitively since the exact casing
  // used when the role was set isn't guaranteed from this file alone.
  const isAdmin = String(user?.publicMetadata?.role ?? "").toLowerCase() === "admin";

  // Portal target isn't available during SSR — mount-gate it so the
  // server-rendered output stays null and hydration matches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Escape closes the panel — same expectation as any other dialog/
  // drawer, and previously the only way out was tapping the backdrop
  // or a link, which isn't discoverable via keyboard.
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.push("/");
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-editorial ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides in from the left, full height. Split into an
          outer positioning/background layer and an inner scrolling
          layer: the gradient/glow/edge-hairline are decorative and
          need to stay fixed as a backdrop, but if they lived inside
          the same element as `overflow-y-auto` they'd scroll away
          with the content instead of staying put behind it. Safe-area
          padding on the top/bottom edges keeps content clear of
          notches and home-indicator bars on phones that have them. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full overflow-hidden shadow-[20px_0_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-editorial sm:max-w-xs ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        {/* Same navy gradient + soft sky glow used across the footer,
            so this panel reads as part of the same visual system
            instead of a flat, unrelated blue block. */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 to-navy-900" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 15% 0%, rgb(var(--color-sky-500) / 0.08), transparent 60%)",
          }}
          aria-hidden="true"
        />
        {/* Edge hairline where the panel meets the backdrop — the
            footer's equivalent is a top hairline; here it's the
            leading edge of a left-sliding panel instead. */}
        <div
          className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sky-500/40 to-transparent"
          aria-hidden="true"
        />

        <div
          className="relative flex h-full flex-col overflow-y-auto"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <Container className="flex flex-1 flex-col gap-2 py-6 sm:py-8">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="mb-4 flex h-9 w-9 items-center justify-center self-end rounded-full text-white/80 transition-all duration-300 hover:scale-110 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            {open ? (
              <SignedIn>
                {user ? (
                  <div className="mb-4 flex items-center gap-3 rounded-md border-b border-white/15 px-2 pb-5">
                    {user.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/15 sm:h-12 sm:w-12"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-700 text-sm font-medium text-white ring-1 ring-white/15 sm:h-12 sm:w-12 sm:text-base">
                        {user.firstName?.[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white">
                        {user.fullName ?? user.primaryEmailAddress?.emailAddress}
                      </p>
                      <p className="truncate text-xs text-white/70">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                ) : null}
              </SignedIn>
            ) : null}

            {/* Staggered entrance — each link fades/slides in a beat
                after the last as the panel opens, instead of the whole
                list appearing at once. Content stays mounted and in
                the DOM regardless of `open`; only opacity/transform
                animate, driven by `open` itself rather than a
                separate visibility flag. */}
            {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                style={{ transitionDelay: open ? `${120 + index * 45}ms` : "0ms" }}
                className={`${LINK_CLASS} ${open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
              >
                <Icon className="h-4 w-4 shrink-0 text-white/50 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                {label}
              </Link>
            ))}

            <div className="mt-5 border-t border-white/15 pt-6">
              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={onClose}
                  className="font-display block rounded-md px-2 py-2.5 text-xs font-medium text-white/85 transition-colors duration-300 hover:bg-white/10 hover:text-[#BFE0F7] sm:px-3 sm:py-3"
                >
                  Sign In
                </Link>
              </SignedOut>

              <SignedIn>
                <p className="px-2 pb-2 text-xs font-medium tracking-wide text-white/70 sm:px-3">
                  {isAdmin ? "Admin Account" : "My Account"}
                </p>

                {isAdmin ? (
                  <Link href="/admin/dashboard" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                    <Gauge className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/dashboard/bookings" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                      <AirplaneTakeoff className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                      Bookings
                    </Link>
                    <Link href="/dashboard/quotes" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                      <FileText className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                      Quotes
                    </Link>
                    <Link href="/dashboard/payments" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                      <Receipt className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                      Payments
                    </Link>
                  </>
                )}

                {/* Sign Out is deliberately not built from
                    ACCOUNT_LINK_CLASS — it's an exit action, not
                    another destination, so it gets its own quieter
                    resting state and a red-tinted hover instead of
                    blending into the rest of the account list. */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-display mt-1 flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left text-xs font-medium text-white/60 transition-colors duration-300 hover:bg-red-500/10 hover:text-red-300 sm:px-3 sm:py-3"
                >
                  <SignOut className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                  Sign Out
                </button>
              </SignedIn>
            </div>
          </Container>
        </div>
      </div>
    </>,
    document.body
  );
}