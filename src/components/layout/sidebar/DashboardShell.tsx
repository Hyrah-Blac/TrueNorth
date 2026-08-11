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

      {/* Mobile sidebar overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative">
            <DashboardSidebar items={items} footer={sidebarFooter} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile-only header — just hamburger + page title. Hidden on desktop where sidebar shows logo. */}
        <header
          className="flex h-16 shrink-0 items-center gap-3 px-4 lg:hidden"
          style={{
            background: "rgb(11 18 28)",
            borderBottom: "1px solid rgb(255 255 255 / 0.06)",
          }}
        >
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
          <span className="spec-readout text-[10px] uppercase tracking-widest text-slate-400">{title}</span>
        </header>

        {/* Main content */}
        <main
          id="main-content"
          aria-label={title}
          className="flex-1 p-6 lg:p-10"
          style={{ background: "rgb(250 249 246)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}