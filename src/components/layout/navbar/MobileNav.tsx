"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Container } from "../container/Container";
import { Button } from "@/components/shared/buttons/Button";
import { siteConfig } from "@/lib/config/site";

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

// Shared style for the flat top-level links below — kept as constants so
// all links stay visually identical without repeating the class list.
// The last link (Contact) skips the bottom border since it's followed by
// the auth/CTA section's own border. Matches the desktop nav's hover
// treatment (subtle background wash + accent text) and transition timing.
const LINK_CLASS =
  "font-display rounded-md border-b border-white/10 px-2 py-4 text-lg font-medium text-white/90 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]";
const LAST_LINK_CLASS =
  "font-display rounded-md px-2 py-4 text-lg font-medium text-white/90 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]";

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <div
      className={`overflow-y-auto border-t border-white/10 bg-navy-950 transition-all duration-500 ease-editorial lg:hidden ${
        open ? "max-h-[calc(100vh-5rem)] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <Container className="flex flex-col py-6">
        <Link href="/fleet" onClick={onClose} className={LINK_CLASS}>
          Fleet
        </Link>
        <Link href="/destinations" onClick={onClose} className={LINK_CLASS}>
          Destinations
        </Link>
        <Link href="/about" onClick={onClose} className={LINK_CLASS}>
          About
        </Link>
        <Link href="/contact" onClick={onClose} className={LAST_LINK_CLASS}>
          Contact
        </Link>

        <div className="mt-5 border-t border-white/10 pt-6">
          <SignedOut>
            <Link
              href="/sign-in"
              onClick={onClose}
              className="font-display block rounded-md px-2 py-3 text-base font-medium text-white/80 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]"
            >
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              onClick={onClose}
              className="font-display block rounded-md px-2 py-3 text-base font-medium text-white/80 transition-colors duration-300 hover:bg-white/5 hover:text-[#4EA8DE]"
            >
              Dashboard
            </Link>
          </SignedIn>
          <div className="px-2 pt-3">
            <Button href="/request-charter" variant="primary" size="md" className="w-full" onClick={onClose}>
              Request Charter
            </Button>
          </div>
          <a
            href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            className="mt-5 block px-2 text-center text-xs uppercase tracking-[0.14em] text-slate-400 transition-colors duration-300 hover:text-slate-300"
          >
            {siteConfig.phoneDisplay}
          </a>
        </div>
      </Container>
    </div>
  );
}