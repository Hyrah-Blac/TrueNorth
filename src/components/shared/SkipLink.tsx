export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-navy-900 focus:shadow-lifted"
    >
      Skip to main content
    </a>
  );
}
