import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

/**
 * Renders as a Fragment (select + chevron icon), not a wrapping div —
 * intentional. It's paired with FormField, whose own wrapper already
 * provides `position: relative`. Wrapping here too would put the chevron's
 * positioning div between `select.peer` and the floating `<label>`,
 * breaking the CSS sibling relationship the label's peer-* classes rely on.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ hasError, className = "", children, ...props }, ref) => (
    <>
      <select
        ref={ref}
        {...props}
        className={`peer w-full appearance-none rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 ${
          hasError
            ? "border-red-300 focus:shadow-[0_0_0_3px_rgb(176_62_52_/_0.14)]"
            : "border-slate-200 hover:border-slate-300 focus:border-sky-500 focus:shadow-focus-ring"
        } ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors duration-300 peer-focus:text-sky-500"
        aria-hidden="true"
      />
    </>
  ),
);

Select.displayName = "Select";