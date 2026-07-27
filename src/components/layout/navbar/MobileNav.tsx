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
// ---------------------------------------------------------------------------

const LINK_CLASS =
  "font-display rounded-md border-b border-white/10 px-2 py-3 text-sm font-medium text-white/90 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]";

const ACCOUNT_LINK_CLASS =
  "font-display flex items-center gap-3 rounded-md px-2 py-2.5 text-sm font-medium text-white/80 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]";

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
          reference's scrollable drawer). */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-navy-950 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-editorial ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <Container className="flex flex-1 flex-col py-6">
          {open ? (
            <SignedIn>
              {user ? (
                <div className="mb-4 flex items-center gap-3 rounded-md border-b border-white/10 px-2 pb-5">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#12263A] text-sm font-medium text-white">
                      {user.firstName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {user.fullName ?? user.primaryEmailAddress?.emailAddress}
                    </p>
                    <p className="truncate text-xs text-slate-400">
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

          <div className="mt-5 border-t border-white/10 pt-6">
            <SignedOut>
              <Link
                href="/sign-in"
                onClick={onClose}
                className="font-display block rounded-md px-2 py-2.5 text-sm font-medium text-white/80 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]"
              >
                Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <p className="px-2 pb-2 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-slate-500">
                {isAdmin ? "Admin Account" : "My Account"}
              </p>

              {isAdmin ? (
                <Link href="/admin/dashboard" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                  <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Admin Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/dashboard/bookings" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                    <AirplaneTakeoff className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Bookings
                  </Link>
                  <Link href="/dashboard/quotes" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Quotes
                  </Link>
                  <Link href="/dashboard/payments" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                    <Receipt className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Payments
                  </Link>
                  <Link href="/dashboard/profile" onClick={onClose} className={ACCOUNT_LINK_CLASS}>
                    <UserCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Profile
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className={`${ACCOUNT_LINK_CLASS} w-full text-left`}
              >
                <SignOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sign Out
              </button>
            </SignedIn>
          </div>

          <div className="mt-auto pt-8">
            <div className="px-2">
              <Link
                href="/request-charter"
                onClick={onClose}
                className="font-display relative flex items-center justify-center whitespace-nowrap rounded-full border border-[#F0C24B] bg-[#F0C24B] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#1A1200] shadow-[0_4px_24px_rgba(240,194,75,0.24)] transition-all duration-300 ease-out hover:-translate-y-px hover:shadow-[0_10px_32px_rgba(240,194,75,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F0C24B]"
              >
                Request Charter
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </>,
    document.body
  );
}