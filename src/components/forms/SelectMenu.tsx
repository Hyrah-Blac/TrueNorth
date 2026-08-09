import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

export interface SelectMenuOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  options: SelectMenuOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
}

/**
 * A custom, fully-styled dropdown for short option lists (mission type,
 * aircraft preference, etc). Same reasoning as AirportCombobox: a native
 * <select>'s open popup is rendered by the browser/OS, not by us, so it
 * can't be restyled — no custom highlight color, no removing its native
 * scroll-arrow buttons, nothing. This reimplements the same list with our
 * own markup so it actually matches the site.
 *
 * Owns its own label rather than being wrapped in <FormField> — see
 * AirportCombobox's doc comment for why: FormField's label depends on the
 * CSS `:placeholder-shown` pseudo-class, which behaves inconsistently on
 * readOnly inputs across browsers. Driving the float from `open`/
 * `selected` state directly removes that ambiguity.
 *
 * No search input, unlike AirportCombobox — these lists are short enough
 * (under a dozen items) that scanning beats typing.
 */
export function SelectMenu({ id, label, required, error, options, value, onChange, onBlur, hasError }: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `${id}-listbox`;

  const selected = options.find((option) => option.value === value) ?? null;
  const floated = open || Boolean(selected);
  const showsError = hasError || Boolean(error);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function openList() {
    setOpen(true);
    setHighlighted(Math.max(options.findIndex((option) => option.value === value), 0));
  }

  function chooseOption(option: SelectMenuOption) {
    onChange(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      event.preventDefault();
      openList();
      return;
    }
    if (!open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[highlighted];
      if (option) chooseOption(option);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div>
      <div ref={rootRef} className="relative">
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          readOnly
          value={selected?.label ?? ""}
          onFocus={openList}
          onClick={() => (open ? undefined : openList())}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Closes on blur (Tab, clicking straight into another field,
            // etc), not just on an outside click.
            setOpen(false);
            onBlur?.();
          }}
          className={`peer w-full cursor-pointer truncate rounded-md border bg-white px-3.5 pb-2.5 pt-6 text-sm text-slate-900 outline-none transition-colors duration-200 ${
            showsError
              ? "border-red-300 focus:border-red-400"
              : "border-slate-200 hover:border-slate-300 focus:border-sky-500"
          }`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-3.5 origin-left text-sm text-slate-500 transition-all duration-200 ease-editorial ${
            floated ? "top-2.5 -translate-y-0 text-xs" : "top-1/2 -translate-y-1/2"
          } ${open ? "text-sky-600" : ""}`}
        >
          {label} {required ? <span className="text-sky-600">*</span> : null}
        </label>

        {open ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-72 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-lifted ring-1 ring-black/[0.03]"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlighted;
              const isPlaceholder = option.value === "";
              return (
                <li key={option.value || "__placeholder__"} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseOption(option)}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition-colors duration-150 ${
                      isHighlighted ? "bg-sky-50" : ""
                    } ${isPlaceholder ? "text-slate-400" : "text-navy-900"}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check className="h-4 w-4 shrink-0 text-sky-500" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}