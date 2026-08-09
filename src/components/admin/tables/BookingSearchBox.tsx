"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

export function BookingSearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    // A new search invalidates whatever page the admin was on.
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className={`relative max-w-sm transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        type="search"
        placeholder="Search reference, customer, aircraft…"
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
      />
    </div>
  );
}
