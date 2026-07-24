"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Compass } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { DashboardSidebar, type SidebarNavItem } from "./DashboardSidebar";
import { SkipLink } from "@/components/shared/SkipLink";
import { siteConfig } from "@/lib/config/site";

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
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="hidden items-center gap-2 lg:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 ring-1 ring-inset ring-gold-500/40">
                <Compass className="h-3.5 w-3.5 text-navy-950" aria-hidden="true" />
              </span>
              <span className="font-editorial text-lg italic text-white">{siteConfig.shortName}</span>
            </Link>
            <h1 className="font-display text-sm font-semibold uppercase tracking-wide text-white lg:ml-4 lg:border-l lg:border-white/10 lg:pl-4">
              {title}
            </h1>
          </div>

          <UserButton
            afterSwitchSessionUrl="/"
            appearance={{ variables: { colorPrimary: "#c8a95b" } }}
          />
        </header>

        <main id="main-content" className="flex-1 p-4 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
