"use client";

import { cloneElement, isValidElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass } from "@phosphor-icons/react";

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}

export function DashboardSidebar({
  items,
  footerItems,
}: {
  items: SidebarNavItem[];
  footerItems?: SidebarNavItem[];
}) {
  const pathname = usePathname();

  const renderNavItem = (item: SidebarNavItem) => {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

    const icon = isValidElement<{ className?: string }>(item.icon)
      ? cloneElement(item.icon, {
          className: `h-[15px] w-[15px] shrink-0 transition-colors duration-150 ${
            isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
          }`,
        })
      : item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px] font-medium tracking-[0.01em] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500/40 ${
          isActive
            ? "text-blue-700"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
        style={isActive ? { background: "rgb(239 246 255)" } : undefined}
      >
        {isActive && (
          <span
            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
            style={{ background: "rgb(59 130 246)" }}
            aria-hidden="true"
          />
        )}
        {icon}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      className="sticky top-0 flex h-screen w-48 shrink-0 flex-col overflow-hidden xl:w-52"
      style={{
        background: "#ffffff",
        borderRight: "1px solid rgb(230 234 240)",
      }}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href="/" aria-label="Back to home" className="transition-opacity hover:opacity-60">
          <LogoImage />
        </Link>
      </div>

      <div className="mx-3 h-px" style={{ background: "rgb(226 232 240)" }} />

      {/* Main nav — grows to fill available space */}
      <nav className="flex-1 overflow-y-auto px-2 py-2.5">
        {items.map(renderNavItem)}
      </nav>

      {/* Footer nav — pinned to bottom */}
      {footerItems && footerItems.length > 0 && (
        <>
          <div className="mx-3 h-px" style={{ background: "rgb(226 232 240)" }} />
          <nav className="shrink-0 px-2 py-2.5">
            {footerItems.map(renderNavItem)}
          </nav>
        </>
      )}
    </aside>
  );
}

function LogoImage() {
  return (
    <span className="flex items-center">
      <Image
        src="/logo/logo.png"
        alt="True North Charters"
        width={110}
        height={30}
        priority
        className="h-[22px] w-auto object-contain"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <span
        className="hidden items-center gap-1.5 text-[13px] font-semibold tracking-tight text-slate-800"
        style={{ display: "none" }}
      >
        <Compass className="h-4 w-4 text-blue-600" weight="fill" aria-hidden="true" />
        True North
      </span>
    </span>
  );
}