import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface ToggleSwitchProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const ToggleSwitch = forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ label, description, className = "", ...props }, ref) => (
    <label className={`flex cursor-pointer items-start gap-3 ${className}`}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input ref={ref} type="checkbox" {...props} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition-colors duration-300 hover:bg-slate-300 peer-checked:bg-sky-500 peer-checked:hover:bg-sky-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-500" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-editorial peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-medium text-navy-900">{label}</span>
        {description ? <span className="block text-xs text-slate-500">{description}</span> : null}
      </span>
    </label>
  ),
);

ToggleSwitch.displayName = "ToggleSwitch";
