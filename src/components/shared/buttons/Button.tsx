import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "outline-light" | "ghost" | "blue";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: ReactNode;
}

// Primary: solid navy fill, white text — the main site CTA color, matching
// the navy/sky palette used across the fleet components (filter pills,
// compare tray, etc). Secondary / outline-light: glass/white-text, for use
// over photography or dark sections ONLY (white text is invisible on light
// backgrounds). Outline: the light-background equivalent of secondary —
// dark text, a neutral border, for use on white/slate surfaces. Blue: a
// flat, static CTA pill — solid blue, white text, no color shift on hover
// besides a shade change. Used where the button needs to stay visually
// still (e.g. sitting next to a photo) rather than "lift off" like
// primary used to.
const variantStyles: Record<ButtonVariant, string> = {
  primary: "border border-blue-500 bg-blue-500 text-white transition-colors hover:bg-blue-700 hover:border-blue-700",
  secondary:
    "border border-glass-border bg-glass-surface text-white backdrop-blur-md hover:border-sky-400 hover:bg-white/[0.08] hover:-translate-y-0.5",
  outline:
    "border border-slate-300 text-navy-900 hover:border-sky-500 hover:text-sky-600 hover:-translate-y-0.5",
  "outline-light": "border border-white/25 text-white",
  ghost: "text-navy-900 hover:bg-slate-100",
  blue: "border border-blue-500 bg-blue-500 text-white transition-colors hover:bg-blue-700 hover:border-blue-700",
};

// "sm" is for compact, dense contexts — a sidebar stacked above other
// controls, a card footer — where the "lg"/"md" scale (built for a CTA
// standing alone in open space) reads oversized next to smaller
// surrounding type.
const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-[0.6875rem]",
  md: "px-7 py-3 text-xs",
  lg: "px-9 py-4 text-sm",
};

const baseClass =
  "font-display inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-[0.12em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50 disabled:pointer-events-none";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  icon,
  href,
  type = "button",
  onClick,
  disabled,
}: BaseProps & {
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const classes = `${baseClass} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {children}
        {icon}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
      {icon}
    </button>
  );
}