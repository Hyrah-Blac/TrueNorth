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
    // Padding scales down slightly on narrow phones (px-5/py-6) and up on
    // the floating desktop panel (sm:px-10/sm:py-8) — on very short
    // viewports (landscape phones, small laptop windows) the parent's
    // overflow-y-auto is the safety net so content never gets clipped,
    // it just scrolls instead of overflowing.
    <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-10 sm:py-8">
      <div className="mx-auto flex min-h-full w-full max-w-[280px] flex-col justify-center sm:max-w-[300px]">
        {/* Avatar removed — the header directly above already shows the
            concierge avatar and "AI Concierge" label, so repeating it
            here was redundant and just pushed everything else down. */}
        <h2 className="animate-fade-up-editorial break-words text-center font-editorial text-[19px] font-light leading-[1.3] tracking-[-0.01em] text-navy-900 sm:text-[21px]">
          {welcomeMessage}
        </h2>
        {/* Subtitle now names concrete things the concierge can do
            (routes / aircraft / availability, matching the input
            placeholder) instead of re-stating the headline's "ask me
            anything" in different words. */}
        <p className="animate-fade-up-editorial mx-auto mt-2 max-w-[26ch] text-center font-body text-[12px] leading-relaxed tracking-[0.01em] text-slate-600 sm:text-[12.5px]">
          Ask about routes, aircraft, or availability.
        </p>

        <div className="animate-fade-up-editorial mt-6 flex flex-col gap-2">
          {questions.map((question) => (
            <button
              key={question.prompt}
              type="button"
              onClick={() => onSelect(question.prompt)}
              // min-h-11 (44px) keeps the tap target comfortable on
              // touchscreens even though the text itself is small — the
              // padding alone wouldn't reliably hit that on every device.
              className="flex min-h-11 items-center rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-left transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="font-body text-[12px] font-normal leading-relaxed tracking-[0.01em] text-slate-600 sm:text-[12.5px]">
                {question.prompt}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}