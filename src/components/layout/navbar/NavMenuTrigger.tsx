"use client";

import { List, X } from "@phosphor-icons/react";

// Extracted from the old NavbarMobileTrigger — same hamburger button, but
// now visible at every breakpoint (no more lg:hidden) since the slide-out
// menu is the primary nav everywhere, not just on mobile.
//
// `solid` mirrors the navbar's own scrolled/white-background state (see
// Navbar.tsx) — off-white icon on the transparent bar, brand blue-500 on
// the solid white bar, since off-white-on-white would be invisible.
export function NavMenuTrigger({
  open,
  onToggle,
  solid,
}: {
  open: boolean;
  onToggle: () => void;
  solid?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 w-10 items-center justify-center transition-colors duration-300 ${
        solid ? "text-navy-900 hover:text-blue-600" : "text-white hover:text-[#6EC5F2]"
      }`}
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      {open ? <X className="h-6 w-6" weight="regular" /> : <List className="h-6 w-6" weight="regular" />}
    </button>
  );
}