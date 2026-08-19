import type { ReactNode } from "react";

/**
 * Floating-label field wrapper. Requires the child input/textarea to carry
 * the `peer` class and a (possibly empty) `placeholder` attribute — see
 * TextInput / Textarea, which set both by default.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="relative">
        {children}
        <label
          htmlFor={htmlFor}
          className="pointer-events-none absolute left-3.5 top-1/2 origin-left -translate-y-1/2 text-sm text-slate-500 transition-all duration-200 ease-editorial peer-focus:top-2.5 peer-focus:-translate-y-0 peer-focus:text-xs peer-focus:text-sky-600 peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-slate-500"
        >
          {label} {required ? <span className="text-sky-600">*</span> : null}
        </label>
      </div>
      {hint && !error ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}