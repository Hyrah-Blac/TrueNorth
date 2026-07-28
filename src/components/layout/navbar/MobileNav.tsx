"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  AirplaneTakeoff,
  FileText,
  Receipt,
  UserCircle,
  SignOut,
  Gauge,
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
// Profile / Sign Out as direct links here instead of a sidebar shell.
// Admins (role === "admin" in Clerk publicMetadata) see "Admin Account"
// instead of "My Account", with a single Admin Dashboard link in place
// of the customer-facing links.
//
// Sizing: full-screen on phones — a partial-width drawer on a small
// viewport just leaves an awkward sliver of the page visible behind it
// and cramps the account section, so under the sm breakpoint it takes
// the entire width. From sm upward there's a lot more screen to spare,
// so it caps at a slim 320px there instead of ballooning into a wide
// panel. Text/icon sizes step up slightly at the same breakpoint —
// what reads fine on a 375px phone looks cramped on an iPad.
// ---------------------------------------------------------------------------

const LINK_CLASS =
  "font-display rounded-md border-b border-white/15 px-2 py-3 text-xs font-medium text-white/90 transition-colors duration-300 hover:bg-white/10 hover:text-[#BFE0F7] sm:px-3 sm:py-3.5 sm:text-sm";

const ACCOUNT_LINK_CLASS =
  "font-display flex items-center gap-3 rounded-md px-2 py-2.5 text-xs font-medium text-white/85 transition-colors duration-300 hover:bg-white/10 hover:text-[#BFE0F7] sm:px-3 sm:py-3 sm:text-sm";

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

      {/* Panel — slides in from the left, full height, scrolls internally
          if content exceeds viewport height (matches the VistaJet
          reference's scrollable drawer). Safe-area padding on the top/
          bottom edges keeps content clear of notches and home-indicator
          bars on phones that have them. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-full flex-col overflow-y-auto bg-blue-500 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-editorial sm:max-w-xs ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <Container className="flex flex-1 flex-col py-6 sm:py-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="mb-4 flex h-9 w-9 items-center justify-center self-end rounded-full text-white/80 transition-colors duration-300 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10"
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
                      className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-medium text-white sm:h-12 sm:w-12 sm:text-base">
                      {user.firstName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white sm:text-sm">
                      {user.fullName ?? user.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="truncate text-[11px] text-white/70 sm:text-xs">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
              ) : null}
            </SignedIn>
          ) : null}

          <Link href="/" onClick={onClose} className={LINK_CLASS}>
            Home
          </Link>
          <Link href="/fleet" onClick={onClose} className={LINK_CLASS}>
            Fleet
          </Link>
          <Link href="/destinations" onClick={onClose} className={LINK_CLASS}>
            Destinations
          </Link>
          <Link href="/about" onClick={onClose} className={LINK_CLASS}>
            About
          </Link>
          <Link href="/contact" onClick={onClose} className={LINK_CLASS}>
            Contact
          </Link>

          <div className="mt-5 border-t border-white/15 pt-6">
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={onClose}
                className="font-display block rounded-md px-2 py-2.5 text-xs font-medium text-white/85 transition-colors duration-300 hover:bg-white/10 hover:text-[#BFE0F7] sm:px-3 sm:py-3 sm:text-sm"
              >
                Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <p className="px-2 pb-2 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-white/70 sm:px-3 sm:text-[0.6875rem]">
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
                  <Link href="/dashboard/profile" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                    <UserCircle className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                    Profile
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className={`${ACCOUNT_LINK_CLASS} w-full text-left`}
              >
                <SignOut className="h-4 w-4 shrink-0 sm:h-[1.125rem] sm:w-[1.125rem]" aria-hidden="true" />
                Sign Out
              </button>
            </SignedIn>
          </div>
        </Container>
      </div>
    </>,
    document.body
  );
}