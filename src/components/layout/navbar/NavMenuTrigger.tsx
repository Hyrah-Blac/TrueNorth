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
      className={`flex h-9 w-9 items-center justify-center transition-colors duration-300 ${
        solid ? "text-blue-500 hover:text-blue-700" : "text-[#F7F6F2]/90 hover:text-[#4EA8DE]"
      }`}
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      {open ? <X className="h-5 w-5" weight="thin" /> : <List className="h-5 w-5" weight="thin" />}
    </button>
  );
}