"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar, type SidebarNavItem } from "./DashboardSidebar";
import { DashboardTopbar } from "./DashboardTopbar";
import { SkipLink } from "@/components/shared/SkipLink";

export function DashboardShell({
  items,
  footerItems,
  title,
  children,
}: {
  items: SidebarNavItem[];
  footerItems?: SidebarNavItem[];
  title: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  return (
    <div className="relative flex min-h-screen" style={{ background: "#2d5a3d" }}>
      <SkipLink />

      {/* Sidebar — sits behind the main card */}
      <div className="relative hidden lg:block" style={{ zIndex: 10 }}>
        <DashboardSidebar items={items} footerItems={footerItems} />
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 flex lg:hidden ${mobileOpen ? "" : "pointer-events-none"}`}
        style={{ zIndex: 50 }}
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`relative shadow-[4px_0_24px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <DashboardSidebar items={items} footerItems={footerItems} />
        </div>
      </div>

      {/* Main column — white rounded card floating over the green sidebar */}
      <div
        className="relative flex h-screen flex-1 flex-col"
        style={{
          zIndex: 20,
          background: "#f0f4f0",
          borderRadius: "24px 0 0 24px",
          overflow: "hidden",
        }}
      >
        <DashboardTopbar
          title={title}
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((open) => !open)}
        />

        <main
          id="main-content"
          aria-label={title}
          className="flex-1 overflow-y-auto p-4 sm:p-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}