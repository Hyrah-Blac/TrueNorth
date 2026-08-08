import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className = "", rows = 4, placeholder = " ", ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      placeholder={placeholder}
      {...props}
      className={`peer w-full rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition-colors duration-200 ${
        hasError
          ? "border-red-300 focus:border-red-400"
          : "border-slate-200 hover:border-slate-300 focus:border-sky-500"
      } ${className}`}
    />
  ),
);

Textarea.displayName = "Textarea";