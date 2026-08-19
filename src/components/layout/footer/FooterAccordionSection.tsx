"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-xs font-medium tracking-wide text-white/50">{children}</p>
  );
}

// Collapsible below the `sm` breakpoint (default closed, tap the
// heading to expand) — full phone-width only. At `sm` and up there's
// enough room to just show Explore/Contact open side-by-side like a
// normal footer, so the toggle disables itself there rather than
// leaving two empty collapsed panels sitting side-by-side on a tablet
// that has the space to show them. `sm:pointer-events-none` on the
// button and `sm:hidden` on the chevron don't just hide the
// affordance — they disable the click entirely, so there's no dead
// clickable heading once the accordion behavior no longer applies.
// Content stays in the DOM at every breakpoint (good for SEO/no-JS);
// only its visible height and opacity change, using a grid-rows
// animation instead of hidden/block so it can transition smoothly
// rather than snapping open.
export function FooterAccordionSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="py-4 sm:py-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left sm:pointer-events-none sm:cursor-default"
      >
        <FooterHeading>{title}</FooterHeading>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/50 transition-transform duration-300 ease-out sm:hidden ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-out sm:!grid-rows-[1fr] sm:!opacity-100 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pt-3 sm:pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}