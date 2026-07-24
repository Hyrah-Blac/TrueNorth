"use client";

import { ErrorState } from "@/components/feedback/ErrorState/ErrorState";

export default function AdminError({
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
      title="This page didn't load correctly"
      description="Something went wrong loading this data. Try again, or use the sidebar to navigate elsewhere."
      tone="dark"
    />
  );
}
