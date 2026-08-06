import { MessageSquarePlus } from "lucide-react";

interface ConfirmNewConversationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Replaces the panel body (message list / welcome screen) when the
 * visitor clicks "new conversation" — a dedicated, full-attention step
 * for what is effectively a destructive action (the current thread is
 * lost), rather than a small inline "Confirm?" label next to the
 * trigger icon, which is easy to miss and doesn't carry enough weight
 * for the action it's guarding.
 */
export function ConfirmNewConversation({ onConfirm, onCancel }: ConfirmNewConversationProps) {
  return (
    <div className="animate-fade-up-editorial flex flex-1 flex-col items-center justify-center px-8 py-10 text-center sm:px-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-champagne-500 to-champagne-600 text-navy-950 shadow-crisp">
        <MessageSquarePlus className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <h3 className="mt-5 font-editorial text-[20px] font-light leading-[1.3] tracking-[-0.01em] text-navy-900">
        Start a new conversation?
      </h3>
      <p className="mt-2.5 max-w-[26ch] font-body text-[13.5px] leading-relaxed tracking-[0.01em] text-slate-600">
        This clears your current conversation with the concierge. It can&rsquo;t be recovered afterward.
      </p>

      <div className="mt-7 flex w-full max-w-[280px] flex-col gap-2.5">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-crisp transition-all duration-200 ease-editorial hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-soft active:translate-y-0"
        >
          Start new conversation
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-800"
        >
          Keep this conversation
        </button>
      </div>
    </div>
  );
}