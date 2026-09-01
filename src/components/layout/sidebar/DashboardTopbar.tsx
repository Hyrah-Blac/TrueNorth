"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { List, SignOut, X, CalendarBlank } from "@phosphor-icons/react";
import { GlobalSearch } from "./GlobalSearch";
import { formatDate } from "@/utils/date";

export function DashboardTopbar({
  title,
  mobileOpen,
  onMobileToggle,
}: {
  title: string;
  mobileOpen: boolean;
  onMobileToggle: () => void;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [today, setToday] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setToday(formatDate(new Date()));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const displayName = user?.fullName || user?.firstName || "Admin";
  const initial = (user?.firstName?.[0] ?? displayName[0] ?? "?").toUpperCase();

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

  return (
    <header
      aria-label={title}
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 px-5 sm:px-7"
      style={{
        background: "#f5f7f5",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        onClick={onMobileToggle}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <List className="h-4 w-4" />}
      </button>

      {/* Global search */}
      <GlobalSearch />

      {/* Right chip cluster — date + bell + avatar in a green pill */}
      <div
        className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full px-1 py-1"
        style={{ background: "#2d5a3d" }}
      >
        {/* Date chip */}
        <span className="hidden items-center gap-1.5 rounded-full border border-dashed border-white/25 px-3 py-1.5 text-[11px] font-medium text-white/85 sm:flex">
          <CalendarBlank className="h-3.5 w-3.5" aria-hidden="true" />
          {today ?? "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
        </span>

        {/* Avatar */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="block h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30 transition-all duration-200 hover:ring-white/60"
          >
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center bg-white text-xs font-bold"
                style={{ color: "#2d5a3d" }}
              >
                {initial}
              </span>
            )}
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+10px)] w-52 overflow-hidden rounded-xl border py-1"
              style={{
                background: "#ffffff",
                borderColor: "rgb(226 232 240)",
                boxShadow: "0 8px 24px rgb(15 23 42 / 0.10), 0 2px 6px rgb(15 23 42 / 0.06)",
              }}
            >
              <div className="truncate border-b border-slate-100 px-3.5 py-2.5 text-xs font-medium text-slate-500">
                {displayName}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SignOut className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                {signingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}