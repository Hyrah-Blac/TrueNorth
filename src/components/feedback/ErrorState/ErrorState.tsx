"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/shared/buttons/Button";

export function ErrorState({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. You can try again, or head back and pick up where you left off.",
  tone = "light",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  tone?: "light" | "dark";
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDark = tone === "dark";

  return (
    <div
      className={`flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center ${
        isDark ? "text-white" : ""
      }`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          isDark ? "bg-white/10 text-champagne-400" : "bg-red-50 text-red-500"
        }`}
      >
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h1 className={`font-display text-xl font-semibold ${isDark ? "text-white" : "text-navy-900"}`}>{title}</h1>
      <p className={`max-w-sm text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        {description}
      </p>
      {error.digest ? (
        <p className={`spec-readout text-[0.6875rem] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Reference: {error.digest}
        </p>
      ) : null}
      <Button variant={isDark ? "secondary" : "outline"} size="sm" onClick={reset} className="mt-2">
        Try Again
      </Button>
    </div>
  );
}