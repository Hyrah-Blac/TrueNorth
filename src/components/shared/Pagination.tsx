import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav className="mt-14 flex items-center justify-center gap-3" aria-label="Pagination">
      <Link
        href={buildHref(page - 1)}
        aria-disabled={!hasPrev}
        tabIndex={hasPrev ? undefined : -1}
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 hover:shadow-soft active:translate-y-0 active:scale-95 ${
          !hasPrev ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Previous page</span>
      </Link>

      <span className="spec-readout px-4 text-sm text-slate-600">
        {page} / {totalPages}
      </span>

      <Link
        href={buildHref(page + 1)}
        aria-disabled={!hasNext}
        tabIndex={hasNext ? undefined : -1}
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 hover:shadow-soft active:translate-y-0 active:scale-95 ${
          !hasNext ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Next page</span>
      </Link>
    </nav>
  );
}
