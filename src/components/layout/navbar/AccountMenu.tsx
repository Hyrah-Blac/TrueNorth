"use client";

import { SignedIn, useUser } from "@clerk/nextjs";

// ---------------------------------------------------------------------------
// Account indicator — visible at every breakpoint, not just desktop.
// Purely decorative: a signed-in visitor sees their own photo/initials as
// a persistent badge in the bar (mirrors NetJets/VistaJet/Wheels Up member
// portals), but it isn't a link — there's no standalone Profile page to
// send it to. Bookings/Quotes/Payments stay reachable from the hamburger
// menu (see MobileNav.tsx) at every breakpoint, and Sign Out lives there
// too.
//
// The photo sits in its own fixed-size, overflow-hidden circle with
// absolutely-positioned w-full/h-full/object-cover, rather than sizing
// the <img> itself — Clerk profile photos aren't guaranteed square, and
// sizing the element directly let non-square photos show letterboxed
// with visible background around the crop instead of filling the
// circle edge-to-edge. A thin ring (not a hard border) is the same
// device premium chrome sites use for a persistent avatar badge.
// ---------------------------------------------------------------------------

export function AccountMenu({ solid }: { solid: boolean }) {
  const { user } = useUser();

  const initial =
    user?.firstName?.[0]?.toUpperCase() ?? user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ?? "?";

  return (
    <SignedIn>
      <span
        aria-hidden="true"
        className={`relative block h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ${
          solid ? "shadow-sm ring-slate-200" : "ring-white/30"
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
      </span>
    </SignedIn>
  );
}