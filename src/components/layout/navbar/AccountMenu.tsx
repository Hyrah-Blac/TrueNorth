"use client";

import Link from "next/link";
import { SignedIn, useUser } from "@clerk/nextjs";

// ---------------------------------------------------------------------------
// Account entry point — visible at every breakpoint, not just desktop.
// Previously this only showed from lg upward, which meant mobile lost its
// only path to Profile once it was removed from MobileNav's account list.
// A signed-in visitor now always has a persistent avatar in the bar
// itself (mirrors NetJets/VistaJet/Wheels Up member portals): a plain
// avatar link straight to Profile, no dropdown. Dashboard/Bookings/
// Quotes/Payments stay reachable from the hamburger menu (see
// MobileNav.tsx) at every breakpoint.
//
// The photo sits in its own fixed-size, overflow-hidden circle with
// absolutely-positioned w-full/h-full/object-cover, rather than sizing
// the <img> itself — Clerk profile photos aren't guaranteed square, and
// sizing the element directly let non-square photos show letterboxed
// with visible background around the crop instead of filling the
// circle edge-to-edge. A thin ring (not a hard border) is the same
// device premium chrome sites use for a persistent avatar — quiet on
// the dark hero, a touch more defined once the bar goes solid — plus a
// small hover lift so it reads as an interactive control, not a static
// badge.
// ---------------------------------------------------------------------------

export function AccountMenu({ solid }: { solid: boolean }) {
  const { user } = useUser();

  const initial =
    user?.firstName?.[0]?.toUpperCase() ?? user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "?";

  return (
    <SignedIn>
      <Link
        href="/dashboard/profile"
        aria-label="Your profile"
        className={`group relative block h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 transition-all duration-200 hover:scale-105 ${
          solid
            ? "shadow-sm ring-slate-200 hover:ring-sky-300"
            : "ring-white/30 hover:ring-white/60"
        }`}
      >
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center text-xs font-semibold ${
              solid ? "bg-navy-950/8 text-navy-900" : "bg-white/15 text-white"
            }`}
          >
            {initial}
          </span>
        )}
      </Link>
    </SignedIn>
  );
}