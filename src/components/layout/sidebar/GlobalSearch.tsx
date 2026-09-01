"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useRef, useEffect, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

/**
 * Maps each admin section to the route it should search within and the
 * placeholder text that matches what the section actually searches for.
 * Only pages that genuinely accept ?search= are listed here.
 */
const SEARCH_ROUTES: {
  match: string;
  href: string;
  placeholder: string;
}[] = [
  {
    match: "/admin/bookings",
    href: "/admin/bookings",
    placeholder: "Search bookings, reference, customer…",
  },
  {
    match: "/admin/payments",
    href: "/admin/payments",
    placeholder: "Search payments, reference, customer…",
  },
  {
    match: "/admin/customers",
    href: "/admin/customers",
    placeholder: "Search customers by name or email…",
  },
  {
    match: "/admin/airports",
    href: "/admin/airports",
    placeholder: "Search airports by name or code…",
  },
  {
    match: "/admin/knowledge-base",
    href: "/admin/knowledge-base",
    placeholder: "Search knowledge base articles…",
  },
];

const DEFAULT_ROUTE = {
  href: "/admin/bookings",
  placeholder: "Search bookings, customers, payments…",
};

function resolveRoute(pathname: string) {
  return (
    SEARCH_ROUTES.find((r) => pathname.startsWith(r.match)) ?? DEFAULT_ROUTE
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const route = resolveRoute(pathname);
  const currentSearch = searchParams.get("search") ?? "";

  const [value, setValue] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value when navigating between sections
  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [pathname, searchParams]);

  function navigate(query: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.delete("page");

    startTransition(() => {
      router.push(`${route.href}?${params.toString()}`);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(next), 350);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      navigate(value);
    }
    if (e.key === "Escape") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setValue("");
      navigate("");
      inputRef.current?.blur();
    }
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    navigate("");
    inputRef.current?.focus();
  }

  return (
    <label className="relative flex max-w-xs flex-1 items-center">
      <span className="sr-only">Search</span>
      <MagnifyingGlass
        className={`pointer-events-none absolute left-3.5 h-4 w-4 ${
          isPending ? "text-slate-300" : "text-slate-400"
        }`}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={route.placeholder}
        className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus-visible:outline-none disabled:opacity-50"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        disabled={isPending}
        aria-label={route.placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </label>
  );
}