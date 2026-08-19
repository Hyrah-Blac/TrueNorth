import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  /** Use the monospace data font with tabular numerals — for phone
      numbers and other number-heavy fields where the default body
      typeface's digit glyphs read awkwardly at a glance. */
  numeric?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ hasError, numeric, className = "", placeholder = " ", style, ...props }, ref) => (
    <input
      ref={ref}
      placeholder={placeholder}
      {...props}
      style={numeric ? { fontFamily: "var(--font-data, ui-monospace, monospace)", ...style } : style}
      className={`peer w-full rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition-colors duration-200 disabled:bg-slate-50 disabled:text-slate-400 ${
        numeric ? "tabular-nums tracking-wide" : ""
      } ${
        hasError
          ? "border-red-300 focus:border-red-400"
          : "border-slate-200 hover:border-slate-300 focus:border-sky-500"
      } ${className}`}
    />
  ),
);

TextInput.displayName = "TextInput";