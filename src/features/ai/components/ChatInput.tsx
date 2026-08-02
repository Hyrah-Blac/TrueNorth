"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";

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
    <div
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
      className="border-t border-slate-100 bg-white px-6 pt-4 sm:px-10"
    >
      <div className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 transition-colors duration-300 focus-within:border-sky-400">
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
          className="max-h-[140px] flex-1 resize-none border-0 bg-transparent py-1.5 text-sm leading-relaxed text-navy-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white transition-all duration-300 ease-editorial hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1.5 flex items-center justify-between px-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">
          Enter to send · Shift + Enter for a new line
        </span>
        {showCounter ? (
          <span className={`text-[10px] ${remaining <= 0 ? "text-red-600" : "text-slate-400"}`}>{remaining}</span>
        ) : null}
      </div>
    </div>
  );
}
