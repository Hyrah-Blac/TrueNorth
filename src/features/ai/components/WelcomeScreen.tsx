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

  const questions: SuggestedQuestion[] = [
    ...contextualPrompts.map((prompt) => ({ prompt })),
    ...SUGGESTED_QUESTIONS,
  ].slice(0, MAX_SUGGESTIONS);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-full max-w-xs flex-col justify-center">

        <h2 className="animate-fade-up-editorial text-center font-editorial text-[24px] font-light leading-[1.25] tracking-[-0.01em] text-navy-900">
          How may I assist your journey?
        </h2>

        <div className="animate-fade-up-editorial mt-8 flex flex-col gap-2">
          {questions.map((question) => (
            <button
              key={question.prompt}
              type="button"
              onClick={() => onSelect(question.prompt)}
              className="rounded-2xl border border-slate-200/80 bg-white px-5 py-3.5 text-left transition-colors duration-200 hover:bg-slate-50"
            >
              <span className="text-[13.5px] font-normal leading-relaxed tracking-[0.01em] text-slate-600">
                {question.prompt}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}