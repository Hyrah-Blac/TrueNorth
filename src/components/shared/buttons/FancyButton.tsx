import type { ButtonHTMLAttributes, ReactNode } from "react";

interface FancyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  children: ReactNode;
}

// Bespoke CTA treatment: forest-green gradient fill, a soft glow shadow,
// and a light diagonal shine that sweeps across on hover. Reserved for
// the single highest-emphasis action on a page (Settings' "Save
// Changes", a list page's primary "Add X" button) — the shared pill
// <Button> in this same folder covers every ordinary action elsewhere in
// the app, so this shouldn't be reached for for everyday buttons.
// Color matches the admin dashboard's green accent (#2d5a3d) so the CTA
// reads as part of the same premium admin surface, not a leftover navy
// theme from elsewhere in the app.
export function FancyButton({
  icon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: FancyButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition-shadow duration-300 disabled:pointer-events-none disabled:opacity-60 ${className}`}
      style={{
        background: "linear-gradient(135deg, rgb(23 42 31) 0%, rgb(45 90 61) 55%, rgb(74 138 96) 100%)",
        boxShadow: "0 6px 16px -6px rgba(45,90,61,0.5), inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {/* Shine sweep — positioned (absolute) so it paints in its own
          stacking layer; the icon/text below are given `relative` for
          the same reason, so they paint above this regardless of DOM
          order among non-positioned siblings. */}
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
        aria-hidden="true"
      />
      {icon ? <span className="relative flex items-center">{icon}</span> : null}
      <span className="relative">{children}</span>
    </button>
  );
}