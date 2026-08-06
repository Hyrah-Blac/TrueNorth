import { Headset } from "lucide-react";
import { useContextualSuggestedPrompts } from "../lib/pageContext";
import type { SuggestedQuestion } from "../types";

const MAX_SUGGESTIONS = 5;

interface WelcomeScreenProps {
  onSelect: (prompt: string) => void;
  welcomeMessage: string;
  starterPrompts: string[];
}

export function WelcomeScreen({ onSelect, welcomeMessage, starterPrompts }: WelcomeScreenProps) {
  const contextualPrompts = useContextualSuggestedPrompts();

  // Page-specific prompts lead, since they're the most relevant to what
  // the visitor is already looking at — the admin-configured starter
  // prompts fill the remaining slots, capped so the list never grows
  // unbounded.
  const questions: SuggestedQuestion[] = [
    ...contextualPrompts.map((prompt) => ({ prompt })),
    ...starterPrompts.map((prompt) => ({ prompt })),
  ].slice(0, MAX_SUGGESTIONS);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-full max-w-xs flex-col justify-center">
        {/* rounded-xl + champagne gradient — same persona-marker treatment
            as the avatar everywhere else it appears (header, bubbles,
            typing indicator), so the concierge is visually the same
            "character" from the very first screen a visitor sees. */}
        <div className="animate-blur-in-editorial mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-champagne-500 to-champagne-600 text-navy-950 shadow-crisp">
          <Headset className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h2 className="animate-fade-up-editorial mt-6 text-center font-editorial text-[24px] font-light leading-[1.25] tracking-[-0.01em] text-navy-900">
          {welcomeMessage}
        </h2>
        <p className="animate-fade-up-editorial mx-auto mt-3 max-w-xs text-center font-body text-[13.5px] leading-relaxed tracking-[0.01em] text-slate-600">
          Ask about routes, aircraft, airports, or anything else about chartering with us.
        </p>

        {/* rounded-2xl kept — already matches the soft-premium radius used
            on the panel/bubbles/input, so the prompt cards stay as-is. */}
        <div className="animate-fade-up-editorial mt-8 flex flex-col gap-2">
          {questions.map((question) => (
            <button
              key={question.prompt}
              type="button"
              onClick={() => onSelect(question.prompt)}
              className="rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 text-left shadow-crisp transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-soft"
            >
              <span className="font-body text-[13.5px] font-normal leading-relaxed tracking-[0.01em] text-slate-600">
                {question.prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}