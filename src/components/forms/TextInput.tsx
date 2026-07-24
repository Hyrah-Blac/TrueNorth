import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ hasError, className = "", placeholder = " ", ...props }, ref) => (
    <input
      ref={ref}
      placeholder={placeholder}
      {...props}
      className={`peer w-full rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 disabled:bg-slate-50 disabled:text-slate-400 ${
        hasError
          ? "border-red-300 focus:shadow-[0_0_0_3px_rgb(176_62_52_/_0.14)]"
          : "border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:shadow-focus-ring"
      } ${className}`}
    />
  ),
);

TextInput.displayName = "TextInput";
