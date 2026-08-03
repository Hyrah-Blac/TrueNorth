"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  maxLength: number;
}

const MAX_TEXTAREA_HEIGHT_PX = 140;

export function ChatInput({ onSend, disabled, maxLength }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  const remaining = maxLength - value.length;
  const showCounter = remaining <= 200;

  return (
    <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-3">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 transition-colors duration-200 focus-within:border-slate-300 focus-within:bg-white">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          maxLength={maxLength}
          placeholder="Ask about routes, aircraft, or availability…"
          aria-label="Message the AI Concierge"
          className="max-h-[140px] flex-1 resize-none border-0 bg-transparent py-1 text-[14px] font-normal leading-relaxed tracking-[0.005em] text-navy-900 placeholder:font-light placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="group mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-all duration-200 ease-out hover:scale-105 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:pointer-events-none disabled:scale-100 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          <Send
            className="h-4 w-4 translate-x-[-1px] transition-transform duration-200 group-hover:translate-x-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>
      {showCounter && (
        <div className="mt-1.5 flex justify-end px-1">
          <span className={`text-[10px] font-medium tracking-[0.04em] tabular-nums ${remaining <= 0 ? "text-red-600" : "text-slate-400"}`}>{remaining}</span>
        </div>
      )}
    </div>
  );
}