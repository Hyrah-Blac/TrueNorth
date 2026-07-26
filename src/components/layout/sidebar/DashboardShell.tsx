"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
// Client component, so the default @phosphor-icons/react export is fine
// here (no RSC boundary to cross). Phosphor's hamburger glyph is "List",
// not "Menu" — X and Compass keep their lucide names as-is.
import { List, X, Compass } from "@phosphor-icons/react";
import { UserButton } from "@clerk/nextjs";
import { DashboardSidebar, type SidebarNavItem } from "./DashboardSidebar";
import { SkipLink } from "@/components/shared/SkipLink";

export function DashboardShell({
  items,
  title,
  children,
}: {
  items: SidebarNavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes, so tapping a nav
  // link doesn't leave the overlay open behind the next page.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-navy-950">
      <SkipLink />
      <div className="hidden lg:block">
        <DashboardSidebar items={items} />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <DashboardSidebar items={items} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="glass-panel !border-x-0 !border-t-0 flex h-16 shrink-0 items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </button>
            {/* Home link. Previously hidden on mobile and lacking any hover
                state, so nothing signaled it was clickable — now visible at
                every breakpoint, with a hover treatment and an explicit
                "Home" label (progressively hidden on the very smallest
                screens purely for space, not intent) so it reads as a way
                out of the dashboard, not just a static logo. */}
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/5"
              aria-label="Home"
            >
              {logoError ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 ring-1 ring-inset ring-gold-500/40">
                  <Compass className="h-4 w-4 text-navy-950" aria-hidden="true" />
                </span>
              ) : (
                <Image
                  src="/logo/logo.png"
                  alt=""
                  width={140}
                  height={41}
                  priority
                  onError={() => setLogoError(true)}
                  className="h-9 w-auto object-contain"
                />
              )}
              <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-400 transition-colors group-hover:text-white sm:inline">
                Home
              </span>
            </Link>
          </div>

          <UserButton
            afterSwitchSessionUrl="/"
            appearance={{ variables: { colorPrimary: "#c8a95b" } }}
          />
        </header>

        <main id="main-content" aria-label={title} className="flex-1 p-4 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}