"use client";

import { cloneElement, isValidElement, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Compass, SignOut } from "@phosphor-icons/react";

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
  const router = useRouter();
  const { signOut } = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch {
      setSigningOut(false);
    }
  };

  const renderNavItem = (item: SidebarNavItem) => {
    const isActive = item.exact
      ? pathname === item.href
      : pathname.startsWith(item.href);

    const icon = isValidElement<{ className?: string }>(item.icon)
      ? cloneElement(item.icon, {
          className: `h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${
            isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
          }`,
        })
      : item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13px] font-medium tracking-[0.01em] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/50 ${
          isActive ? "text-white" : "text-white/60 hover:text-white/90"
        }`}
        style={
          isActive
            ? {
                background: "rgba(255,255,255,0.18)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
              }
            : undefined
        }
      >
        {icon}
        <span className="truncate">{item.label}</span>
        {isActive && (
          <span
            className="ml-auto h-2 w-2 shrink-0 rounded-full bg-white"
            aria-hidden="true"
          />
        )}
      </Link>
    );
  };

  return (
    <aside
      className="sticky top-0 flex h-screen w-56 shrink-0 flex-col overflow-hidden xl:w-60"
      style={{
        background:
          "linear-gradient(180deg, #2d5a3d 0%, #3a7050 60%, #2d5a3d 100%)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link href="/" aria-label="Back to home" className="flex items-center transition-opacity hover:opacity-80">
          <LogoImage />
        </Link>
      </div>

      <div className="mx-4 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        {items.map(renderNavItem)}
      </nav>

      {/* Logout pill */}
      <div className="shrink-0 px-4 pb-6 pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white/90 backdrop-blur-sm transition-all duration-150 hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <SignOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? "Logging out…" : "Logout"}
        </button>
      </div>
    </aside>
  );
}

function LogoImage() {
  return (
    <span className="flex items-center">
      <Image
        src="/logo/logo.png"
        alt="True North Charters"
        width={140}
        height={36}
        priority
        className="h-8 w-auto max-w-[140px] object-contain object-left brightness-0 invert"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          target.style.display = "none";
          const fallback = target.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <span
        className="hidden items-center text-[15px] font-semibold tracking-tight text-white"
        style={{ display: "none" }}
      >
        <Compass className="mr-1.5 h-4 w-4 text-white" weight="fill" aria-hidden="true" />
        Logo Here
      </span>
    </span>
  );
}