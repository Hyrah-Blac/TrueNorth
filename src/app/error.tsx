"use client";

import { ErrorState } from "@/components/feedback/ErrorState/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Something went wrong"
      description="We hit an unexpected error loading this page. Try again, or head back to the homepage."
      tone="light"
    />
  );
}
