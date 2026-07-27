"use client";

import { List, X } from "@phosphor-icons/react";

// Extracted from the old NavbarMobileTrigger — same hamburger button, but
// now visible at every breakpoint (no more lg:hidden) since the slide-out
// menu is the primary nav everywhere, not just on mobile.
export function NavMenuTrigger({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center text-[#F7F6F2]/90 transition-colors duration-300 hover:text-[#4EA8DE]"
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      {open ? <X className="h-5 w-5" weight="thin" /> : <List className="h-5 w-5" weight="thin" />}
    </button>
  );
}