import { Compass, ArrowUpRight } from "lucide-react";
import { useContextualSuggestedPrompts } from "../lib/pageContext";
import type { SuggestedQuestion } from "../types";

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { prompt: "I need a flight from Nairobi to Mombasa." },
  { prompt: "Recommend an aircraft for six passengers." },
  { prompt: "Can pets travel onboard?" },
  { prompt: "What aircraft is best for safari flights?" },
  { prompt: "What destinations do you operate?" },
];

const MAX_SUGGESTIONS = 5;

export function WelcomeScreen({ onSelect }: { onSelect: (prompt: string) => void }) {
  const contextualPrompts = useContextualSuggestedPrompts();

  // Page-specific prompts lead, since they're the most relevant to what
  // the visitor is already looking at — generic ones fill the remaining
  // slots, capped so the list never grows unbounded.
  const questions: SuggestedQuestion[] = [
    ...contextualPrompts.map((prompt) => ({ prompt })),
    ...SUGGESTED_QUESTIONS,
  ].slice(0, MAX_SUGGESTIONS);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center">
        <div className="animate-blur-in-editorial mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-navy-950 text-white">
          <Compass className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h2 className="animate-fade-up-editorial mt-6 text-center font-editorial text-2xl font-light leading-snug text-navy-900 sm:text-[26px]">
          How may I assist your journey?
        </h2>
        <p className="animate-fade-up-editorial mx-auto mt-3 max-w-xs text-center text-sm leading-relaxed text-slate-600">
          Ask about routes, aircraft, airports, or anything else about chartering with us.
        </p>

        <div className="animate-fade-up-editorial mt-8 flex flex-col gap-2.5">
          {questions.map((question) => (
            <button
              key={question.prompt}
              type="button"
              onClick={() => onSelect(question.prompt)}
              className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-left transition-colors duration-300 ease-editorial hover:border-sky-400 hover:bg-sky-50/40"
            >
              <span className="text-sm text-slate-700 group-hover:text-navy-900">{question.prompt}</span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-slate-400 transition-colors duration-300 group-hover:text-sky-500"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
