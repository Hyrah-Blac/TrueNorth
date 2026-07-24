import Link from "next/link";
import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "outline-light" | "ghost";
type ButtonSize = "md" | "lg";

interface BaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: ReactNode;
}

// Primary: dark ground, gold hairline border, white text — fills gold on
// hover. Secondary / outline-light: glass/white-text, for use over
// photography or dark sections ONLY (white text is invisible on light
// backgrounds). Outline: the light-background equivalent of secondary —
// dark text, a neutral border, for use on white/slate surfaces.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-sky-500 bg-sky-500 text-navy-950 shadow-soft hover:bg-sky-600 hover:border-sky-600 hover:shadow-glow hover:-translate-y-0.5",
  secondary:
    "border border-glass-border bg-glass-surface text-white backdrop-blur-md hover:border-sky-400 hover:bg-white/[0.08] hover:-translate-y-0.5",
  outline:
    "border border-slate-300 text-navy-900 hover:border-sky-500 hover:text-sky-600 hover:-translate-y-0.5",
  "outline-light": "border border-white/25 text-white hover:border-sky-400 hover:bg-white/5",
  ghost: "text-navy-900 hover:bg-slate-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "px-7 py-3 text-xs",
  lg: "px-9 py-4 text-sm",
};

const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium uppercase tracking-[0.12em] transition-all duration-500 ease-editorial focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50 disabled:pointer-events-none";

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