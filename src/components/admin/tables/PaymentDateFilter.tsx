"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export function PaymentDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setDate(key: "dateFrom" | "dateTo", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // A changed date range invalidates the current page position.
    params.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const inputClass =
    "rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500";

  return (
    <div className={`flex items-center gap-2 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      <label className="flex items-center gap-1.5 text-xs text-slate-500">
        From
        <input
          type="date"
          defaultValue={searchParams.get("dateFrom") ?? ""}
          onChange={(event) => setDate("dateFrom", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-slate-500">
        To
        <input
          type="date"
          defaultValue={searchParams.get("dateTo") ?? ""}
          onChange={(event) => setDate("dateTo", event.target.value)}
          className={inputClass}
        />
      </label>
    </div>
  );
}
