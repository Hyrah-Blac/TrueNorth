import { forwardRef, useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Plain, label-left field set used only on the charter request "Your
 * Details" step. Deliberately separate from the shared FormField/TextInput/
 * Select/Textarea in src/components/forms — those use a floating label
 * that lives inside the input box, and are shared with admin dialogs, the
 * dashboard, and booking flows, so changing them would restyle every form
 * in the app. This step wants the plainer, classic label-beside-field
 * layout instead, so it gets its own small set of building blocks.
 */

const FIELD_BASE =
  "w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-navy-900 outline-none placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] focus:outline-none focus-visible:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none";

const FIELD_ERROR = "border-red-300";

export function PlainField({
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
    <div className={`flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm text-navy-900 sm:w-28 sm:shrink-0">
        {label}
        {required ? <span className="ml-0.5 text-champagne-600">*</span> : null}
      </label>
      <div className="min-w-0 flex-1">
        {children}
        {hint && !error ? <p className="mt-1.5 text-xs text-champagne-600">{hint}</p> : null}
        {error ? (
          <p className="mt-1.5 text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface PlainInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const PlainInput = forwardRef<HTMLInputElement, PlainInputProps>(
  ({ hasError, className = "", ...props }, ref) => (
    <input ref={ref} {...props} className={`${FIELD_BASE} ${hasError ? FIELD_ERROR : ""} ${className}`} />
  ),
);
PlainInput.displayName = "PlainInput";

interface PlainSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

// Native appearance on purpose — no custom chevron overlay. The default
// browser select affordance is exactly what the reference design calls
// for here, rather than the app-wide custom-chevron Select component.
export const PlainSelect = forwardRef<HTMLSelectElement, PlainSelectProps>(
  ({ hasError, className = "", children, ...props }, ref) => (
    <select ref={ref} {...props} className={`${FIELD_BASE} ${hasError ? FIELD_ERROR : ""} ${className}`}>
      {children}
    </select>
  ),
);
PlainSelect.displayName = "PlainSelect";

interface PlainTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const PlainTextarea = forwardRef<HTMLTextAreaElement, PlainTextareaProps>(
  ({ hasError, className = "", rows = 10, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      {...props}
      className={`${FIELD_BASE} resize-none ${hasError ? FIELD_ERROR : ""} ${className}`}
    />
  ),
);
PlainTextarea.displayName = "PlainTextarea";

// Windows doesn't ship flag emoji glyphs — 🇰🇪 etc. render there as plain
// two-letter text ("KE") instead of a picture, since Windows has no color
// flag font. Remote flag-image CDNs are a common fix, but that trades one
// failure mode for another — blocked/offline dev environments and strict
// CSPs just render blank. These are small inline SVGs bundled directly in
// the code instead, so there's no network request that can fail: they
// render identically everywhere. Simplified (no fine heraldic detail like
// Uganda's crane or Kenya's shield) since that's illegible at this size
// anyway — the color pattern alone is enough to identify each flag.
function Flag({ code, className = "" }: { code: string; className?: string }) {
  const flag = FLAGS[code];
  if (!flag) return <span className={`inline-block shrink-0 rounded-[2px] bg-slate-200 ${className}`} />;
  return (
    <svg viewBox="0 0 30 20" className={`inline-block shrink-0 rounded-[2px] ${className}`} aria-hidden="true">
      {flag}
    </svg>
  );
}

const FLAGS: Record<string, ReactNode> = {
  KE: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6" fill="#000" />
      <rect y="7" width="30" height="6" fill="#bb0000" />
      <rect y="14" width="30" height="6" fill="#006600" />
      <path d="M15 6 L21 10 L15 14 L9 10 Z" fill="#fff" stroke="#000" strokeWidth="0.5" />
      <path d="M15 7.5 L18.5 10 L15 12.5 L11.5 10 Z" fill="#bb0000" />
    </>
  ),
  UG: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          y={(i * 20) / 6}
          width="30"
          height={20 / 6}
          fill={i % 3 === 0 ? "#000" : i % 3 === 1 ? "#fcdc04" : "#d90000"}
        />
      ))}
      <circle cx="15" cy="10" r="4.2" fill="#fff" />
      <ellipse cx="15" cy="11" rx="2.1" ry="2.6" fill="#4b5563" />
      <path d="M13.6 8.7 Q15 7.3 16.4 8.7" stroke="#fbbf24" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      <circle cx="15" cy="9" r="0.6" fill="#d90000" />
    </>
  ),
  // Tanzania's black-and-gold diagonal band runs from the lower hoist
  // (bottom-left) corner to the upper fly (top-right) corner, with green
  // filling the upper-left triangle and blue the lower-right.
  TZ: (
    <>
      <rect width="30" height="20" fill="#0090d0" />
      <polygon points="0,0 30,0 0,20" fill="#1eb53a" />
      <polygon points="30,2.8 2.8,20 0,20 0,17.2 27.2,0 30,0" fill="#fcd116" />
      <polygon points="30,5.2 5.2,20 2.8,20 27.6,0 30,0" fill="#000" />
    </>
  ),
  RW: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="10" fill="#00a1de" />
      <rect y="10" width="30" height="7" fill="#fad201" />
      <rect y="17" width="30" height="3" fill="#20603d" />
      <circle cx="23" cy="4.5" r="2.6" fill="#fad201" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI) / 6;
        const x1 = 23 + Math.cos(angle) * 2.8;
        const y1 = 4.5 + Math.sin(angle) * 2.8;
        const x2 = 23 + Math.cos(angle) * 3.6;
        const y2 = 4.5 + Math.sin(angle) * 3.6;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fad201" strokeWidth="0.5" />;
      })}
    </>
  ),
  BI: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <polygon points="0,0 15,10 0,20" fill="#1eb53a" />
      <polygon points="30,0 15,10 30,20" fill="#1eb53a" />
      <polygon points="0,0 15,10 30,0" fill="#d00000" />
      <polygon points="0,20 15,10 30,20" fill="#d00000" />
      <circle cx="15" cy="10" r="4" fill="#fff" />
      <circle cx="12.5" cy="8.5" r="0.9" fill="#d00000" />
      <circle cx="17.5" cy="8.5" r="0.9" fill="#d00000" />
      <circle cx="15" cy="12" r="0.9" fill="#d00000" />
    </>
  ),
  SS: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6" fill="#000" />
      <rect y="7" width="30" height="6" fill="#d21034" />
      <rect y="14" width="30" height="6" fill="#078930" />
      <polygon points="0,0 12,10 0,20" fill="#0f47af" />
      <path
        d="M4 8.2 L4.9 10.6 L7.3 10.6 L5.4 12 L6.1 14.4 L4 13 L1.9 14.4 L2.6 12 L0.7 10.6 L3.1 10.6 Z"
        fill="#fcdd09"
      />
    </>
  ),
  ET: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.7" fill="#078930" />
      <rect y="6.7" width="30" height="6.7" fill="#fcdd09" />
      <rect y="13.3" width="30" height="6.7" fill="#da121a" />
      <circle cx="15" cy="10" r="4.2" fill="#0f47af" />
      <path
        d="M15 6.6 L16 9.2 L18.8 9.2 L16.6 10.9 L17.4 13.5 L15 11.9 L12.6 13.5 L13.4 10.9 L11.2 9.2 L14 9.2 Z"
        fill="#fcdd09"
      />
    </>
  ),
  SO: (
    <>
      <rect width="30" height="20" fill="#4189dd" />
      <path
        d="M15 6 L16.1 9.6 L20 9.6 L16.9 11.8 L18 15.4 L15 13.2 L12 15.4 L13.1 11.8 L10 9.6 L13.9 9.6 Z"
        fill="#fff"
      />
    </>
  ),
  // DR Congo's red diagonal stripe (bordered in yellow) also runs from the
  // lower hoist corner to the upper fly corner, the full width of the
  // flag — it previously stopped in the left third and never reached the
  // fly side. The star sits in the upper hoist canton, clear of the band.
  CD: (
    <>
      <rect width="30" height="20" fill="#007fff" />
      <polygon points="30,3 3,20 0,20 0,17 27,0 30,0" fill="#f7d618" />
      <polygon points="30,1.8 1.8,20 0,20 0,18.2 28.2,0 30,0" fill="#ce1021" />
      <path
        d="M5 3 L5.6 4.9 L7.6 4.9 L6 6 L6.6 7.9 L5 6.8 L3.4 7.9 L4 6 L2.4 4.9 L4.4 4.9 Z"
        fill="#f7d618"
      />
    </>
  ),
};

// East African country picker for the phone field. Kenya is the default
// (matches the airline's home market), with the rest of the East African
// Community plus neighboring states available from the dropdown — this is
// deliberately a curated regional list, not a full world country picker,
// since the airline only operates charters within East Africa.
const EAST_AFRICAN_COUNTRIES = [
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "UG", name: "Uganda", dial: "256" },
  { code: "TZ", name: "Tanzania", dial: "255" },
  { code: "RW", name: "Rwanda", dial: "250" },
  { code: "BI", name: "Burundi", dial: "257" },
  { code: "SS", name: "South Sudan", dial: "211" },
  { code: "ET", name: "Ethiopia", dial: "251" },
  { code: "SO", name: "Somalia", dial: "252" },
  { code: "CD", name: "DR Congo", dial: "243" },
] as const;

type EastAfricanCountry = (typeof EAST_AFRICAN_COUNTRIES)[number];

// Best-effort split of a stored E.164-ish value ("+254712345678") back
// into { country, national } so a restored draft (or an edited-then-
// reloaded value) reopens showing the right flag instead of always
// resetting to Kenya. Longer dial codes are checked first so e.g. "255"
// (Tanzania) isn't shadowed by a shorter accidental match.
function splitPhoneValue(value: string): { country: EastAfricanCountry; national: string } {
  const digits = value.replace(/^\+/, "");
  const sorted = [...EAST_AFRICAN_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of sorted) {
    if (digits.startsWith(country.dial)) {
      return { country, national: digits.slice(country.dial.length) };
    }
  }
  return { country: EAST_AFRICAN_COUNTRIES[0], national: digits };
}

export function PhoneField({
  id,
  value,
  onValueChange,
  onBlur,
  name,
  hasError,
  className = "",
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  hasError?: boolean;
  className?: string;
}) {
  const initial = splitPhoneValue(value ?? "");
  const [country, setCountry] = useState<EastAfricanCountry>(initial.country);
  const [national, setNational] = useState(initial.national);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function selectCountry(next: EastAfricanCountry) {
    setCountry(next);
    setOpen(false);
    onValueChange(national ? `+${next.dial}${national}` : "");
  }

  function handleNationalChange(raw: string) {
    const digitsOnly = raw.replace(/[^\d\s]/g, "");
    setNational(digitsOnly);
    onValueChange(digitsOnly.trim() ? `+${country.dial}${digitsOnly.replace(/\s/g, "")}` : "");
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative flex overflow-visible rounded-lg border border-slate-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] ${
        hasError ? "border-red-300" : ""
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select country dialing code"
        className="flex shrink-0 select-none items-center gap-1.5 rounded-l-lg border-r border-slate-300 bg-slate-100 px-3.5 text-sm text-navy-900 outline-none transition-colors hover:bg-slate-200 focus:outline-none focus-visible:outline-none"
      >
        <Flag code={country.code} className="h-3.5 w-5" />
        <ChevronDown className="h-3 w-3 text-slate-500" aria-hidden="true" />
      </button>

      <span
        style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
        className="flex shrink-0 select-none items-center pl-3.5 text-sm tabular-nums tracking-wide text-navy-900"
      >
        +{country.dial}
      </span>

      <input
        id={id}
        name={name}
        type="tel"
        value={national}
        onChange={(event) => handleNationalChange(event.target.value)}
        onBlur={onBlur}
        style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
        className="min-w-0 flex-1 rounded-r-lg bg-white px-3 py-3 text-sm tracking-wide text-navy-900 outline-none tabular-nums placeholder:text-slate-400 placeholder:font-body focus:outline-none focus-visible:outline-none"
      />

      {open ? (
        <ul
          role="listbox"
          aria-label="East African countries"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-1.5 shadow-[0_6px_12px_rgba(15,23,42,0.08),0_24px_48px_-16px_rgba(15,23,42,0.25)] sm:right-auto sm:w-64"
        >
          {EAST_AFRICAN_COUNTRIES.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                role="option"
                aria-selected={option.code === country.code}
                onClick={() => selectCountry(option)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                  option.code === country.code ? "bg-slate-50 text-navy-900" : "text-slate-700"
                }`}
              >
                <Flag code={option.code} className="h-3.5 w-5" />
                <span className="min-w-0 flex-1 truncate">{option.name}</span>
                <span
                  style={{ fontFamily: "var(--font-data, ui-monospace, monospace)" }}
                  className="shrink-0 tabular-nums tracking-wide text-slate-400"
                >
                  +{option.dial}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}