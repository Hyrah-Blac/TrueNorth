"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";
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
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock background scroll and allow Escape to dismiss while the mobile
  // drawer is open — small touches that make it feel like a considered
  // overlay rather than a bolted-on menu.
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const sidebarFooter = (
    <div className="flex items-center gap-3">
      {/* Static avatar — pointer-events-none makes it display-only, not clickable */}
      <div className="pointer-events-none select-none">
        <UserButton appearance={{ variables: { colorPrimary: "#2b5bbf" } }} />
      </div>
      <div>
        <span className="block text-xs font-medium text-slate-200">Account</span>
        <span className="block text-[10px] uppercase tracking-widest text-slate-500">Admin</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "rgb(250 249 246)" }}>
      <SkipLink />

      {/* Sidebar — desktop only */}
      <div className="hidden lg:block">
        <DashboardSidebar items={items} footer={sidebarFooter} />
      </div>

      {/* Mobile sidebar overlay — always mounted so the slide/fade can
          transition both ways instead of popping in and out instantly. */}
      <div
        className={`fixed inset-0 z-50 flex lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`relative shadow-[4px_0_24px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <DashboardSidebar items={items} footer={sidebarFooter} />
        </div>
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile-only header — just hamburger + page title. Hidden on desktop where sidebar shows logo. */}
        <header
          className="flex h-14 shrink-0 items-center gap-3 px-4 sm:h-16 lg:hidden"
          style={{
            background: "rgb(11 18 28)",
            borderBottom: "1px solid rgb(255 255 255 / 0.06)",
          }}
        >
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors duration-200 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/70"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
          <span className="spec-readout truncate text-[10px] uppercase tracking-widest text-slate-400">
            {title}
          </span>
        </header>

        {/* Main content */}
        <main
          id="main-content"
          aria-label={title}
          className="flex-1 p-4 sm:p-6 lg:p-10"
          style={{ background: "rgb(250 249 246)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}