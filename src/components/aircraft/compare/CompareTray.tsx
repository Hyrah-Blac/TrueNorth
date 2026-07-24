"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Scale, ArrowRight } from "lucide-react";
import { useCompareList, MAX_COMPARE_ITEMS } from "@/hooks/useCompareList";

export function CompareTray() {
  const { items, hydrated, remove, clear } = useCompareList();

  if (!hydrated || items.length === 0) return null;

  const compareHref = `/fleet/compare?slugs=${items.map((item) => item.slug).join(",")}`;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 animate-fade-up-editorial px-4 pb-4 sm:px-6 lg:px-10"
      role="region"
      aria-label="Aircraft comparison tray"
    >
      <div className="mx-auto flex max-w-container flex-col gap-4 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lifted backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white">
            <Scale className="h-4 w-4" aria-hidden="true" />
          </span>
          <ul className="flex items-center gap-2.5">
            {items.map((item) => (
              <li
                key={item.slug}
                className="group relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100"
                title={item.name}
              >
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <span className="px-1 text-center text-[9px] font-medium text-slate-500">{item.name}</span>
                )}
                <button
                  type="button"
                  onClick={() => remove(item.slug)}
                  aria-label={`Remove ${item.name} from comparison`}
                  className="absolute inset-0 flex items-center justify-center bg-navy-950/0 text-white opacity-0 transition-all duration-300 hover:bg-navy-950/70 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
            {Array.from({ length: Math.max(0, MAX_COMPARE_ITEMS - items.length) }).map((_, index) => (
              <li
                key={`empty-${index}`}
                className="hidden h-14 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 text-[10px] uppercase tracking-wide text-slate-300 sm:flex"
              >
                Empty
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium uppercase tracking-wide text-slate-400 transition-colors hover:text-slate-600"
          >
            Clear
          </button>
          <Link
            href={items.length >= 2 ? compareHref : "#"}
            aria-disabled={items.length < 2}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-sky-500 bg-navy-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white shadow-soft transition-all duration-500 ease-editorial ${
              items.length >= 2
                ? "hover:-translate-y-0.5 hover:bg-sky-500 hover:text-navy-950 hover:shadow-glow"
                : "pointer-events-none opacity-40"
            }`}
          >
            Compare {items.length > 1 ? `(${items.length})` : ""}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
