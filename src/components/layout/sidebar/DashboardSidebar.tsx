"use client";

import { cloneElement, isValidElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/10 bg-navy-950">
      <nav className="flex-1 space-y-1 p-5">
        {items.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

          const icon = isValidElement<{ className?: string }>(item.icon)
            ? cloneElement(item.icon, {
                className: `h-4 w-4 shrink-0 transition-colors ${
                  isActive ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300"
                }`,
              })
            : item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-medium transition-all duration-300 ${
                isActive ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {isActive ? (
                <span className="absolute -left-5 h-5 w-0.5 rounded-full bg-sky-500" aria-hidden="true" />
              ) : null}
              {icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      {footer ? <div className="border-t border-white/10 p-5">{footer}</div> : null}
    </aside>
  );
}