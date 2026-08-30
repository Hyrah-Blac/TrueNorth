import type { ReactNode } from "react";
import Link from "next/link";

interface CardActionLinkProps {
  href: string;
  variant: "outline" | "primary";
  external?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

/**
 * Not a wrapper around the shared `Button` component: `Button`'s smallest
 * size (`md`) uses px-7/py-3 padding sized for full-width page CTAs, which
 * overflows a 280px card when two sit side by side. This mirrors the same
 * colors, radius, and type treatment at a size built for that context,
 * rather than fighting Button's utility-class specificity with overrides.
 *
 * rounded-xl, not rounded-full — the brand's "elegant rectangle, never a
 * pill" rule (see ChatInput's send button) applies here too; this had
 * drifted from it. Outline hover also unified to blue rather than the
 * stray sky accent, matching every other hover state in the card family.
 */
export function CardActionLink({ href, variant, external, onClick, children }: CardActionLinkProps) {
  const className =
    variant === "primary"
      ? "flex-1 rounded-xl border border-blue-500 bg-blue-500 px-3 py-2 text-center font-display text-[11px] font-medium uppercase tracking-wide text-white transition-colors duration-300 hover:bg-blue-700 hover:border-blue-700"
      : "flex-1 rounded-xl border border-slate-300 px-3 py-2 text-center font-display text-[11px] font-medium uppercase tracking-wide text-navy-900 transition-colors duration-300 hover:border-blue-400 hover:text-blue-600";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}