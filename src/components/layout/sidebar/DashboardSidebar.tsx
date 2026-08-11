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
  footer,
}: {
  items: SidebarNavItem[];
  footer?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 flex h-screen w-64 shrink-0 flex-col"
      style={{
        background: "linear-gradient(180deg, rgb(11 18 28) 0%, rgb(9 14 22) 100%)",
        borderRight: "1px solid rgb(255 255 255 / 0.07)",
      }}
    >
      {/* Subtle vertical accent on the right edge */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgb(43 91 191 / 0.25) 50%, transparent 100%)" }}
        aria-hidden="true"
      />

      {/* Logo — top of sidebar, same height as header bar */}
      <div
        className="flex h-16 shrink-0 items-center px-5"
        style={{ borderBottom: "1px solid rgb(255 255 255 / 0.06)" }}
      >
        <Link href="/" aria-label="Back to home" className="transition-opacity hover:opacity-75">
          <LogoImage />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          const icon = isValidElement<{ className?: string }>(item.icon)
            ? cloneElement(item.icon, {
                className: `h-4 w-4 shrink-0 transition-colors duration-200 ${
                  isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                }`,
              })
            : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
              style={
                isActive
                  ? {
                      background: "linear-gradient(90deg, rgb(43 91 191 / 0.18) 0%, rgb(43 91 191 / 0.06) 100%)",
                      boxShadow: "inset 1px 0 0 rgb(43 91 191 / 0.5)",
                    }
                  : undefined
              }
            >
              {isActive ? (
                <span
                  className="absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full"
                  style={{ background: "rgb(108 148 227)", boxShadow: "0 0 8px rgb(43 91 191 / 0.7)" }}
                  aria-hidden="true"
                />
              ) : null}

              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
                  isActive ? "" : "group-hover:bg-white/5"
                }`}
                style={
                  isActive
                    ? { background: "rgb(43 91 191 / 0.2)", boxShadow: "0 0 0 1px rgb(43 91 191 / 0.25)" }
                    : undefined
                }
              >
                {icon}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      {footer ? (
        <div
          className="shrink-0 p-4"
          style={{ borderTop: "1px solid rgb(255 255 255 / 0.07)" }}
        >
          {footer}
        </div>
      ) : null}
    </aside>
  );
}

function LogoImage() {
  return (
    <Image
      src="/logo/logo.png"
      alt="True North Charters"
      width={120}
      height={34}
      priority
      className="h-7 w-auto object-contain"
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.style.display = "none";
        const fallback = target.nextElementSibling as HTMLElement | null;
        if (fallback) fallback.style.display = "flex";
      }}
    />
  );
}